import { createHarness, type Harness } from './setup/harness';
import { auth, setupTenant } from './setup/fixtures';
import { createReceiptOcrHandler } from '@/worker/functions/receipt-ocr.function';
import { StubOcr } from '@/worker/services/tesseract-ocr.service';
import { createLogger } from '@/infra/logger';

// 1×1 PNG
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
  'base64',
);

describe('Epic 8 — Receipts and OCR (§24, §37, §38, §16)', () => {
  let h: Harness;
  beforeAll(async () => {
    h = await createHarness();
    await h.truncateAll();
  });
  afterAll(() => h.close());

  it('Story 8.1: valid PNG → hash, blob, document, receipt, queue message; 202 OCR_PROCESSING', async () => {
    const t = await setupTenant(h);
    h.queue.handler = null; // observe the raw enqueue first
    const r = await h.http
      .post('/api/v1/receipts')
      .set(auth(t.token))
      .attach('file', PNG, { filename: 'bon.png', contentType: 'image/png' });
    expect(r.status).toBe(202);
    expect(r.body).toEqual({ id: expect.any(String), status: 'OCR_PROCESSING' });
    expect(h.queue.messages).toEqual([
      {
        queue: 'receipt-ocr',
        message: {
          version: 1,
          receiptId: r.body.id,
          tenantId: expect.any(String),
          documentId: expect.any(String),
        },
        jobId: r.body.id,
      },
    ]);
    const doc = await h
      .adminDb('documents')
      .where({ id: h.queue.messages[0]!.message['documentId' as never] as string })
      .first();
    expect(doc).toMatchObject({
      type: 'RECEIPT',
      mime_type: 'image/png',
      size_bytes: String(PNG.length),
    });
    expect(doc!.sha256).toMatch(/^[0-9a-f]{64}$/);
    expect(doc!.blob_name).not.toContain('bon.png'); // SEC-005 randomized name
    const outbox = await h
      .adminDb('outbox_events')
      .where({ aggregate_id: r.body.id, event_type: 'ReceiptUploaded' })
      .first();
    expect(outbox).toBeTruthy();
  });

  it('SEC-005: executable / wrong MIME rejected; >10 MB rejected', async () => {
    const t = await setupTenant(h);
    const exe = await h.http
      .post('/api/v1/receipts')
      .set(auth(t.token))
      .attach('file', Buffer.from('MZ...'), {
        filename: 'virus.exe',
        contentType: 'application/x-msdownload',
      });
    expect(exe.status).toBe(415);
    const big = await h.http
      .post('/api/v1/receipts')
      .set(auth(t.token))
      .attach('file', Buffer.alloc(10 * 1024 * 1024 + 1), {
        filename: 'big.png',
        contentType: 'image/png',
      });
    expect(big.status).toBe(413);
    const none = await h.http.post('/api/v1/receipts').set(auth(t.token));
    expect(none.status).toBe(400);
  });

  it('Story 8.2 + 8.3: worker extracts merchant/date/total, stores raw response, NEEDS_REVIEW; user corrects → CONFIRMED; original OCR kept', async () => {
    const t = await setupTenant(h);
    h.queue.handler = async (_q, msg) => {
      const logger = createLogger({ level: 'silent' });
      await createReceiptOcrHandler({
        uow: h.container.infra.uow,
        receipts: h.container.services.receipts,
        storage: h.container.infra.storage,
        documents: h.container.services.documents,
        ocr: new StubOcr(),
        logger,
      })(msg, 1);
    };
    const up = await h.http
      .post('/api/v1/receipts')
      .set(auth(t.token))
      .attach('file', PNG, { filename: 'rewe.png', contentType: 'image/png' });
    const g = await h.http.get(`/api/v1/receipts/${up.body.id}`).set(auth(t.token));
    expect(g.body).toMatchObject({
      status: 'NEEDS_REVIEW',
      merchant: 'REWE Markt GmbH',
      receiptDate: '2026-09-06',
      grossAmount: '25.90',
      taxAmount: '4.13',
      netAmount: '21.77',
      ocrConfidence: expect.stringMatching(/^\d\.\d{4}$/),
    });
    const run = await h.adminDb('ocr_runs').where({ receipt_id: up.body.id }).first();
    expect(run).toMatchObject({ provider: 'TESSERACT', status: 'SUCCEEDED' });
    expect(run!.raw_result).toMatchObject({ text: expect.stringContaining('REWE') });
    const extracted = await h
      .adminDb('outbox_events')
      .where({ aggregate_id: up.body.id, event_type: 'ReceiptExtracted' })
      .first();
    expect(extracted).toBeTruthy();

    const bad = await h.http
      .patch(`/api/v1/receipts/${up.body.id}/confirm`)
      .set(auth(t.token))
      .send({
        merchant: 'REWE',
        receiptDate: '2026-09-06',
        netAmount: '21.77',
        taxAmount: '4.13',
        grossAmount: '99.00',
      });
    expect(bad.status).toBe(400);
    const c = await h.http.patch(`/api/v1/receipts/${up.body.id}/confirm`).set(auth(t.token)).send({
      merchant: 'REWE',
      receiptDate: '2026-09-06',
      netAmount: '21.77',
      taxAmount: '4.13',
      grossAmount: '25.90',
    });
    expect(c.status).toBe(200);
    expect(c.body).toMatchObject({ status: 'CONFIRMED', merchant: 'REWE' });
    const runAfter = await h.adminDb('ocr_runs').where({ receipt_id: up.body.id }).first();
    expect(runAfter!.raw_result).toEqual(run!.raw_result); // original OCR response remains stored
    expect(
      (
        await h.http.patch(`/api/v1/receipts/${up.body.id}/confirm`).set(auth(t.token)).send({
          merchant: 'X',
          receiptDate: '2026-09-06',
          netAmount: '1.00',
          taxAmount: '0.00',
          grossAmount: '1.00',
        })
      ).body.code,
    ).toBe('RECEIPT_ALREADY_CONFIRMED');
    const list = await h.http.get('/api/v1/receipts?status=CONFIRMED').set(auth(t.token));
    expect(list.body.data.map((x: { id: string }) => x.id)).toEqual([up.body.id]);
  });

  it('§38: retry ≤ 3 then receipt FAILED; a FAILED receipt can still be confirmed manually', async () => {
    const t = await setupTenant(h);
    const logger = createLogger({ level: 'silent' });
    const bad = createReceiptOcrHandler({
      uow: h.container.infra.uow,
      receipts: h.container.services.receipts,
      storage: h.container.infra.storage,
      documents: h.container.services.documents,
      ocr: {
        extract: async () => {
          throw Object.assign(new Error('boom'), { code: 'OCR_BOOM' });
        },
      },
      logger,
    });
    h.queue.handler = async (_q, msg) => {
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          await bad(msg, attempt);
          return;
        } catch {
          /* BullMQ would retry */
        }
      }
    };
    const up = await h.http
      .post('/api/v1/receipts')
      .set(auth(t.token))
      .attach('file', PNG, { filename: 'blurry.png', contentType: 'image/png' });
    const g = await h.http.get(`/api/v1/receipts/${up.body.id}`).set(auth(t.token));
    expect(g.body.status).toBe('FAILED');
    const runs = await h.adminDb('ocr_runs').where({ receipt_id: up.body.id });
    expect(runs).toHaveLength(3);
    expect(runs.every((r) => r.status === 'FAILED' && r.error_code === 'OCR_BOOM')).toBe(true);
    const c = await h.http.patch(`/api/v1/receipts/${up.body.id}/confirm`).set(auth(t.token)).send({
      merchant: 'Manual',
      receiptDate: '2026-09-01',
      netAmount: '10.00',
      taxAmount: '1.90',
      grossAmount: '11.90',
    });
    expect(c.body.status).toBe('CONFIRMED');
  });

  it('§38 idempotency: worker no-ops on an already CONFIRMED receipt', async () => {
    const t = await setupTenant(h);
    const up = await h.http
      .post('/api/v1/receipts')
      .set(auth(t.token))
      .attach('file', PNG, { filename: 'x.png', contentType: 'image/png' });
    await h.http.patch(`/api/v1/receipts/${up.body.id}/confirm`).set(auth(t.token)).send({
      merchant: 'M',
      receiptDate: '2026-09-01',
      netAmount: '1.00',
      taxAmount: '0.00',
      grossAmount: '1.00',
    });
    const msg = h.queue.messages.find(
      (m) => (m.message as { receiptId: string }).receiptId === up.body.id,
    )!.message;
    const logger = createLogger({ level: 'silent' });
    const res = await createReceiptOcrHandler({
      uow: h.container.infra.uow,
      receipts: h.container.services.receipts,
      storage: h.container.infra.storage,
      documents: h.container.services.documents,
      ocr: new StubOcr('OTHER SHOP\nSumme 1,00'),
      logger,
    })(msg, 1);
    expect(res).toBe('skipped');
    expect(
      (await h.http.get(`/api/v1/receipts/${up.body.id}`).set(auth(t.token))).body.merchant,
    ).toBe('M');
  });

  it('TEST-ACC-009: cross-tenant receipt → 404', async () => {
    const a = await setupTenant(h);
    const b = await setupTenant(h);
    const up = await h.http
      .post('/api/v1/receipts')
      .set(auth(b.token))
      .attach('file', PNG, { filename: 'x.png', contentType: 'image/png' });
    expect((await h.http.get(`/api/v1/receipts/${up.body.id}`).set(auth(a.token))).status).toBe(
      404,
    );
    expect(
      (
        await h.http.patch(`/api/v1/receipts/${up.body.id}/confirm`).set(auth(a.token)).send({
          merchant: 'M',
          receiptDate: '2026-09-01',
          netAmount: '1.00',
          taxAmount: '0.00',
          grossAmount: '1.00',
        })
      ).status,
    ).toBe(404);
  });
});
