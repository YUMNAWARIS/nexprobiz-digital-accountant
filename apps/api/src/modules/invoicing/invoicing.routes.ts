import { Router, type Request } from 'express';
import { z } from 'zod';
import {
  CancelInvoiceRequest,
  CreateInvoiceRequest,
  FinalizeInvoiceRequest,
  FinalizeInvoiceResponse,
  InvoiceListResponse,
  InvoiceView,
  ListInvoicesQuery,
  UpdateInvoiceRequest,
  Uuid,
} from '@fa/contracts';
import type { RequestCtx } from '@/core/context';
import type { UnitOfWork } from '@/core/unit-of-work';
import { defineRoutes, type RouteDeps } from '@/http/route-registry';
import { validatedBody, validatedParams, validatedQuery } from '@/http/middleware/validate';
import type { InvoicingService } from './invoicing.contract';
import type { InvoiceDocumentsService } from './internal/invoice-documents.service';

const IdParams = z.object({ id: Uuid });

/** §22 Invoice REST Contracts */
export function createInvoicingRoutes(
  service: InvoicingService,
  docs: InvoiceDocumentsService,
  uow: UnitOfWork,
  deps: RouteDeps,
  reqCtx: (r: Request) => RequestCtx,
): Router {
  const router = Router();
  const route = defineRoutes(router, '/invoices', deps);
  const T = 'Invoices';

  route(
    {
      method: 'post',
      path: '/',
      summary: 'Create draft invoice (backend computes totals)',
      tag: T,
      schemas: { body: CreateInvoiceRequest },
      response: { status: 201, schema: InvoiceView },
    },
    async (req, res) => {
      res
        .status(201)
        .json(
          await uow.write(reqCtx(req), (tx) =>
            service.createDraft(tx, validatedBody(req, CreateInvoiceRequest)),
          ),
        );
    },
  );
  route(
    {
      method: 'get',
      path: '/',
      summary: 'List invoices',
      tag: T,
      schemas: { query: ListInvoicesQuery },
      response: { status: 200, schema: InvoiceListResponse },
    },
    async (req, res) => {
      res.json(
        await uow.read(reqCtx(req), (tx) =>
          service.list(tx, validatedQuery(req, ListInvoicesQuery)),
        ),
      );
    },
  );
  route(
    {
      method: 'get',
      path: '/:id',
      summary: 'Get invoice',
      tag: T,
      schemas: { params: IdParams },
      response: { status: 200, schema: InvoiceView },
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
      summary: 'Edit draft (DRAFT only, else 409 INVOICE_FINALIZED)',
      tag: T,
      schemas: { params: IdParams, body: UpdateInvoiceRequest },
      response: { status: 200, schema: InvoiceView },
    },
    async (req, res) => {
      res.json(
        await uow.write(reqCtx(req), (tx) =>
          service.updateDraft(
            tx,
            validatedParams(req, IdParams).id,
            validatedBody(req, UpdateInvoiceRequest),
          ),
        ),
      );
    },
  );
  route(
    {
      method: 'post',
      path: '/:id/finalize',
      summary: 'Finalize invoice (number, snapshot, journal, audit, documents)',
      tag: T,
      schemas: { params: IdParams, body: FinalizeInvoiceRequest },
      response: { status: 200, schema: FinalizeInvoiceResponse },
    },
    async (req, res) => {
      res.json(
        await uow.write(reqCtx(req), (tx) =>
          service.finalize(tx, validatedParams(req, IdParams).id),
        ),
      );
    },
  );
  route(
    {
      method: 'post',
      path: '/:id/cancel',
      summary: 'Cancel finalized invoice (reversal journal)',
      tag: T,
      schemas: { params: IdParams, body: CancelInvoiceRequest },
      response: { status: 200, schema: InvoiceView },
    },
    async (req, res) => {
      res.json(
        await uow.write(reqCtx(req), (tx) =>
          service.cancel(
            tx,
            validatedParams(req, IdParams).id,
            validatedBody(req, CancelInvoiceRequest),
          ),
        ),
      );
    },
  );

  route(
    {
      method: 'get',
      path: '/:id/pdf',
      summary: 'Download stored invoice PDF (§41)',
      tag: T,
      schemas: { params: IdParams },
      response: { status: 200, contentType: 'application/pdf' },
    },
    async (req, res) => {
      const { buffer, filename } = await docs.getPdf(
        reqCtx(req),
        validatedParams(req, IdParams).id,
      );
      res
        .setHeader('content-type', 'application/pdf')
        .setHeader('content-disposition', `attachment; filename="${filename}"`)
        .send(buffer);
    },
  );
  route(
    {
      method: 'get',
      path: '/:id/xrechnung',
      summary: 'Download stored XRechnung XML (§39)',
      tag: T,
      schemas: { params: IdParams },
      response: { status: 200, contentType: 'application/xml' },
    },
    async (req, res) => {
      const { buffer, filename } = await docs.getXRechnung(
        reqCtx(req),
        validatedParams(req, IdParams).id,
      );
      res
        .setHeader('content-type', 'application/xml')
        .setHeader('content-disposition', `attachment; filename="${filename}"`)
        .send(buffer);
    },
  );

  const mount = Router();
  mount.use('/invoices', router);
  return mount;
}
