import type { Knex } from 'knex';
import type { TenantMembershipRow, TenantRow } from '@fa/database';

export class TenantsRepository {
  constructor(private readonly db: Knex) {}
  async insertTenant(name: string, trx?: Knex.Transaction): Promise<TenantRow> {
    const [r] = await (trx ?? this.db)<TenantRow>('tenants').insert({ name }).returning('*');
    return r as TenantRow;
  }
  async insertMembership(
    row: { tenant_id: string; user_id: string; role: 'OWNER' },
    trx?: Knex.Transaction,
  ): Promise<void> {
    await (trx ?? this.db)<TenantMembershipRow>('tenant_memberships').insert(row);
  }
  membershipForUser(userId: string, trx?: Knex.Transaction) {
    return (trx ?? this.db)<TenantMembershipRow>('tenant_memberships')
      .where({ user_id: userId })
      .first();
  }
}
