import type { Knex } from 'knex';
import type { TaxRuleSetRow, TaxRuleValueRow } from '@fa/database';
import type { AnyCtx } from '@/core/context';
import { conn } from '@/core/scoped-repository';

export class TaxRulesRepository {
  constructor(private readonly db: Knex) {}
  async activeSet(
    ctx: AnyCtx,
    jurisdiction: string,
    taxYear: number,
  ): Promise<(TaxRuleSetRow & { values: TaxRuleValueRow[] }) | null> {
    const c = conn(this.db, ctx);
    const set = await c<TaxRuleSetRow>('tax_rule_sets')
      .where({ jurisdiction, tax_year: taxYear, active: true })
      .first();
    if (!set) return null;
    const values = await c<TaxRuleValueRow>('tax_rule_values').where({ rule_set_id: set.id });
    return { ...set, values };
  }
}
