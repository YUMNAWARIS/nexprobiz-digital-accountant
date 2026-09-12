import type { Request } from 'express';
import type { Knex } from 'knex';
import type { RequestCtx } from '@/core/context';
import type { UnitOfWork } from '@/core/unit-of-work';
import type { RouteDeps } from '@/http/route-registry';
import type { AccountingService } from './accounting.contract';
import { createAccountingRoutes } from './accounting.routes';
import { AccountingServiceImpl } from './accounting.service';
import { ChartRepository } from './internal/chart.repository';
import { JournalRepository } from './internal/journal.repository';

export function createAccountingModule(deps: {
  db: Knex;
  uow: UnitOfWork;
  routeDeps: RouteDeps;
  reqCtx: (r: Request) => RequestCtx;
}) {
  const service: AccountingService = new AccountingServiceImpl(
    new JournalRepository(deps.db),
    new ChartRepository(deps.db),
  );
  return {
    name: 'accounting',
    service,
    router: createAccountingRoutes(service, deps.uow, deps.routeDeps, deps.reqCtx),
  };
}
