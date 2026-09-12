import type { Request } from 'express';
import type { Knex } from 'knex';
import type { RequestCtx } from '@/core/context';
import type { UnitOfWork } from '@/core/unit-of-work';
import type { RouteDeps } from '@/http/route-registry';
import type { AuditService } from '../audit';
import type { BankingService } from '../banking';
import type { ExpensesService } from '../expenses';
import type { OutboxService } from '../outbox';
import type { PaymentsService } from '../payments';
import type { ReconciliationService } from './reconciliation.contract';
import { createReconciliationRoutes } from './reconciliation.routes';
import { ReconciliationServiceImpl } from './reconciliation.service';
import { ReconciliationRepository } from './internal/reconciliation.repository';

export function createReconciliationModule(deps: {
  db: Knex;
  uow: UnitOfWork;
  banking: BankingService;
  payments: PaymentsService;
  expenses: ExpensesService;
  audit: AuditService;
  outbox: OutboxService;
  routeDeps: RouteDeps;
  reqCtx: (r: Request) => RequestCtx;
}) {
  const service: ReconciliationService = new ReconciliationServiceImpl(
    new ReconciliationRepository(deps.db),
    deps.banking,
    deps.payments,
    deps.expenses,
    deps.audit,
    deps.outbox,
  );
  return {
    name: 'reconciliation',
    service,
    router: createReconciliationRoutes(service, deps.uow, deps.routeDeps, deps.reqCtx),
  };
}
