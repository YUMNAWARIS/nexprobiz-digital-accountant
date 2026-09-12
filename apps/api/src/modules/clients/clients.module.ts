import type { Request } from 'express';
import type { Knex } from 'knex';
import type { RequestCtx } from '@/core/context';
import type { UnitOfWork } from '@/core/unit-of-work';
import type { RouteDeps } from '@/http/route-registry';
import type { ClientsService } from './clients.contract';
import { ClientsServiceImpl } from './clients.service';
import { createClientsRoutes } from './clients.routes';
import { ClientsRepository } from './internal/clients.repository';

export function createClientsModule(deps: {
  db: Knex;
  uow: UnitOfWork;
  routeDeps: RouteDeps;
  reqCtx: (r: Request) => RequestCtx;
}) {
  const service: ClientsService = new ClientsServiceImpl(new ClientsRepository(deps.db));
  return {
    name: 'clients',
    service,
    router: createClientsRoutes(service, deps.uow, deps.routeDeps, deps.reqCtx),
  };
}
