import type { Request } from 'express';
import type { Knex } from 'knex';
import type { RequestCtx } from '@/core/context';
import type { UnitOfWork } from '@/core/unit-of-work';
import type { RouteDeps } from '@/http/route-registry';
import type { AuditService } from '../audit';
import type { OutboxService } from '../outbox';
import type { BusinessProfileService } from './business-profile.contract';
import { BusinessProfileServiceImpl } from './business-profile.service';
import { createBusinessProfileRoutes } from './business-profile.routes';
import { BusinessProfileRepository } from './internal/business-profile.repository';

export function createBusinessProfileModule(deps: {
  db: Knex;
  uow: UnitOfWork;
  audit: AuditService;
  outbox: OutboxService;
  routeDeps: RouteDeps;
  reqCtx: (r: Request) => RequestCtx;
}) {
  const service: BusinessProfileService = new BusinessProfileServiceImpl(
    new BusinessProfileRepository(deps.db),
    deps.audit,
    deps.outbox,
  );
  return {
    name: 'business-profile',
    service,
    router: createBusinessProfileRoutes(service, deps.uow, deps.routeDeps, deps.reqCtx),
  };
}
