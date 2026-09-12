import { Router, type Request } from 'express';
import { CreateReconciliationRequest, ReconciliationView } from '@fa/contracts';
import type { RequestCtx } from '@/core/context';
import type { UnitOfWork } from '@/core/unit-of-work';
import { defineRoutes, type RouteDeps } from '@/http/route-registry';
import { validatedBody } from '@/http/middleware/validate';
import type { ReconciliationService } from './reconciliation.contract';

/** §28 POST /reconciliations */
export function createReconciliationRoutes(
  service: ReconciliationService,
  uow: UnitOfWork,
  deps: RouteDeps,
  reqCtx: (r: Request) => RequestCtx,
): Router {
  const router = Router();
  defineRoutes(
    router,
    '/reconciliations',
    deps,
  )(
    {
      method: 'post',
      path: '/',
      summary: 'Match bank transaction with a payment or expense',
      tag: 'Reconciliation',
      schemas: { body: CreateReconciliationRequest },
      response: { status: 201, schema: ReconciliationView },
    },
    async (req, res) => {
      res
        .status(201)
        .json(
          await uow.write(reqCtx(req), (tx) =>
            service.create(tx, validatedBody(req, CreateReconciliationRequest)),
          ),
        );
    },
  );
  const mount = Router();
  mount.use('/reconciliations', router);
  return mount;
}
