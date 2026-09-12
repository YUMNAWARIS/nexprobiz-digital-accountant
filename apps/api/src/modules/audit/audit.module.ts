import type { Request } from 'express';
import type { Knex } from 'knex';
import type { RequestCtx } from '@/core/context';
import type { UnitOfWork } from '@/core/unit-of-work';
import type { RouteDeps } from '@/http/route-registry';
import type { AuditService } from './audit.contract';
import { AuditRepository } from './internal/audit.repository';
import { AuditServiceImpl } from './audit.service';
import { createAuditRoutes } from './audit.routes';

export function createAuditModule(deps: {
  db: Knex;
  uow: UnitOfWork;
  routeDeps: RouteDeps;
  reqCtx: (r: Request) => RequestCtx;
}) {
  const service: AuditService = new AuditServiceImpl(new AuditRepository(deps.db));
  return {
    name: 'audit',
    service,
    router: createAuditRoutes(service, deps.uow, deps.routeDeps, deps.reqCtx),
  };
}
