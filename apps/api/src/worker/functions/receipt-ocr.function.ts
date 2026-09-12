/**
 * §38 OCR Worker Algorithm — one job = one receipt.
 *   receive → load receipt → if CONFIRMED ack → mark OCR_PROCESSING → download blob →
 *   OCR → store raw result in ocr_runs → map fields → confidence → NEEDS_REVIEW → emit ReceiptExtracted → ack
 * Failure: BullMQ retries (attempts=3); after the final attempt receipt.status = FAILED.
 */
import { ReceiptOcrMessageV1 } from '@fa/contracts';
import type { Logger } from 'pino';
import { systemCtx, type AnyCtx } from '@/core/context';
import type { DocumentStoragePort, OcrPort } from '@/core/ports';
import type { UnitOfWork } from '@/core/unit-of-work';
import type { ReceiptsService } from '@/modules/receipts';

export interface ReceiptOcrDeps {
  uow: UnitOfWork;
  receipts: ReceiptsService;
  storage: DocumentStoragePort;
  documents: {
    getBuffer: (ctx: AnyCtx, id: string) => Promise<{ buffer: Buffer; doc: { mimeType: string } }>;
  };
  ocr: OcrPort;
  logger: Logger;
}

export const MAX_ATTEMPTS = 3;

export function createReceiptOcrHandler(d: ReceiptOcrDeps) {
  return async (raw: unknown, attempt: number): Promise<'processed' | 'skipped'> => {
    const msg = ReceiptOcrMessageV1.parse(raw);
    const ctx = systemCtx(msg.tenantId, d.logger, `ocr:${msg.receiptId}:${attempt}`);

    const begin = await d.uow.write(ctx, (tx) => d.receipts.beginOcr(tx, msg.receiptId));
    if (!begin) {
      d.logger.info(
        { receiptId: msg.receiptId },
        'receipt already CONFIRMED or missing — acknowledging',
      );
      return 'skipped';
    }
    try {
      const { buffer, doc } = await d.uow.read(ctx, (tx) =>
        d.documents.getBuffer(tx, begin.documentId),
      );
      const result = await d.ocr.extract(buffer, doc.mimeType);
      await d.uow.write(ctx, (tx) => d.receipts.completeOcr(tx, begin.ocrRunId, result));
      d.logger.info(
        { receiptId: msg.receiptId, confidence: result.confidence },
        'receipt extracted → NEEDS_REVIEW',
      );
      return 'processed';
    } catch (err) {
      const e = err as { code?: string; message?: string; final?: boolean };
      const final = attempt >= MAX_ATTEMPTS || e.final === true;
      await d.uow.write(ctx, (tx) =>
        d.receipts.failOcr(
          tx,
          begin.ocrRunId,
          { code: e.code ?? 'OCR_ERROR', message: e.message ?? String(err) },
          final,
        ),
      );
      d.logger.error(
        { err, receiptId: msg.receiptId, attempt, final },
        final ? 'OCR failed permanently → FAILED' : 'OCR failed; will retry',
      );
      if (final) return 'processed'; // do not throw: BullMQ would retry a permanently failed job
      throw err;
    }
  };
}
