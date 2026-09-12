import type { Knex } from 'knex';
import type { ExpenseRow } from '@fa/database';
import type { AnyCtx, TxCtx } from '@/core/context';
import { TenantScopedRepository } from '@/core/scoped-repository';

export type ExpenseJoined = ExpenseRow & { category_code: string; category_name: string };

export class ExpensesRepository extends TenantScopedRepository<ExpenseRow> {
  constructor(db: Knex) {
    super(db, 'expenses', 'Expense');
  }
  create(
    tx: TxCtx,
    row: Omit<ExpenseRow, 'id' | 'tenant_id' | 'created_at' | 'updated_at'>,
  ): Promise<ExpenseRow> {
    return this.insertOne(tx, row as never);
  }
  async update(tx: TxCtx, id: string, patch: Partial<ExpenseRow>): Promise<ExpenseRow> {
    const [r] = await this.q(tx)
      .where('id', id)
      .update(patch as never)
      .returning('*');
    return r as ExpenseRow;
  }
  async joined(ctx: AnyCtx, id: string): Promise<ExpenseJoined | null> {
    const r = (await this.q(ctx)
      .join('account_categories as c', 'c.id', 'expenses.category_id')
      .where('expenses.id', id)
      .select('expenses.*', 'c.code as category_code', 'c.name_de as category_name')
      .first()) as ExpenseJoined | undefined;
    return r ?? null;
  }
  async list(
    ctx: AnyCtx,
    f: {
      status?: string;
      categoryId?: string;
      dateFrom?: string;
      dateTo?: string;
      search?: string;
      page: number;
      pageSize: number;
    },
  ) {
    const base = this.q(ctx).modify((qb): void => {
      if (f.status) qb.where('expenses.status', f.status);
      if (f.categoryId) qb.where('expenses.category_id', f.categoryId);
      if (f.dateFrom) qb.where('expenses.expense_date', '>=', f.dateFrom);
      if (f.dateTo) qb.where('expenses.expense_date', '<=', f.dateTo);
      if (f.search)
        qb.where((w): void => {
          void w
            .whereILike('expenses.merchant', `%${f.search}%`)
            .orWhereILike('expenses.description', `%${f.search}%`);
        });
    });
    const [{ count } = { count: '0' }] = (await base
      .clone()
      .count<{ count: string }[]>('* as count')) as { count: string }[];
    const rows = (await base
      .clone()
      .join('account_categories as c', 'c.id', 'expenses.category_id')
      .select('expenses.*', 'c.code as category_code', 'c.name_de as category_name')
      .orderBy('expenses.expense_date', 'desc')
      .orderBy('expenses.created_at', 'desc')
      .offset((f.page - 1) * f.pageSize)
      .limit(f.pageSize)) as ExpenseJoined[];
    return { rows, total: Number(count) };
  }
}
