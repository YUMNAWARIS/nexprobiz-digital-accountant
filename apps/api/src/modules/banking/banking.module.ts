import type { Request } from 'express';
import type { Knex } from 'knex';
import type { RequestCtx } from '@/core/context';
import type { UnitOfWork } from '@/core/unit-of-work';
import type { RouteDeps } from '@/http/route-registry';
import type { AuditService } from '../audit';
import type { OutboxService } from '../outbox';
import type { BankingService } from './banking.contract';
import { createBankingRoutes } from './banking.routes';
import { BankingServiceImpl } from './banking.service';
import { BankImportsRepository, BankTransactionsRepository } from './internal/banking.repository';

export function createBankingModule(deps: {
  db: Knex;
  uow: UnitOfWork;
  audit: AuditService;
  outbox: OutboxService;
  routeDeps: RouteDeps;
  reqCtx: (r: Request) => RequestCtx;
}) {
  const service: BankingService = new BankingServiceImpl(
    new BankImportsRepository(deps.db),
    new BankTransactionsRepository(deps.db),
    deps.audit,
    deps.outbox,
  );
  return {
    name: 'banking',
    service,
    router: createBankingRoutes(service, deps.uow, deps.routeDeps, deps.reqCtx),
  };
}
