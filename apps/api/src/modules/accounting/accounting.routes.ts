import { Router, type Request } from 'express';
import { AccountCategoryListResponse } from '@fa/contracts';
import type { RequestCtx } from '@/core/context';
import type { UnitOfWork } from '@/core/unit-of-work';
import { defineRoutes, type RouteDeps } from '@/http/route-registry';
import type { AccountingService } from './accounting.contract';

/** Read-only reference endpoint used by the expense form (§11.18). */
export function createAccountingRoutes(
  service: AccountingService,
  uow: UnitOfWork,
  deps: RouteDeps,
  reqCtx: (r: Request) => RequestCtx,
): Router {
  const router = Router();
  const route = defineRoutes(router, '/account-categories', deps);
  route(
    {
      method: 'get',
      path: '/',
      summary: 'List account categories',
      tag: 'Accounting',
      response: { status: 200, schema: AccountCategoryListResponse },
    },
    async (req, res) => {
      res.json({ data: await uow.read(reqCtx(req), (tx) => service.listCategories(tx)) });
    },
  );
  const mount = Router();
  mount.use('/account-categories', router);
  return mount;
}
