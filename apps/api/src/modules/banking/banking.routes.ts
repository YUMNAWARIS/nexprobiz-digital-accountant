import { Router, type Request } from 'express';
import multer from 'multer';
import { z } from 'zod';
import {
  BANK_CSV_TEMPLATE,
  BankImportResponse,
  BankTransactionListResponse,
  BankTransactionView,
  ClassifyBankTransactionRequest,
  ListBankTransactionsQuery,
  Uuid,
} from '@fa/contracts';
import type { RequestCtx } from '@/core/context';
import { ValidationError } from '@/core/errors';
import type { UnitOfWork } from '@/core/unit-of-work';
import { defineRoutes, type RouteDeps } from '@/http/route-registry';
import { validatedBody, validatedParams, validatedQuery } from '@/http/middleware/validate';
import type { BankingService } from './banking.contract';

const IdParams = z.object({ id: Uuid });
const CSV_MAX = 5 * 1024 * 1024;
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: CSV_MAX, files: 1 } });

/** §26 POST /bank-imports · §27 GET /bank-transactions, PATCH /bank-transactions/:id/classification */
export function createBankingRoutes(
  service: BankingService,
  uow: UnitOfWork,
  deps: RouteDeps,
  reqCtx: (r: Request) => RequestCtx,
): Router {
  const imports = Router();
  const importRoute = defineRoutes(imports, '/bank-imports', deps);
  importRoute(
    {
      method: 'get',
      path: '/template',
      summary: 'Download the normalized CSV template',
      tag: 'Banking',
      response: { status: 200, contentType: 'text/csv' },
    },
    (_req, res) => {
      res
        .setHeader('content-type', 'text/csv; charset=utf-8')
        .setHeader('content-disposition', 'attachment; filename="bank-import-template.csv"')
        .send(BANK_CSV_TEMPLATE);
    },
  );
  importRoute(
    {
      method: 'post',
      path: '/',
      summary: 'Import bank CSV (multipart "file")',
      tag: 'Banking',
      upload: { field: 'file', maxBytes: CSV_MAX, mimeTypes: ['text/csv'] },
      response: { status: 200, schema: BankImportResponse },
    },
    async (req, res) => {
      const f = req.file;
      if (!f) throw new ValidationError([{ field: 'file', message: 'A CSV file is required.' }]);
      res.json(
        await uow.write(reqCtx(req), (tx) =>
          service.importCsv(tx, { buffer: f.buffer, filename: f.originalname }),
        ),
      );
    },
    [upload.single('file')],
  );

  const txs = Router();
  const txRoute = defineRoutes(txs, '/bank-transactions', deps);
  txRoute(
    {
      method: 'get',
      path: '/',
      summary: 'List bank transactions',
      tag: 'Banking',
      schemas: { query: ListBankTransactionsQuery },
      response: { status: 200, schema: BankTransactionListResponse },
    },
    async (req, res) => {
      res.json(
        await uow.read(reqCtx(req), (tx) =>
          service.list(tx, validatedQuery(req, ListBankTransactionsQuery)),
        ),
      );
    },
  );
  txRoute(
    {
      method: 'get',
      path: '/:id',
      summary: 'Get bank transaction',
      tag: 'Banking',
      schemas: { params: IdParams },
      response: { status: 200, schema: BankTransactionView },
    },
    async (req, res) => {
      res.json(
        await uow.read(reqCtx(req), (tx) => service.get(tx, validatedParams(req, IdParams).id)),
      );
    },
  );
  txRoute(
    {
      method: 'patch',
      path: '/:id/classification',
      summary: 'Classify (UNREVIEWED/BUSINESS/PERSONAL/TRANSFER)',
      tag: 'Banking',
      schemas: { params: IdParams, body: ClassifyBankTransactionRequest },
      response: { status: 200, schema: BankTransactionView },
    },
    async (req, res) => {
      res.json(
        await uow.write(reqCtx(req), (tx) =>
          service.classify(
            tx,
            validatedParams(req, IdParams).id,
            validatedBody(req, ClassifyBankTransactionRequest).classification,
          ),
        ),
      );
    },
  );

  const mount = Router();
  mount.use('/bank-imports', imports);
  mount.use('/bank-transactions', txs);
  return mount;
}
