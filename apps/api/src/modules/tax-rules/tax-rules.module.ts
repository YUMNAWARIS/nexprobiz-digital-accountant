import type { Knex } from 'knex';
import { TaxRulesRepository } from './internal/tax-rules.repository';
import { TaxRulesServiceImpl } from './tax-rules.service';
export function createTaxRulesModule(deps: { db: Knex }) {
  return { name: 'tax-rules', service: new TaxRulesServiceImpl(new TaxRulesRepository(deps.db)) };
}
