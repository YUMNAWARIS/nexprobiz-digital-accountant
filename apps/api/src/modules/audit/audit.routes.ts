import { Router, type Request } from 'express';
import { AuditListResponse, ListAuditQuery } from '@fa/contracts';
import type { RequestCtx } from '@/core/context';
import type { UnitOfWork } from '@/core/unit-of-work';
import { defineRoutes, type RouteDeps } from '@/http/route-registry';
import { validatedQuery } from '@/http/middleware/validate';
import type { AuditService } from './audit.contract';

/** Story 15.1 — GET /api/v1/audit, newest first. */
export function createAuditRoutes(
  service: AuditService,
  uow: UnitOfWork,
  deps: RouteDeps,
  reqCtx: (r: Request) => RequestCtx,
): Router {
  const router = Router();
  const route = defineRoutes(router, '/audit', deps);
  route(
    {
      method: 'get',
      path: '/',
      summary: 'List audit events (newest first)',
      tag: 'Audit',
      schemas: { query: ListAuditQuery },
      response: { status: 200, schema: AuditListResponse },
    },
    async (req, res) => {
      res.json(
        await uow.read(reqCtx(req), (tx) => service.list(tx, validatedQuery(req, ListAuditQuery))),
      );
    },
  );
  const mount = Router();
  mount.use('/audit', router);
  return mount;
}
