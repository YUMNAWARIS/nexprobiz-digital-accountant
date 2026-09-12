import type { Knex } from 'knex';
import type { AnyCtx } from '@/core/context';
import { conn } from '@/core/scoped-repository';

/**
 * Read model over journal_lines (POSTED entries only; reversals net to zero by construction),
 * invoices, expenses, receipts and bank_transactions. Every query includes tenant_id (ARCH-006)
 * and RLS backs it up. All sums come back as NUMERIC strings.
 */
export class ReportingRepository {
  constructor(private readonly db: Knex) {}

  /** Net balance per account for the year: SUM(CREDIT) - SUM(DEBIT) as string. */
  async accountBalances(
    ctx: AnyCtx,
    year: number,
  ): Promise<
    Array<{ account_number: string; category_code: string | null; credit: string; debit: string }>
  > {
    return conn(
      this.db,
      ctx,
    )('journal_lines as jl')
      .join('journal_entries as je', 'je.id', 'jl.journal_entry_id')
      .where('je.tenant_id', ctx.tenantId)
      .whereRaw('EXTRACT(YEAR FROM je.posting_date) = ?', [year])
      .groupBy('jl.account_number', 'jl.category_code')
      .select('jl.account_number', 'jl.category_code')
      .select(
        this.db.raw(
          `COALESCE(SUM(CASE WHEN jl.direction = 'CREDIT' THEN jl.amount END), 0)::numeric(15,2)::text AS credit`,
        ),
      )
      .select(
        this.db.raw(
          `COALESCE(SUM(CASE WHEN jl.direction = 'DEBIT' THEN jl.amount END), 0)::numeric(15,2)::text AS debit`,
        ),
      );
  }

  async outstandingInvoices(ctx: AnyCtx, year: number): Promise<string> {
    const r = await conn(
      this.db,
      ctx,
    )('invoices')
      .where({ tenant_id: ctx.tenantId })
      .whereIn('status', ['FINALIZED', 'PARTIALLY_PAID'])
      .whereRaw('EXTRACT(YEAR FROM issue_date) = ?', [year])
      .first<{ total: string }>(
        this.db.raw('COALESCE(SUM(outstanding_amount), 0)::numeric(15,2)::text AS total'),
      );
    return r?.total ?? '0.00';
  }

  async workItems(ctx: AnyCtx): Promise<{
    unreviewedBankTransactions: number;
    receiptsNeedingReview: number;
    draftExpenses: number;
  }> {
    const c = conn(this.db, ctx);
    const [b, r, e] = await Promise.all([
      c('bank_transactions')
        .where({ tenant_id: ctx.tenantId, classification: 'UNREVIEWED' })
        .count<{ count: string }[]>('* as count'),
      c('receipts')
        .where({ tenant_id: ctx.tenantId, status: 'NEEDS_REVIEW' })
        .count<{ count: string }[]>('* as count'),
      c('expenses')
        .where({ tenant_id: ctx.tenantId, status: 'DRAFT' })
        .count<{ count: string }[]>('* as count'),
    ]);
    return {
      unreviewedBankTransactions: Number(b[0]?.count ?? 0),
      receiptsNeedingReview: Number(r[0]?.count ?? 0),
      draftExpenses: Number(e[0]?.count ?? 0),
    };
  }
}
