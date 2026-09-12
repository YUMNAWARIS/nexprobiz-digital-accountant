import { Router, type Request } from 'express';
import { BusinessProfileInput, BusinessProfileView } from '@fa/contracts';
import type { RequestCtx } from '@/core/context';
import { NotFoundError } from '@/core/errors';
import type { UnitOfWork } from '@/core/unit-of-work';
import { defineRoutes, type RouteDeps } from '@/http/route-registry';
import { validatedBody } from '@/http/middleware/validate';
import type { BusinessProfileService } from './business-profile.contract';

/** §20 */
export function createBusinessProfileRoutes(
  service: BusinessProfileService,
  uow: UnitOfWork,
  deps: RouteDeps,
  reqCtx: (r: Request) => RequestCtx,
): Router {
  const router = Router();
  const route = defineRoutes(router, '/business-profile', deps);
  route(
    {
      method: 'get',
      path: '/',
      summary: 'Current business profile version',
      tag: 'Business',
      response: { status: 200, schema: BusinessProfileView },
    },
    async (req, res) => {
      const ctx = reqCtx(req);
      const v = await uow.read(ctx, (tx) => service.getCurrent(tx));
      if (!v) throw new NotFoundError('BusinessProfile');
      res.json(v);
    },
  );
  route(
    {
      method: 'put',
      path: '/',
      summary: 'Create a new business profile version (never overwrites)',
      tag: 'Business',
      schemas: { body: BusinessProfileInput },
      response: { status: 200, schema: BusinessProfileView },
    },
    async (req, res) => {
      const ctx = reqCtx(req);
      res.json(
        await uow.write(ctx, (tx) =>
          service.upsertVersion(tx, validatedBody(req, BusinessProfileInput)),
        ),
      );
    },
  );
  const mount = Router();
  mount.use('/business-profile', router);
  return mount;
}
