import { Router, type Request } from 'express';
import { z } from 'zod';
import {
  ClientListResponse,
  ClientView,
  CreateClientRequest,
  ListClientsQuery,
  UpdateClientRequest,
  Uuid,
} from '@fa/contracts';
import type { RequestCtx } from '@/core/context';
import type { UnitOfWork } from '@/core/unit-of-work';
import { defineRoutes, type RouteDeps } from '@/http/route-registry';
import { validatedBody, validatedParams, validatedQuery } from '@/http/middleware/validate';
import type { ClientsService } from './clients.contract';

const IdParams = z.object({ id: Uuid });

/** §21 Client REST Contracts */
export function createClientsRoutes(
  service: ClientsService,
  uow: UnitOfWork,
  deps: RouteDeps,
  reqCtx: (r: Request) => RequestCtx,
): Router {
  const router = Router();
  const route = defineRoutes(router, '/clients', deps);
  const T = 'Clients';

  route(
    {
      method: 'post',
      path: '/',
      summary: 'Create client',
      tag: T,
      schemas: { body: CreateClientRequest },
      response: { status: 201, schema: ClientView },
    },
    async (req, res) => {
      res
        .status(201)
        .json(
          await uow.write(reqCtx(req), (tx) =>
            service.create(tx, validatedBody(req, CreateClientRequest)),
          ),
        );
    },
  );
  route(
    {
      method: 'get',
      path: '/',
      summary: 'List/search clients',
      tag: T,
      schemas: { query: ListClientsQuery },
      response: { status: 200, schema: ClientListResponse },
    },
    async (req, res) => {
      res.json(
        await uow.read(reqCtx(req), (tx) =>
          service.list(tx, validatedQuery(req, ListClientsQuery)),
        ),
      );
    },
  );
  route(
    {
      method: 'get',
      path: '/:id',
      summary: 'Get client',
      tag: T,
      schemas: { params: IdParams },
      response: { status: 200, schema: ClientView },
    },
    async (req, res) => {
      res.json(
        await uow.read(reqCtx(req), (tx) => service.get(tx, validatedParams(req, IdParams).id)),
      );
    },
  );
  route(
    {
      method: 'patch',
      path: '/:id',
      summary: 'Edit client',
      tag: T,
      schemas: { params: IdParams, body: UpdateClientRequest },
      response: { status: 200, schema: ClientView },
    },
    async (req, res) => {
      res.json(
        await uow.write(reqCtx(req), (tx) =>
          service.update(
            tx,
            validatedParams(req, IdParams).id,
            validatedBody(req, UpdateClientRequest),
          ),
        ),
      );
    },
  );
  route(
    {
      method: 'delete',
      path: '/:id',
      summary: 'Archive client (archive only)',
      tag: T,
      schemas: { params: IdParams },
      response: { status: 204 },
    },
    async (req, res) => {
      await uow.write(reqCtx(req), (tx) => service.archive(tx, validatedParams(req, IdParams).id));
      res.status(204).end();
    },
  );

  const mount = Router();
  mount.use('/clients', router);
  return mount;
}
