import { createHash } from 'node:crypto';
import {
  moneyFromDb,
  type BankClassification,
  type BankImportResponse,
  type BankTransactionListResponse,
  type BankTransactionView,
  type ListBankTransactionsQuery,
} from '@fa/contracts';
import type { AnyCtx, TxCtx } from '@/core/context';
import { AppError, NotFoundError } from '@/core/errors';
import type { AuditService } from '../audit';
import type { OutboxService } from '../outbox';
import type { BankingService } from './banking.contract';
import { externalKey, parseBankCsv } from './domain/bank-csv';
import type {
  BankImportsRepository,
  BankTransactionsRepository,
  BankTxJoined,
} from './internal/banking.repository';

function toView(r: BankTxJoined): BankTransactionView {
  return {
    id: r.id,
    bankImportId: r.bank_import_id,
    bookingDate: r.booking_date,
    valueDate: r.value_date,
    description: r.description,
    counterparty: r.counterparty,
    amount: moneyFromDb(r.amount),
    currency: r.currency,
    classification: r.classification as BankClassification,
    reconciliation: r.reconciliation_id
      ? {
          id: r.reconciliation_id,
          targetType: r.target_type as 'PAYMENT' | 'EXPENSE',
          targetId: r.target_id!,
        }
      : null,
    createdAt: r.created_at.toISOString(),
  };
}

export class BankingServiceImpl implements BankingService {
  constructor(
    private readonly imports: BankImportsRepository,
    private readonly txs: BankTransactionsRepository,
    private readonly audit: AuditService,
    private readonly outbox: OutboxService,
  ) {}

  /** §26 / Story 10.1 / 10.2 — dedup via UNIQUE(tenant_id, external_key). */
  async importCsv(
    tx: TxCtx,
    file: { buffer: Buffer; filename: string },
  ): Promise<BankImportResponse> {
    const text = file.buffer.toString('utf8');
    const parsed = parseBankCsv(text);
    if (
      parsed.errors.length &&
      parsed.errors[0]!.line === 1 &&
      parsed.rows.length === 0 &&
      parsed.rowCount === 0
    ) {
      throw new AppError('BANK_CSV_HEADER_MISMATCH', parsed.errors[0]!.message, [
        { field: 'file', message: parsed.errors[0]!.message },
      ]);
    }
    const imp = await this.imports.create(tx, {
      filename: file.filename.slice(0, 255),
      sha256: createHash('sha256').update(file.buffer).digest('hex'),
      row_count: parsed.rowCount,
      imported_count: 0,
      duplicate_count: 0,
      failed_count: parsed.errors.length,
    });
    let imported = 0;
    let duplicates = 0;
    for (const { row } of parsed.rows) {
      const created = await this.txs.insertIfNew(tx, {
        bank_import_id: imp.id,
        external_key: externalKey(row),
        booking_date: row.booking_date,
        value_date: row.value_date,
        description: row.description,
        counterparty: row.counterparty,
        amount: row.amount,
        currency: row.currency,
        classification: 'UNREVIEWED',
      });
      if (!created) {
        duplicates++;
        continue;
      }
      imported++;
      await this.outbox.publish(tx, {
        eventType: 'BankTransactionImported',
        aggregateId: created.id,
        payload: { bankTransactionId: created.id, bankImportId: imp.id },
      });
    }
    await tx
      .trx('bank_imports')
      .where({ id: imp.id, tenant_id: tx.tenantId })
      .update({ imported_count: imported, duplicate_count: duplicates });
    return {
      importId: imp.id,
      rows: parsed.rowCount,
      imported,
      duplicates,
      failed: parsed.errors.length,
      errors: parsed.errors,
    };
  }

  async list(ctx: AnyCtx, q: ListBankTransactionsQuery): Promise<BankTransactionListResponse> {
    const { rows, total } = await this.txs.list(ctx, q);
    return {
      data: rows.map(toView),
      meta: {
        page: q.page,
        pageSize: q.pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / q.pageSize)),
      },
    };
  }
  async get(ctx: AnyCtx, id: string): Promise<BankTransactionView> {
    const r = await this.txs.joined(ctx, id);
    if (!r) throw new NotFoundError('BankTransaction', id);
    return toView(r);
  }

  /** §27 / Story 10.3 — classification change is audited. */
  async classify(
    tx: TxCtx,
    id: string,
    classification: BankClassification,
  ): Promise<BankTransactionView> {
    const r = await this.txs.requireByIdForUpdate(tx, id);
    if (r.classification !== classification) {
      await this.txs.update(tx, id, { classification });
      await this.audit.record(tx, {
        eventType: 'BANK_TRANSACTION_CLASSIFIED',
        entityType: 'BANK_TRANSACTION',
        entityId: id,
        metadata: { from: r.classification, to: classification },
      });
      await this.outbox.publish(tx, {
        eventType: 'BankTransactionClassified',
        aggregateId: id,
        payload: { bankTransactionId: id, classification },
      });
    }
    return this.get(tx, id);
  }
}
