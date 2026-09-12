import type { Knex } from 'knex';
import type { AccountCategoryRow, ChartAccountMappingRow } from '@fa/database';
import type { AnyCtx } from '@/core/context';
import { conn } from '@/core/scoped-repository';

/** Global reference data (§11.18 / §11.19) — not tenant-scoped. */
export class ChartRepository {
  constructor(private readonly db: Knex) {}
  categories(ctx: AnyCtx): Promise<AccountCategoryRow[]> {
    return conn(
      this.db,
      ctx,
    )<AccountCategoryRow>('account_categories')
      .orderBy('type')
      .orderBy('code');
  }
  category(ctx: AnyCtx, id: string): Promise<AccountCategoryRow | undefined> {
    return conn(this.db, ctx)<AccountCategoryRow>('account_categories').where({ id }).first();
  }
  categoryByCode(ctx: AnyCtx, code: string): Promise<AccountCategoryRow | undefined> {
    return conn(this.db, ctx)<AccountCategoryRow>('account_categories').where({ code }).first();
  }
  mapping(
    ctx: AnyCtx,
    categoryId: string,
    chart: string,
    fiscalYear: number,
  ): Promise<ChartAccountMappingRow | undefined> {
    return conn(
      this.db,
      ctx,
    )<ChartAccountMappingRow>('chart_account_mappings')
      .where({ category_id: categoryId, chart, fiscal_year: fiscalYear })
      .first();
  }
  mappingsForChart(
    ctx: AnyCtx,
    chart: string,
    fiscalYear: number,
  ): Promise<Array<ChartAccountMappingRow & { code: string; name_de: string; type: string }>> {
    return conn(
      this.db,
      ctx,
    )('chart_account_mappings as m')
      .join('account_categories as c', 'c.id', 'm.category_id')
      .where({ 'm.chart': chart, 'm.fiscal_year': fiscalYear })
      .select('m.*', 'c.code', 'c.name_de', 'c.type');
  }
}
