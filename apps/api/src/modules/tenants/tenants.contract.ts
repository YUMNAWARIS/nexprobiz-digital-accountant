import type { Knex } from 'knex';
/** §9.2 — one user = one tenant; only OWNER. */
export interface TenantsService {
  createForUser(
    input: { userId: string; name: string },
    trx?: Knex.Transaction,
  ): Promise<{ tenantId: string }>;
  resolveForUser(
    userId: string,
    trx?: Knex.Transaction,
  ): Promise<{ tenantId: string; role: string } | null>;
}
