import type { Request } from 'express';
import type { Knex } from 'knex';
import type { Logger } from 'pino';
import type { RequestCtx } from '@/core/context';
import type { UnitOfWork } from '@/core/unit-of-work';
import type { RouteDeps } from '@/http/route-registry';
import type { AccountingService } from '../accounting';
import type { AuditService } from '../audit';
import type { BusinessProfileService } from '../business-profile';
import type { ClientsService } from '../clients';
import type { DocumentsService } from '../documents';
import type { OutboxService } from '../outbox';
import type { TaxRulesService } from '../tax-rules';
import type { InvoicingService } from './invoicing.contract';
import { InvoicingServiceImpl } from './invoicing.service';
import { InvoiceDocumentsService } from './internal/invoice-documents.service';
import { createInvoicingRoutes } from './invoicing.routes';
import { InvoiceRepository } from './internal/invoice.repository';

export interface InvoicingModuleDeps {
  db: Knex;
  uow: UnitOfWork;
  logger: Logger;
  clients: ClientsService;
  profile: BusinessProfileService;
  taxRules: TaxRulesService;
  accounting: AccountingService;
  audit: AuditService;
  outbox: OutboxService;
  documents: DocumentsService;
  routeDeps: RouteDeps;
  reqCtx: (r: Request) => RequestCtx;
}

export function createInvoicingModule(deps: InvoicingModuleDeps) {
  // Documents depend on the service; the service's post-commit hook depends on documents. Late-bind the hook.
  let docs: InvoiceDocumentsService | null = null;
  const service: InvoicingService = new InvoicingServiceImpl({
    repo: new InvoiceRepository(deps.db),
    ...deps,
    afterFinalize: (tenantId, invoiceId) => docs!.generateAndStore(tenantId, invoiceId),
  });
  docs = new InvoiceDocumentsService(deps.uow, service, deps.profile, deps.documents, deps.logger);
  return {
    name: 'invoicing',
    service,
    documents: docs,
    router: createInvoicingRoutes(service, docs, deps.uow, deps.routeDeps, deps.reqCtx),
  };
}
