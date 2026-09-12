import { Router, type Request } from 'express';
import { DashboardResponse, EuerResponse, VatReportResponse, YearQuery } from '@fa/contracts';
import type { RequestCtx } from '@/core/context';
import type { UnitOfWork } from '@/core/unit-of-work';
import { defineRoutes, type RouteDeps } from '@/http/route-registry';
import { validatedQuery } from '@/http/middleware/validate';
import type { ReportingService } from './reporting.contract';

/** §29 dashboard · §30 EÜR · §31 VAT preview */
export function createReportingRoutes(
  service: ReportingService,
  uow: UnitOfWork,
  deps: RouteDeps,
  reqCtx: (r: Request) => RequestCtx,
): Router {
  const mount = Router();
  const dash = Router();
  defineRoutes(
    dash,
    '/dashboard',
    deps,
  )(
    {
      method: 'get',
      path: '/',
      summary: 'Dashboard figures for a year',
      tag: 'Reports',
      schemas: { query: YearQuery },
      response: { status: 200, schema: DashboardResponse },
    },
    async (req, res) => {
      res.json(
        await uow.read(reqCtx(req), (tx) =>
          service.dashboard(tx, validatedQuery(req, YearQuery).year),
        ),
      );
    },
  );
  const reports = Router();
  const route = defineRoutes(reports, '/reports', deps);
  route(
    {
      method: 'get',
      path: '/euer',
      summary: 'EÜR preview (POSTED entries only)',
      tag: 'Reports',
      schemas: { query: YearQuery },
      response: { status: 200, schema: EuerResponse },
    },
    async (req, res) => {
      res.json(
        await uow.read(reqCtx(req), (tx) => service.euer(tx, validatedQuery(req, YearQuery).year)),
      );
    },
  );
  route(
    {
      method: 'get',
      path: '/vat',
      summary: 'VAT preview',
      tag: 'Reports',
      schemas: { query: YearQuery },
      response: { status: 200, schema: VatReportResponse },
    },
    async (req, res) => {
      res.json(
        await uow.read(reqCtx(req), (tx) => service.vat(tx, validatedQuery(req, YearQuery).year)),
      );
    },
  );
  mount.use('/dashboard', dash);
  mount.use('/reports', reports);
  return mount;
}
