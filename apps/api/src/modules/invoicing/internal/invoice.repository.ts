import type { Knex } from 'knex';
import type { InvoiceLineRow, InvoiceRow, InvoiceSequenceRow } from '@fa/database';
import type { AnyCtx, TxCtx } from '@/core/context';
import { TenantScopedRepository } from '@/core/scoped-repository';

export class InvoiceRepository extends TenantScopedRepository<InvoiceRow> {
  constructor(db: Knex) {
    super(db, 'invoices', 'Invoice');
  }
  create(
    tx: TxCtx,
    row: Omit<InvoiceRow, 'id' | 'tenant_id' | 'created_at' | 'updated_at'>,
  ): Promise<InvoiceRow> {
    return this.insertOne(tx, row as never);
  }
  async update(tx: TxCtx, id: string, patch: Partial<InvoiceRow>): Promise<InvoiceRow> {
    const [r] = await this.q(tx)
      .where('id', id)
      .update(patch as never)
      .returning('*');
    return r as InvoiceRow;
  }
  lines(ctx: AnyCtx, invoiceId: string): Promise<InvoiceLineRow[]> {
    if (!('trx' in ctx)) throw new Error('invoice lines require a transaction (RLS)');
    return ctx
      .trx<InvoiceLineRow>('invoice_lines')
      .where({ invoice_id: invoiceId })
      .orderBy('position', 'asc');
  }
  async replaceLines(
    tx: TxCtx,
    invoiceId: string,
    lines: Array<Omit<InvoiceLineRow, 'id' | 'invoice_id'>>,
  ): Promise<InvoiceLineRow[]> {
    await tx.trx('invoice_lines').where({ invoice_id: invoiceId }).delete();
    if (!lines.length) return [];
    return await tx
      .trx<InvoiceLineRow>('invoice_lines')
      .insert(lines.map((l) => ({ ...l, invoice_id: invoiceId })))
      .returning('*');
  }
  async list(
    ctx: AnyCtx,
    f: {
      status?: string;
      clientId?: string;
      dateFrom?: string;
      dateTo?: string;
      search?: string;
      page: number;
      pageSize: number;
    },
  ) {
    const base = this.q(ctx).modify((qb): void => {
      if (f.status) qb.where('invoices.status', f.status);
      if (f.clientId) qb.where('invoices.client_id', f.clientId);
      if (f.dateFrom) qb.where('invoices.issue_date', '>=', f.dateFrom);
      if (f.dateTo) qb.where('invoices.issue_date', '<=', f.dateTo);
      if (f.search)
        qb.where((w): void => {
          void w
            .whereILike('invoices.invoice_number', `%${f.search}%`)
            .orWhereILike('invoices.client_name_snapshot', `%${f.search}%`)
            .orWhereILike('clients.name', `%${f.search}%`);
        });
    });
    const [{ count } = { count: '0' }] = (await base
      .clone()
      .leftJoin('clients', 'clients.id', 'invoices.client_id')
      .count<{ count: string }[]>('invoices.id as count')) as { count: string }[];
    const rows = (await base
      .clone()
      .leftJoin('clients', 'clients.id', 'invoices.client_id')
      .select('invoices.*', 'clients.name as client_name')
      .orderBy('invoices.created_at', 'desc')
      .offset((f.page - 1) * f.pageSize)
      .limit(f.pageSize)) as Array<InvoiceRow & { client_name: string | null }>;
    return { rows, total: Number(count) };
  }

  /** §11.7 — allocate the next number under a row lock. One row per tenant; year rollover resets. */
  async allocateNumber(tx: TxCtx, year: number): Promise<number> {
    // Seed the row idempotently so two first-ever finalizations cannot race on the INSERT.
    await tx.trx.raw(
      'INSERT INTO invoice_sequences (tenant_id, year, next_number, updated_at) VALUES (?, ?, 1, ?) ON CONFLICT (tenant_id) DO NOTHING',
      [tx.tenantId, year, tx.now],
    );
    const row = (await tx
      .trx<InvoiceSequenceRow>('invoice_sequences')
      .where({ tenant_id: tx.tenantId })
      .forUpdate()
      .first()) as InvoiceSequenceRow;
    const seq = row.year === year ? row.next_number : 1;
    await tx
      .trx('invoice_sequences')
      .where({ tenant_id: tx.tenantId })
      .update({ year, next_number: seq + 1, updated_at: tx.now });
    return seq;
  }
}
