import type { Request } from 'express';
import type { Knex } from 'knex';
import type { RequestCtx } from '@/core/context';
import type { UnitOfWork } from '@/core/unit-of-work';
import type { RouteDeps } from '@/http/route-registry';
import type { AccountingService } from '../accounting';
import type { AuditService } from '../audit';
import type { BusinessProfileService } from '../business-profile';
import type { OutboxService } from '../outbox';
import type { ReceiptsService } from '../receipts';
import type { TaxRulesService } from '../tax-rules';
import type { ExpensesService } from './expenses.contract';
import { createExpensesRoutes } from './expenses.routes';
import { ExpensesServiceImpl } from './expenses.service';
import { ExpensesRepository } from './internal/expenses.repository';

export function createExpensesModule(deps: {
  db: Knex;
  uow: UnitOfWork;
  receipts: ReceiptsService;
  accounting: AccountingService;
  profile: BusinessProfileService;
  taxRules: TaxRulesService;
  audit: AuditService;
  outbox: OutboxService;
  routeDeps: RouteDeps;
  reqCtx: (r: Request) => RequestCtx;
}) {
  const service: ExpensesService = new ExpensesServiceImpl(
    new ExpensesRepository(deps.db),
    deps.receipts,
    deps.accounting,
    deps.profile,
    deps.taxRules,
    deps.audit,
    deps.outbox,
  );
  return {
    name: 'expenses',
    service,
    router: createExpensesRoutes(service, deps.uow, deps.routeDeps, deps.reqCtx),
  };
}
