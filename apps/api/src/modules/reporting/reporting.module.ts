import type { Request } from 'express';
import type { Knex } from 'knex';
import type { RequestCtx } from '@/core/context';
import type { UnitOfWork } from '@/core/unit-of-work';
import type { RouteDeps } from '@/http/route-registry';
import type { AccountingService } from '../accounting';
import type { BusinessProfileService } from '../business-profile';
import type { ReportingService } from './reporting.contract';
import { createReportingRoutes } from './reporting.routes';
import { ReportingServiceImpl } from './reporting.service';
import { ReportingRepository } from './internal/reporting.repository';

export function createReportingModule(deps: {
  db: Knex;
  uow: UnitOfWork;
  profile: BusinessProfileService;
  accounting: AccountingService;
  routeDeps: RouteDeps;
  reqCtx: (r: Request) => RequestCtx;
}) {
  const service: ReportingService = new ReportingServiceImpl(
    new ReportingRepository(deps.db),
    deps.profile,
    deps.accounting,
  );
  return {
    name: 'reporting',
    service,
    router: createReportingRoutes(service, deps.uow, deps.routeDeps, deps.reqCtx),
  };
}
