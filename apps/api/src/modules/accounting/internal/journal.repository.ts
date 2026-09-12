import type { Knex } from 'knex';
import type { JournalEntryRow, JournalLineRow } from '@fa/database';
import type { AnyCtx, TxCtx } from '@/core/context';
import { TenantScopedRepository } from '@/core/scoped-repository';
import type { DraftLine } from '../domain/posting-rules';

export class JournalRepository extends TenantScopedRepository<JournalEntryRow> {
  constructor(db: Knex) {
    super(db, 'journal_entries', 'JournalEntry');
  }
  createEntry(
    tx: TxCtx,
    row: Omit<JournalEntryRow, 'id' | 'tenant_id' | 'created_at'>,
  ): Promise<JournalEntryRow> {
    return this.insertOne(tx, row as never);
  }
  async insertLines(
    tx: TxCtx,
    entryId: string,
    lines: readonly DraftLine[],
  ): Promise<JournalLineRow[]> {
    return await tx
      .trx<JournalLineRow>('journal_lines')
      .insert(
        lines.map((l) => ({
          journal_entry_id: entryId,
          account_number: l.accountNumber,
          counter_account: l.counterAccount,
          category_code: l.categoryCode,
          direction: l.direction,
          amount: l.amount,
          tax_amount: l.taxAmount,
          tax_rate: l.taxRate,
        })),
      )
      .returning('*');
  }
  linesForEntry(ctx: AnyCtx, entryId: string): Promise<JournalLineRow[]> {
    const c = 'trx' in ctx ? ctx.trx : null;
    if (!c) throw new Error('journal lines require a transaction (RLS)');
    return c<JournalLineRow>('journal_lines')
      .where({ journal_entry_id: entryId })
      .orderBy('created_at', 'asc')
      .orderBy('id', 'asc');
  }
  async markReversed(tx: TxCtx, id: string): Promise<void> {
    await this.q(tx).where('id', id).update({ status: 'REVERSED' });
  }
  forSource(ctx: AnyCtx, sourceType: string, sourceId: string): Promise<JournalEntryRow[]> {
    return this.q(ctx)
      .where({ source_type: sourceType, source_id: sourceId })
      .orderBy('created_at', 'asc');
  }
}
