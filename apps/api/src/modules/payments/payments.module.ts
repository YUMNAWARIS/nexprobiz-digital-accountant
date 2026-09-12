import type { Request } from 'express';
import type { Knex } from 'knex';
import type { RequestCtx } from '@/core/context';
import type { UnitOfWork } from '@/core/unit-of-work';
import type { RouteDeps } from '@/http/route-registry';
import type { AccountingService } from '../accounting';
import type { AuditService } from '../audit';
import type { BusinessProfileService } from '../business-profile';
import type { InvoicingService } from '../invoicing';
import type { OutboxService } from '../outbox';
import type { PaymentsService } from './payments.contract';
import { createPaymentsRoutes } from './payments.routes';
import { PaymentsServiceImpl } from './payments.service';
import { PaymentsRepository } from './internal/payments.repository';

export function createPaymentsModule(deps: {
  db: Knex;
  uow: UnitOfWork;
  invoicing: InvoicingService;
  profile: BusinessProfileService;
  accounting: AccountingService;
  audit: AuditService;
  outbox: OutboxService;
  routeDeps: RouteDeps;
  reqCtx: (r: Request) => RequestCtx;
}) {
  const service: PaymentsService = new PaymentsServiceImpl(
    new PaymentsRepository(deps.db),
    deps.invoicing,
    deps.profile,
    deps.accounting,
    deps.audit,
    deps.outbox,
  );
  return {
    name: 'payments',
    service,
    router: createPaymentsRoutes(service, deps.uow, deps.routeDeps, deps.reqCtx),
  };
}
