import type { Request } from 'express';
import type { Knex } from 'knex';
import type { RequestCtx } from '@/core/context';
import type { UnitOfWork } from '@/core/unit-of-work';
import type { RouteDeps } from '@/http/route-registry';
import type { AccountingService } from '../accounting';
import type { AuditService } from '../audit';
import type { BusinessProfileService } from '../business-profile';
import type { DocumentsService } from '../documents';
import type { OutboxService } from '../outbox';
import type { DatevService } from './datev.contract';
import { createDatevRoutes } from './datev.routes';
import { DatevServiceImpl } from './datev.service';
import { ExportsRepository } from './internal/exports.repository';

export function createDatevModule(deps: {
  db: Knex;
  uow: UnitOfWork;
  accounting: AccountingService;
  profile: BusinessProfileService;
  documents: DocumentsService;
  audit: AuditService;
  outbox: OutboxService;
  routeDeps: RouteDeps;
  reqCtx: (r: Request) => RequestCtx;
}) {
  const service: DatevService = new DatevServiceImpl(
    new ExportsRepository(deps.db),
    deps.uow,
    deps.accounting,
    deps.profile,
    deps.documents,
    deps.audit,
    deps.outbox,
  );
  return {
    name: 'datev',
    service,
    router: createDatevRoutes(service, deps.uow, deps.routeDeps, deps.reqCtx),
  };
}
