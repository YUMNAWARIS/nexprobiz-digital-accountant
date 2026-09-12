import type { Request } from 'express';
import type { Knex } from 'knex';
import type { RequestCtx } from '@/core/context';
import type { QueuePort } from '@/core/ports';
import type { UnitOfWork } from '@/core/unit-of-work';
import type { RouteDeps } from '@/http/route-registry';
import type { DocumentsService } from '../documents';
import type { OutboxService } from '../outbox';
import type { ReceiptsService } from './receipts.contract';
import { createReceiptsRoutes } from './receipts.routes';
import { ReceiptsServiceImpl } from './receipts.service';
import { OcrRunsRepository, ReceiptsRepository } from './internal/receipts.repository';

export function createReceiptsModule(deps: {
  db: Knex;
  uow: UnitOfWork;
  documents: DocumentsService;
  queue: QueuePort;
  outbox: OutboxService;
  routeDeps: RouteDeps;
  reqCtx: (r: Request) => RequestCtx;
}) {
  const service: ReceiptsService = new ReceiptsServiceImpl(
    new ReceiptsRepository(deps.db),
    new OcrRunsRepository(deps.db),
    deps.documents,
    deps.queue,
    deps.outbox,
  );
  return {
    name: 'receipts',
    service,
    router: createReceiptsRoutes(service, deps.uow, deps.routeDeps, deps.reqCtx),
  };
}
