import type { Knex } from 'knex';
import type { DocumentRow } from '@fa/database';
import type { TxCtx } from '@/core/context';
import { TenantScopedRepository } from '@/core/scoped-repository';

export class DocumentsRepository extends TenantScopedRepository<DocumentRow> {
  constructor(db: Knex) {
    super(db, 'documents', 'Document');
  }
  create(
    tx: TxCtx,
    row: Omit<DocumentRow, 'id' | 'tenant_id' | 'created_at'>,
  ): Promise<DocumentRow> {
    return this.insertOne(tx, row as never);
  }
}
