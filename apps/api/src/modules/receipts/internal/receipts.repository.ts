import type { Knex } from 'knex';
import type { OcrRunRow, ReceiptRow } from '@fa/database';
import type { AnyCtx, TxCtx } from '@/core/context';
import { TenantScopedRepository } from '@/core/scoped-repository';

export class ReceiptsRepository extends TenantScopedRepository<ReceiptRow> {
  constructor(db: Knex) {
    super(db, 'receipts', 'Receipt');
  }
  create(
    tx: TxCtx,
    row: Omit<ReceiptRow, 'id' | 'tenant_id' | 'created_at' | 'updated_at'>,
  ): Promise<ReceiptRow> {
    return this.insertOne(tx, row as never);
  }
  async update(tx: TxCtx, id: string, patch: Partial<ReceiptRow>): Promise<ReceiptRow> {
    const [r] = await this.q(tx)
      .where('id', id)
      .update(patch as never)
      .returning('*');
    return r as ReceiptRow;
  }
  async list(ctx: AnyCtx, f: { status?: string; page: number; pageSize: number }) {
    const base = this.q(ctx).modify((qb): void => {
      if (f.status) qb.where('receipts.status', f.status);
    });
    const [{ count } = { count: '0' }] = (await base
      .clone()
      .count<{ count: string }[]>('* as count')) as { count: string }[];
    const rows = (await base
      .clone()
      .leftJoin('expenses', 'expenses.receipt_id', 'receipts.id')
      .select('receipts.*', 'expenses.id as expense_id')
      .orderBy('receipts.created_at', 'desc')
      .offset((f.page - 1) * f.pageSize)
      .limit(f.pageSize)) as Array<ReceiptRow & { expense_id: string | null }>;
    return { rows, total: Number(count) };
  }
  async expenseIdFor(ctx: AnyCtx, receiptId: string): Promise<string | null> {
    if (!('trx' in ctx)) throw new Error('requires transaction');
    const r = await ctx
      .trx('expenses')
      .where({ receipt_id: receiptId, tenant_id: ctx.tenantId })
      .first<{ id: string }>('id');
    return r?.id ?? null;
  }
}

export class OcrRunsRepository extends TenantScopedRepository<OcrRunRow> {
  constructor(db: Knex) {
    super(db, 'ocr_runs', 'OcrRun');
  }
  create(tx: TxCtx, row: Omit<OcrRunRow, 'id' | 'tenant_id' | 'created_at'>): Promise<OcrRunRow> {
    return this.insertOne(tx, row as never);
  }
  async update(tx: TxCtx, id: string, patch: Partial<OcrRunRow>): Promise<OcrRunRow> {
    const [r] = await this.q(tx)
      .where('id', id)
      .update(patch as never)
      .returning('*');
    return r as OcrRunRow;
  }
}
