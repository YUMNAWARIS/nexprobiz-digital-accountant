import { Router, type Request } from 'express';
import { z } from 'zod';
import {
  CreateDatevExportRequest,
  DatevExportResponse,
  ExportListResponse,
  ExportView,
  Uuid,
} from '@fa/contracts';
import type { RequestCtx } from '@/core/context';
import type { UnitOfWork } from '@/core/unit-of-work';
import { defineRoutes, type RouteDeps } from '@/http/route-registry';
import { validatedBody, validatedParams } from '@/http/middleware/validate';
import type { DatevService } from './datev.contract';

const IdParams = z.object({ id: Uuid });

/** §32 POST /exports/datev · GET /exports · GET /exports/:id · GET /exports/:id/download */
export function createDatevRoutes(
  service: DatevService,
  uow: UnitOfWork,
  deps: RouteDeps,
  reqCtx: (r: Request) => RequestCtx,
): Router {
  const router = Router();
  const route = defineRoutes(router, '/exports', deps);
  const T = 'DATEV';
  route(
    {
      method: 'post',
      path: '/datev',
      summary: 'Generate DATEV Buchungsstapel export',
      tag: T,
      schemas: { body: CreateDatevExportRequest },
      response: { status: 201, schema: DatevExportResponse },
    },
    async (req, res) => {
      const ctx = reqCtx(req);
      const input = validatedBody(req, CreateDatevExportRequest);
      const pending = await uow.write(ctx, (tx) => service.begin(tx, input));
      try {
        res.status(201).json(await uow.write(ctx, (tx) => service.generate(tx, pending.id, input)));
      } catch (err) {
        await uow.write(ctx, (tx) => service.fail(tx, pending.id));
        throw err;
      }
    },
  );
  route(
    {
      method: 'get',
      path: '/',
      summary: 'Export history',
      tag: T,
      response: { status: 200, schema: ExportListResponse },
    },
    async (req, res) => {
      res.json({ data: await uow.read(reqCtx(req), (tx) => service.list(tx)) });
    },
  );
  route(
    {
      method: 'get',
      path: '/:id',
      summary: 'Get export',
      tag: T,
      schemas: { params: IdParams },
      response: { status: 200, schema: ExportView },
    },
    async (req, res) => {
      res.json(
        await uow.read(reqCtx(req), (tx) => service.get(tx, validatedParams(req, IdParams).id)),
      );
    },
  );
  route(
    {
      method: 'get',
      path: '/:id/download',
      summary: 'Download export CSV',
      tag: T,
      schemas: { params: IdParams },
      response: { status: 200, contentType: 'text/csv' },
    },
    async (req, res) => {
      const { buffer, filename } = await service.download(
        reqCtx(req),
        validatedParams(req, IdParams).id,
      );
      res
        .setHeader('content-type', 'text/csv; charset=windows-1252')
        .setHeader('content-disposition', `attachment; filename="${filename}"`)
        .send(buffer);
    },
  );
  const mount = Router();
  mount.use('/exports', router);
  return mount;
}
