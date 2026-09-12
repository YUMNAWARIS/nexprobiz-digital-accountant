import type { Knex } from 'knex';
import type { ExportRow, JournalEntryRow } from '@fa/database';
import type { AnyCtx, TxCtx } from '@/core/context';
import { TenantScopedRepository } from '@/core/scoped-repository';

export class ExportsRepository extends TenantScopedRepository<ExportRow> {
  constructor(db: Knex) {
    super(db, 'exports', 'Export');
  }
  create(tx: TxCtx, row: Omit<ExportRow, 'id' | 'tenant_id' | 'created_at'>): Promise<ExportRow> {
    return this.insertOne(tx, row as never);
  }
  async update(tx: TxCtx, id: string, patch: Partial<ExportRow>): Promise<ExportRow> {
    const [r] = await this.q(tx)
      .where('id', id)
      .update(patch as never)
      .returning('*');
    return r as ExportRow;
  }
  listAll(ctx: AnyCtx): Promise<ExportRow[]> {
    return this.q(ctx).orderBy('created_at', 'desc');
  }
  /** Journal entry ids in the period. Both POSTED and REVERSED entries were posted; drafts never have entries. */
  async entryIdsInPeriod(ctx: AnyCtx, from: string, to: string): Promise<string[]> {
    if (!('trx' in ctx)) throw new Error('requires transaction');
    const rows = await ctx
      .trx<JournalEntryRow>('journal_entries')
      .where({ tenant_id: ctx.tenantId })
      .whereBetween('posting_date', [from, to])
      .orderBy('posting_date', 'asc')
      .orderBy('created_at', 'asc')
      .select('id');
    return rows.map((r) => r.id);
  }
  /** Human references for Belegfeld 1: invoice numbers and merchants. */
  async references(ctx: AnyCtx): Promise<Map<string, string>> {
    if (!('trx' in ctx)) throw new Error('requires transaction');
    const map = new Map<string, string>();
    const invoices = await ctx
      .trx('invoices')
      .where({ tenant_id: ctx.tenantId })
      .whereNotNull('invoice_number')
      .select<{ id: string; invoice_number: string }[]>('id', 'invoice_number');
    for (const i of invoices) map.set(`INVOICE:${i.id}`, i.invoice_number);
    const payments = await ctx
      .trx('payments as p')
      .join('invoices as i', 'i.id', 'p.invoice_id')
      .where('p.tenant_id', ctx.tenantId)
      .select<{ id: string; invoice_number: string | null }[]>('p.id', 'i.invoice_number');
    for (const p of payments) map.set(`PAYMENT:${p.id}`, p.invoice_number ?? p.id.slice(0, 8));
    const expenses = await ctx
      .trx('expenses')
      .where({ tenant_id: ctx.tenantId })
      .select<{ id: string; merchant: string }[]>('id', 'merchant');
    for (const e of expenses) map.set(`EXPENSE:${e.id}`, e.merchant);
    return map;
  }
}
