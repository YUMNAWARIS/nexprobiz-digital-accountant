import {
  RECEIPT_MAX_BYTES,
  RECEIPT_MIME_TYPES,
  RECEIPT_OCR_QUEUE,
  add,
  moneyFromDb,
  sub,
  type ConfirmReceiptRequest,
  type ListReceiptsQuery,
  type ReceiptListResponse,
  type ReceiptOcrMessageV1,
  type ReceiptView,
} from '@fa/contracts';
import type { ReceiptRow } from '@fa/database';
import type { AnyCtx, TxCtx } from '@/core/context';
import { ConflictError, ValidationError } from '@/core/errors';
import type { OcrExtraction, QueuePort } from '@/core/ports';
import type { DocumentsService } from '../documents';
import type { OutboxService } from '../outbox';
import type { ReceiptsService } from './receipts.contract';
import type { OcrRunsRepository, ReceiptsRepository } from './internal/receipts.repository';

function toView(r: ReceiptRow, expenseId: string | null): ReceiptView {
  return {
    id: r.id,
    documentId: r.document_id,
    status: r.status as ReceiptView['status'],
    merchant: r.merchant,
    receiptNumber: r.receipt_number,
    receiptDate: r.receipt_date,
    currency: r.currency,
    netAmount: r.net_amount ? moneyFromDb(r.net_amount) : null,
    taxAmount: r.tax_amount ? moneyFromDb(r.tax_amount) : null,
    grossAmount: r.gross_amount ? moneyFromDb(r.gross_amount) : null,
    ocrConfidence: r.ocr_confidence,
    expenseId,
    createdAt: r.created_at.toISOString(),
    updatedAt: r.updated_at.toISOString(),
  };
}

export class ReceiptsServiceImpl implements ReceiptsService {
  constructor(
    private readonly receipts: ReceiptsRepository,
    private readonly ocrRuns: OcrRunsRepository,
    private readonly documents: DocumentsService,
    private readonly queue: QueuePort,
    private readonly outbox: OutboxService,
  ) {}

  /** §24 — validate → hash → upload blob → document → receipt → enqueue OCR (after COMMIT) → 202 */
  async upload(
    tx: TxCtx,
    file: { buffer: Buffer; mimeType: string; originalFilename: string },
  ): Promise<ReceiptView> {
    const doc = await this.documents.store(tx, {
      type: 'RECEIPT',
      ...file,
      allowedMimeTypes: RECEIPT_MIME_TYPES,
      maxBytes: RECEIPT_MAX_BYTES,
    });
    const row = await this.receipts.create(tx, {
      document_id: doc.id,
      status: 'OCR_PROCESSING',
      merchant: null,
      receipt_number: null,
      receipt_date: null,
      currency: 'EUR',
      net_amount: null,
      tax_amount: null,
      gross_amount: null,
      ocr_confidence: null,
    });
    await this.outbox.publish(tx, {
      eventType: 'ReceiptUploaded',
      aggregateId: row.id,
      payload: { receiptId: row.id, documentId: doc.id },
    });
    const msg: ReceiptOcrMessageV1 = {
      version: 1,
      receiptId: row.id,
      tenantId: tx.tenantId,
      documentId: doc.id,
    };
    tx.onCommit(() => this.queue.enqueue(RECEIPT_OCR_QUEUE, msg, { jobId: row.id }));
    return toView(row, null);
  }

  async get(ctx: AnyCtx, id: string): Promise<ReceiptView> {
    const r = await this.receipts.requireById(ctx, id);
    return toView(r, await this.receipts.expenseIdFor(ctx, id));
  }
  async list(ctx: AnyCtx, q: ListReceiptsQuery): Promise<ReceiptListResponse> {
    const { rows, total } = await this.receipts.list(ctx, q);
    return {
      data: rows.map((r) => toView(r, r.expense_id)),
      meta: {
        page: q.page,
        pageSize: q.pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / q.pageSize)),
      },
    };
  }

  /** §24 PATCH confirm — user corrections win; original OCR result stays in ocr_runs (Story 8.3). */
  async confirm(tx: TxCtx, id: string, input: ConfirmReceiptRequest): Promise<ReceiptView> {
    const r = await this.receipts.requireByIdForUpdate(tx, id);
    if (r.status === 'CONFIRMED')
      throw new ConflictError('RECEIPT_ALREADY_CONFIRMED', 'Receipt is already confirmed.');
    if (r.status !== 'NEEDS_REVIEW' && r.status !== 'FAILED')
      throw new ConflictError(
        'RECEIPT_NOT_REVIEWABLE',
        `Receipt is ${r.status}; wait for OCR to finish.`,
      );
    if (add(input.netAmount, input.taxAmount) !== input.grossAmount) {
      throw new ValidationError([
        {
          field: 'grossAmount',
          message: `Gross must equal net + tax (${input.netAmount} + ${input.taxAmount} = ${add(input.netAmount, input.taxAmount)}).`,
        },
      ]);
    }
    const updated = await this.receipts.update(tx, id, {
      status: 'CONFIRMED',
      merchant: input.merchant,
      receipt_number: input.receiptNumber ?? null,
      receipt_date: input.receiptDate,
      net_amount: input.netAmount,
      tax_amount: input.taxAmount,
      gross_amount: input.grossAmount,
    });
    return toView(updated, null);
  }

  async requireConfirmed(ctx: AnyCtx, id: string): Promise<ReceiptView> {
    const v = await this.get(ctx, id);
    if (v.status !== 'CONFIRMED')
      throw new ConflictError(
        'RECEIPT_NOT_CONFIRMED',
        'Receipt must be confirmed before it can back an expense.',
      );
    return v;
  }

  // ---- §38 worker algorithm ----
  async beginOcr(tx: TxCtx, receiptId: string) {
    const r = await this.receipts.findById(tx, receiptId);
    if (!r) return null;
    if (r.status === 'CONFIRMED') return null; // idempotent: already reviewed by a human
    await this.receipts.update(tx, receiptId, { status: 'OCR_PROCESSING' });
    const run = await this.ocrRuns.create(tx, {
      receipt_id: receiptId,
      provider: 'TESSERACT',
      model: 'deu+eng',
      status: 'STARTED',
      raw_result: null,
      error_code: null,
      error_message: null,
      started_at: tx.now,
      completed_at: null,
    });
    return { receiptId, documentId: r.document_id, ocrRunId: run.id };
  }

  async completeOcr(tx: TxCtx, ocrRunId: string, result: OcrExtraction): Promise<ReceiptView> {
    const run = await this.ocrRuns.requireByIdForUpdate(tx, ocrRunId);
    await this.ocrRuns.update(tx, ocrRunId, {
      status: 'SUCCEEDED',
      provider: result.provider,
      model: result.model,
      raw_result: JSON.stringify(result.rawResult),
      completed_at: tx.now,
    });
    const r = await this.receipts.requireByIdForUpdate(tx, run.receipt_id);
    if (r.status === 'CONFIRMED') return toView(r, null);
    // Fill gaps deterministically: if only two of net/tax/gross were read, derive the third.
    let net = result.netAmount ? moneyFromDb(result.netAmount) : null;
    let tax = result.taxAmount ? moneyFromDb(result.taxAmount) : null;
    let gross = result.grossAmount ? moneyFromDb(result.grossAmount) : null;
    if (gross && tax && !net) net = sub(gross, tax);
    if (gross && net && !tax) tax = sub(gross, net);
    if (net && tax && !gross) gross = add(net, tax);
    const updated = await this.receipts.update(tx, r.id, {
      status: 'NEEDS_REVIEW',
      merchant: result.merchant,
      receipt_number: result.receiptNumber,
      receipt_date: result.receiptDate,
      net_amount: net,
      tax_amount: tax,
      gross_amount: gross,
      ocr_confidence: result.confidence,
    });
    await this.outbox.publish(tx, {
      eventType: 'ReceiptExtracted',
      aggregateId: r.id,
      payload: { receiptId: r.id, ocrRunId, confidence: result.confidence },
    });
    return toView(updated, null);
  }

  async failOcr(
    tx: TxCtx,
    ocrRunId: string,
    error: { code: string; message: string },
    final: boolean,
  ): Promise<void> {
    const run = await this.ocrRuns.requireByIdForUpdate(tx, ocrRunId);
    await this.ocrRuns.update(tx, ocrRunId, {
      status: 'FAILED',
      error_code: error.code.slice(0, 100),
      error_message: error.message,
      completed_at: tx.now,
    });
    if (final) {
      const r = await this.receipts.requireByIdForUpdate(tx, run.receipt_id);
      if (r.status !== 'CONFIRMED') await this.receipts.update(tx, r.id, { status: 'FAILED' });
    }
  }
}
