import type { Knex } from 'knex';
import type { BusinessProfileVersionRow } from '@fa/database';
import type { AnyCtx, TxCtx } from '@/core/context';
import { TenantScopedRepository } from '@/core/scoped-repository';

export class BusinessProfileRepository extends TenantScopedRepository<BusinessProfileVersionRow> {
  constructor(db: Knex) {
    super(db, 'business_profile_versions', 'BusinessProfile');
  }
  async current(ctx: AnyCtx): Promise<BusinessProfileVersionRow | null> {
    return (await this.q(ctx).whereNull('effective_to').first()) ?? null;
  }
  async currentForUpdate(tx: TxCtx): Promise<BusinessProfileVersionRow | null> {
    return (await this.qLocked(tx).whereNull('effective_to').first()) ?? null;
  }
  async closeVersion(tx: TxCtx, id: string, at: Date): Promise<void> {
    await this.q(tx).where('id', id).update({ effective_to: at });
  }
  createVersion(
    tx: TxCtx,
    row: Omit<BusinessProfileVersionRow, 'id' | 'tenant_id' | 'created_at' | 'effective_to'>,
  ): Promise<BusinessProfileVersionRow> {
    return this.insertOne(tx, { ...row, effective_to: null } as never);
  }
}
