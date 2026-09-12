import type { Knex } from 'knex';
import type { ReconciliationRow } from '@fa/database';
import type { TxCtx } from '@/core/context';
import { TenantScopedRepository } from '@/core/scoped-repository';

export class ReconciliationRepository extends TenantScopedRepository<ReconciliationRow> {
  constructor(db: Knex) {
    super(db, 'reconciliations', 'Reconciliation');
  }
  create(
    tx: TxCtx,
    row: Omit<ReconciliationRow, 'id' | 'tenant_id' | 'created_at'>,
  ): Promise<ReconciliationRow> {
    return this.insertOne(tx, row as never);
  }
}
