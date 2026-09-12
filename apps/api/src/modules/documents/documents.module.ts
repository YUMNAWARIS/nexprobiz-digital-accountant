import type { Knex } from 'knex';
import type { DocumentStoragePort } from '@/core/ports';
import type { DocumentsService } from './documents.contract';
import { DocumentsServiceImpl } from './documents.service';
import { DocumentsRepository } from './internal/documents.repository';
export function createDocumentsModule(deps: { db: Knex; storage: DocumentStoragePort }) {
  const service: DocumentsService = new DocumentsServiceImpl(
    new DocumentsRepository(deps.db),
    deps.storage,
  );
  return { name: 'documents', service };
}
