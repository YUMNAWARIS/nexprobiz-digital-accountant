import { Router, type Request } from 'express';
import { z } from 'zod';
import {
  CreateExpenseRequest,
  ExpenseListResponse,
  ExpenseView,
  ListExpensesQuery,
  PostExpenseRequest,
  ReverseExpenseRequest,
  UpdateExpenseRequest,
  Uuid,
} from '@fa/contracts';
import type { RequestCtx } from '@/core/context';
import type { UnitOfWork } from '@/core/unit-of-work';
import { defineRoutes, type RouteDeps } from '@/http/route-registry';
import { validatedBody, validatedParams, validatedQuery } from '@/http/middleware/validate';
import type { ExpensesService } from './expenses.contract';

const IdParams = z.object({ id: Uuid });

/** §25 Expense REST Contracts */
export function createExpensesRoutes(
  service: ExpensesService,
  uow: UnitOfWork,
  deps: RouteDeps,
  reqCtx: (r: Request) => RequestCtx,
): Router {
  const router = Router();
  const route = defineRoutes(router, '/expenses', deps);
  const T = 'Expenses';
  route(
    {
      method: 'post',
      path: '/',
      summary: 'Create draft expense',
      tag: T,
      schemas: { body: CreateExpenseRequest },
      response: { status: 201, schema: ExpenseView },
    },
    async (req, res) => {
      res
        .status(201)
        .json(
          await uow.write(reqCtx(req), (tx) =>
            service.create(tx, validatedBody(req, CreateExpenseRequest)),
          ),
        );
    },
  );
  route(
    {
      method: 'get',
      path: '/',
      summary: 'List expenses',
      tag: T,
      schemas: { query: ListExpensesQuery },
      response: { status: 200, schema: ExpenseListResponse },
    },
    async (req, res) => {
      res.json(
        await uow.read(reqCtx(req), (tx) =>
          service.list(tx, validatedQuery(req, ListExpensesQuery)),
        ),
      );
    },
  );
  route(
    {
      method: 'get',
      path: '/:id',
      summary: 'Get expense',
      tag: T,
      schemas: { params: IdParams },
      response: { status: 200, schema: ExpenseView },
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
      summary: 'Edit draft (DRAFT only)',
      tag: T,
      schemas: { params: IdParams, body: UpdateExpenseRequest },
      response: { status: 200, schema: ExpenseView },
    },
    async (req, res) => {
      res.json(
        await uow.write(reqCtx(req), (tx) =>
          service.update(
            tx,
            validatedParams(req, IdParams).id,
            validatedBody(req, UpdateExpenseRequest),
          ),
        ),
      );
    },
  );
  route(
    {
      method: 'post',
      path: '/:id/post',
      summary: 'Post expense (journal, POSTED, audit)',
      tag: T,
      schemas: { params: IdParams, body: PostExpenseRequest },
      response: { status: 200, schema: ExpenseView },
    },
    async (req, res) => {
      res.json(
        await uow.write(reqCtx(req), (tx) => service.post(tx, validatedParams(req, IdParams).id)),
      );
    },
  );
  route(
    {
      method: 'post',
      path: '/:id/reverse',
      summary: 'Reverse posted expense (reversal journal)',
      tag: T,
      schemas: { params: IdParams, body: ReverseExpenseRequest },
      response: { status: 200, schema: ExpenseView },
    },
    async (req, res) => {
      res.json(
        await uow.write(reqCtx(req), (tx) =>
          service.reverse(
            tx,
            validatedParams(req, IdParams).id,
            validatedBody(req, ReverseExpenseRequest),
          ),
        ),
      );
    },
  );
  const mount = Router();
  mount.use('/expenses', router);
  return mount;
}
