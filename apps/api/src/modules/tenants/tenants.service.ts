import type { Knex } from 'knex';
import type { TenantsService } from './tenants.contract';
import type { TenantsRepository } from './internal/tenants.repository';

export class TenantsServiceImpl implements TenantsService {
  constructor(private readonly repo: TenantsRepository) {}
  async createForUser(input: { userId: string; name: string }, trx?: Knex.Transaction) {
    const t = await this.repo.insertTenant(input.name, trx);
    await this.repo.insertMembership(
      { tenant_id: t.id, user_id: input.userId, role: 'OWNER' },
      trx,
    );
    return { tenantId: t.id };
  }
  async resolveForUser(userId: string, trx?: Knex.Transaction) {
    const m = await this.repo.membershipForUser(userId, trx);
    return m ? { tenantId: m.tenant_id, role: m.role } : null;
  }
}
