/**
 * The whole dependency graph in one typed file (ARCH-007 wiring).
 * Modules are built in dependency order and receive only public service interfaces.
 */
import type { Router } from 'express';
import type { Knex } from 'knex';
import type { Logger } from 'pino';
import type { Env } from './config/env';
import { systemClock, type Clock } from './core/clock';
import { systemIds, type IdGenerator } from './core/ids';
import type { DocumentStoragePort, QueuePort } from './core/ports';
import { createUnitOfWork, type UnitOfWork } from './core/unit-of-work';
import { createRequireAuth } from './http/middleware/auth';
import { makeReqCtx } from './http/context';
import { asyncHandler } from './http/route-registry';
import { createKnex } from './infra/db/knex';
import { BullMqQueue } from './infra/queue/bullmq.queue';
import { InMemoryQueue } from './infra/queue/inmemory.queue';
import { LocalDocumentStorage } from './infra/storage/local.storage';
import { S3DocumentStorage } from './infra/storage/s3.storage';
import { createAccountingModule } from './modules/accounting';
import { createAuditModule } from './modules/audit';
import { createAuthModule } from './modules/auth';
import { createBankingModule } from './modules/banking';
import { createBusinessProfileModule } from './modules/business-profile';
import { createClientsModule } from './modules/clients';
import { createDatevModule } from './modules/datev';
import { createDocumentsModule } from './modules/documents';
import { createExpensesModule } from './modules/expenses';
import { createHealthModule } from './modules/health';
import { createInvoicingModule } from './modules/invoicing';
import { createOutboxModule } from './modules/outbox';
import { createPaymentsModule } from './modules/payments';
import { createReceiptsModule } from './modules/receipts';
import { createReconciliationModule } from './modules/reconciliation';
import { createReportingModule } from './modules/reporting';
import { createTaxRulesModule } from './modules/tax-rules';
import { createTenantsModule } from './modules/tenants';
import { createUsersModule } from './modules/users';

export interface Infra {
  env: Env;
  logger: Logger;
  db: Knex;
  uow: UnitOfWork;
  clock: Clock;
  ids: IdGenerator;
  storage: DocumentStoragePort;
  queue: QueuePort;
}

export interface Container {
  infra: Infra;
  services: Services;
  healthRouter: Router;
  apiRouters: Router[];
  shutdown(): Promise<void>;
}

export function createInfra(env: Env, logger: Logger, overrides: Partial<Infra> = {}): Infra {
  const db = overrides.db ?? createKnex(env.DATABASE_URL);
  const storage =
    overrides.storage ??
    (env.STORAGE_DRIVER === 'local'
      ? new LocalDocumentStorage(env.STORAGE_LOCAL_DIR)
      : new S3DocumentStorage({
          endpoint: env.S3_ENDPOINT,
          region: env.S3_REGION,
          bucket: env.S3_BUCKET,
          accessKeyId: env.S3_ACCESS_KEY_ID,
          secretAccessKey: env.S3_SECRET_ACCESS_KEY,
          forcePathStyle: env.S3_FORCE_PATH_STYLE,
        }));
  const queue =
    overrides.queue ??
    (env.QUEUE_DRIVER === 'inmemory' ? new InMemoryQueue() : new BullMqQueue(env.REDIS_URL));
  return {
    env,
    logger,
    db,
    uow: overrides.uow ?? createUnitOfWork(db),
    clock: overrides.clock ?? systemClock,
    ids: overrides.ids ?? systemIds,
    storage,
    queue,
  };
}

export interface Services {
  audit: ReturnType<typeof createAuditModule>['service'];
  outbox: ReturnType<typeof createOutboxModule>['service'];
  users: ReturnType<typeof createUsersModule>['service'];
  tenants: ReturnType<typeof createTenantsModule>['service'];
  auth: ReturnType<typeof createAuthModule>['service'];
  taxRules: ReturnType<typeof createTaxRulesModule>['service'];
  profile: ReturnType<typeof createBusinessProfileModule>['service'];
  clients: ReturnType<typeof createClientsModule>['service'];
  accounting: ReturnType<typeof createAccountingModule>['service'];
  documents: ReturnType<typeof createDocumentsModule>['service'];
  invoicing: ReturnType<typeof createInvoicingModule>['service'];
  reporting: ReturnType<typeof createReportingModule>['service'];
  payments: ReturnType<typeof createPaymentsModule>['service'];
  receipts: ReturnType<typeof createReceiptsModule>['service'];
  expenses: ReturnType<typeof createExpensesModule>['service'];
  banking: ReturnType<typeof createBankingModule>['service'];
  reconciliation: ReturnType<typeof createReconciliationModule>['service'];
  datev: ReturnType<typeof createDatevModule>['service'];
}

export function createContainer(infra: Infra): Container {
  const { db, uow, env, logger, clock, ids } = infra;
  const requireAuth = createRequireAuth(env.JWT_SECRET);
  const reqCtx = makeReqCtx(clock);
  const routeDeps = { requireAuth, asyncHandler };
  const common = { db, uow, routeDeps, reqCtx };

  // Tier 0 — cross-cutting
  const audit = createAuditModule(common);
  const outbox = createOutboxModule({ db, ids, logger });
  // Tier 1 — identity
  const users = createUsersModule({ db });
  const tenants = createTenantsModule({ db });
  const auth = createAuthModule({
    db,
    users: users.service,
    tenants: tenants.service,
    clock,
    secrets: { accessSecret: env.JWT_SECRET, refreshSecret: env.JWT_REFRESH_SECRET },
    routeDeps,
  });
  // Tier 2 — reference + profile
  const taxRules = createTaxRulesModule({ db });
  const profile = createBusinessProfileModule({
    ...common,
    audit: audit.service,
    outbox: outbox.service,
  });
  const clients = createClientsModule(common);
  const accounting = createAccountingModule(common);
  const documents = createDocumentsModule({ db, storage: infra.storage });
  // Tier 3 — invoicing
  const invoicing = createInvoicingModule({
    ...common,
    logger,
    clients: clients.service,
    profile: profile.service,
    taxRules: taxRules.service,
    accounting: accounting.service,
    audit: audit.service,
    outbox: outbox.service,
    documents: documents.service,
  });

  const payments = createPaymentsModule({
    ...common,
    invoicing: invoicing.service,
    profile: profile.service,
    accounting: accounting.service,
    audit: audit.service,
    outbox: outbox.service,
  });
  const receipts = createReceiptsModule({
    ...common,
    documents: documents.service,
    queue: infra.queue,
    outbox: outbox.service,
  });
  const expenses = createExpensesModule({
    ...common,
    receipts: receipts.service,
    accounting: accounting.service,
    profile: profile.service,
    taxRules: taxRules.service,
    audit: audit.service,
    outbox: outbox.service,
  });
  const banking = createBankingModule({ ...common, audit: audit.service, outbox: outbox.service });
  const reconciliation = createReconciliationModule({
    ...common,
    banking: banking.service,
    payments: payments.service,
    expenses: expenses.service,
    audit: audit.service,
    outbox: outbox.service,
  });
  const datev = createDatevModule({
    ...common,
    accounting: accounting.service,
    profile: profile.service,
    documents: documents.service,
    audit: audit.service,
    outbox: outbox.service,
  });
  // Tier 4 — read models
  const reporting = createReportingModule({
    ...common,
    profile: profile.service,
    accounting: accounting.service,
  });

  // Order = mount order under /api/v1. Add new modules here.
  const routed = [
    auth,
    profile,
    clients,
    accounting,
    invoicing,
    payments,
    receipts,
    expenses,
    banking,
    reconciliation,
    datev,
    reporting,
    audit,
  ];

  const health = createHealthModule({ db, storage: infra.storage, version: env.GIT_SHA });

  const services: Services = {
    audit: audit.service,
    outbox: outbox.service,
    users: users.service,
    tenants: tenants.service,
    auth: auth.service,
    taxRules: taxRules.service,
    profile: profile.service,
    clients: clients.service,
    accounting: accounting.service,
    documents: documents.service,
    invoicing: invoicing.service,
    reporting: reporting.service,
    payments: payments.service,
    receipts: receipts.service,
    expenses: expenses.service,
    banking: banking.service,
    reconciliation: reconciliation.service,
    datev: datev.service,
  };

  if (env.NODE_ENV !== 'test') outbox.start();

  return {
    infra,
    services,
    healthRouter: health.router,
    apiRouters: routed.map((m) => m.router),
    async shutdown() {
      outbox.stop();
      await infra.queue.close();
      await infra.db.destroy();
    },
  };
}
