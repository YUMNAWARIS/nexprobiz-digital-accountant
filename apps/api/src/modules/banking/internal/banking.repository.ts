import type { Knex } from 'knex';
import type { BankImportRow, BankTransactionRow } from '@fa/database';
import type { AnyCtx, TxCtx } from '@/core/context';
import { TenantScopedRepository } from '@/core/scoped-repository';

export type BankTxJoined = BankTransactionRow & {
  reconciliation_id: string | null;
  target_type: string | null;
  target_id: string | null;
};

export class BankImportsRepository extends TenantScopedRepository<BankImportRow> {
  constructor(db: Knex) {
    super(db, 'bank_imports', 'BankImport');
  }
  create(
    tx: TxCtx,
    row: Omit<BankImportRow, 'id' | 'tenant_id' | 'created_at'>,
  ): Promise<BankImportRow> {
    return this.insertOne(tx, row as never);
  }
}

export class BankTransactionsRepository extends TenantScopedRepository<BankTransactionRow> {
  constructor(db: Knex) {
    super(db, 'bank_transactions', 'BankTransaction');
  }
  /** Returns the row when inserted, null when the (tenant_id, external_key) already exists. */
  async insertIfNew(
    tx: TxCtx,
    row: Omit<BankTransactionRow, 'id' | 'tenant_id' | 'created_at'>,
  ): Promise<BankTransactionRow | null> {
    const [r] = await tx
      .trx<BankTransactionRow>('bank_transactions')
      .insert({ ...row, tenant_id: tx.tenantId })
      .onConflict(['tenant_id', 'external_key'])
      .ignore()
      .returning('*');
    return r ?? null;
  }
  async update(
    tx: TxCtx,
    id: string,
    patch: Partial<BankTransactionRow>,
  ): Promise<BankTransactionRow> {
    const [r] = await this.q(tx)
      .where('id', id)
      .update(patch as never)
      .returning('*');
    return r as BankTransactionRow;
  }
  private joinedBase(ctx: AnyCtx) {
    return this.q(ctx)
      .leftJoin('reconciliations as rc', 'rc.bank_transaction_id', 'bank_transactions.id')
      .select(
        'bank_transactions.*',
        'rc.id as reconciliation_id',
        'rc.target_type',
        'rc.target_id',
      );
  }
  async joined(ctx: AnyCtx, id: string): Promise<BankTxJoined | null> {
    return (
      ((await this.joinedBase(ctx).where('bank_transactions.id', id).first()) as
        BankTxJoined | undefined) ?? null
    );
  }
  async list(
    ctx: AnyCtx,
    f: {
      classification?: string;
      dateFrom?: string;
      dateTo?: string;
      minAmount?: string;
      maxAmount?: string;
      reconciled?: boolean;
      page: number;
      pageSize: number;
    },
  ) {
    const base = this.q(ctx)
      .leftJoin('reconciliations as rc', 'rc.bank_transaction_id', 'bank_transactions.id')
      .modify((qb): void => {
        if (f.classification) qb.where('bank_transactions.classification', f.classification);
        if (f.dateFrom) qb.where('bank_transactions.booking_date', '>=', f.dateFrom);
        if (f.dateTo) qb.where('bank_transactions.booking_date', '<=', f.dateTo);
        if (f.minAmount) qb.where('bank_transactions.amount', '>=', f.minAmount);
        if (f.maxAmount) qb.where('bank_transactions.amount', '<=', f.maxAmount);
        if (f.reconciled === true) qb.whereNotNull('rc.id');
        if (f.reconciled === false) qb.whereNull('rc.id');
      });
    const [{ count } = { count: '0' }] = (await base
      .clone()
      .count<{ count: string }[]>('bank_transactions.id as count')) as { count: string }[];
    const rows = (await base
      .clone()
      .select('bank_transactions.*', 'rc.id as reconciliation_id', 'rc.target_type', 'rc.target_id')
      .orderBy('bank_transactions.booking_date', 'desc')
      .orderBy('bank_transactions.created_at', 'desc')
      .offset((f.page - 1) * f.pageSize)
      .limit(f.pageSize)) as BankTxJoined[];
    return { rows, total: Number(count) };
  }
}
