import { Router, type Request } from 'express';
import multer from 'multer';
import { z } from 'zod';
import {
  ConfirmReceiptRequest,
  ListReceiptsQuery,
  RECEIPT_MAX_BYTES,
  RECEIPT_MIME_TYPES,
  ReceiptListResponse,
  ReceiptUploadResponse,
  ReceiptView,
  Uuid,
} from '@fa/contracts';
import type { RequestCtx } from '@/core/context';
import { ValidationError } from '@/core/errors';
import type { UnitOfWork } from '@/core/unit-of-work';
import { defineRoutes, type RouteDeps } from '@/http/route-registry';
import { validatedBody, validatedParams, validatedQuery } from '@/http/middleware/validate';
import type { ReceiptsService } from './receipts.contract';

const IdParams = z.object({ id: Uuid });
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: RECEIPT_MAX_BYTES, files: 1 },
});

/** §24 Receipt REST Contracts */
export function createReceiptsRoutes(
  service: ReceiptsService,
  uow: UnitOfWork,
  deps: RouteDeps,
  reqCtx: (r: Request) => RequestCtx,
): Router {
  const router = Router();
  const route = defineRoutes(router, '/receipts', deps);
  const T = 'Receipts';

  route(
    {
      method: 'post',
      path: '/',
      summary: 'Upload receipt (multipart "file"; jpeg/png/pdf ≤ 10 MB) → 202 OCR_PROCESSING',
      tag: T,
      upload: { field: 'file', maxBytes: RECEIPT_MAX_BYTES, mimeTypes: RECEIPT_MIME_TYPES },
      response: { status: 202, schema: ReceiptUploadResponse },
    },
    async (req, res) => {
      const f = req.file;
      if (!f) throw new ValidationError([{ field: 'file', message: 'A file is required.' }]);
      const r = await uow.write(reqCtx(req), (tx) =>
        service.upload(tx, {
          buffer: f.buffer,
          mimeType: f.mimetype,
          originalFilename: f.originalname,
        }),
      );
      res.status(202).json({ id: r.id, status: r.status });
    },
    [upload.single('file')],
  );
  route(
    {
      method: 'get',
      path: '/',
      summary: 'List receipts',
      tag: T,
      schemas: { query: ListReceiptsQuery },
      response: { status: 200, schema: ReceiptListResponse },
    },
    async (req, res) => {
      res.json(
        await uow.read(reqCtx(req), (tx) =>
          service.list(tx, validatedQuery(req, ListReceiptsQuery)),
        ),
      );
    },
  );
  route(
    {
      method: 'get',
      path: '/:id',
      summary: 'Get receipt (OCR result when NEEDS_REVIEW)',
      tag: T,
      schemas: { params: IdParams },
      response: { status: 200, schema: ReceiptView },
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
      path: '/:id/confirm',
      summary: 'Confirm/correct OCR fields → CONFIRMED',
      tag: T,
      schemas: { params: IdParams, body: ConfirmReceiptRequest },
      response: { status: 200, schema: ReceiptView },
    },
    async (req, res) => {
      res.json(
        await uow.write(reqCtx(req), (tx) =>
          service.confirm(
            tx,
            validatedParams(req, IdParams).id,
            validatedBody(req, ConfirmReceiptRequest),
          ),
        ),
      );
    },
  );

  const mount = Router();
  mount.use('/receipts', router);
  return mount;
}
