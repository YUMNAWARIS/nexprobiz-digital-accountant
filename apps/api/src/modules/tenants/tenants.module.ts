import type { Knex } from 'knex';
import { TenantsRepository } from './internal/tenants.repository';
import { TenantsServiceImpl } from './tenants.service';
export function createTenantsModule(deps: { db: Knex }) {
  return { name: 'tenants', service: new TenantsServiceImpl(new TenantsRepository(deps.db)) };
}
