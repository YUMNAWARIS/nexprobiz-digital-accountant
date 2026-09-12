import { Router, type Request } from 'express';
import { z } from 'zod';
import { PaymentListResponse, PaymentView, RecordPaymentRequest, Uuid } from '@fa/contracts';
import type { RequestCtx } from '@/core/context';
import type { UnitOfWork } from '@/core/unit-of-work';
import { defineRoutes, type RouteDeps } from '@/http/route-registry';
import { validatedBody, validatedParams } from '@/http/middleware/validate';
import type { PaymentsService } from './payments.contract';

const IdParams = z.object({ id: Uuid });

/** §23 — POST/GET /invoices/:id/payments */
export function createPaymentsRoutes(
  service: PaymentsService,
  uow: UnitOfWork,
  deps: RouteDeps,
  reqCtx: (r: Request) => RequestCtx,
): Router {
  const router = Router();
  const route = defineRoutes(router, '/invoices', deps);
  route(
    {
      method: 'post',
      path: '/:id/payments',
      summary: 'Record manual payment',
      tag: 'Payments',
      schemas: { params: IdParams, body: RecordPaymentRequest },
      response: { status: 201, schema: PaymentView },
    },
    async (req, res) => {
      res
        .status(201)
        .json(
          await uow.write(reqCtx(req), (tx) =>
            service.record(
              tx,
              validatedParams(req, IdParams).id,
              validatedBody(req, RecordPaymentRequest),
            ),
          ),
        );
    },
  );
  route(
    {
      method: 'get',
      path: '/:id/payments',
      summary: 'List payments for invoice',
      tag: 'Payments',
      schemas: { params: IdParams },
      response: { status: 200, schema: PaymentListResponse },
    },
    async (req, res) => {
      res.json({
        data: await uow.read(reqCtx(req), (tx) =>
          service.listForInvoice(tx, validatedParams(req, IdParams).id),
        ),
      });
    },
  );
  const mount = Router();
  mount.use('/invoices', router);
  return mount;
}
