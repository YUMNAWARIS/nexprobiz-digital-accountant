import type {
  ConfirmReceiptRequest,
  ListReceiptsQuery,
  ReceiptListResponse,
  ReceiptView,
} from '@fa/contracts';
import type { AnyCtx, TxCtx } from '@/core/context';
import type { OcrExtraction } from '@/core/ports';

/** §9.9 — receipt lifecycle, OCR state, OCR confirmation. §16 state machine. */
export interface ReceiptsService {
  upload(
    tx: TxCtx,
    file: { buffer: Buffer; mimeType: string; originalFilename: string },
  ): Promise<ReceiptView>;
  get(ctx: AnyCtx, id: string): Promise<ReceiptView>;
  list(ctx: AnyCtx, query: ListReceiptsQuery): Promise<ReceiptListResponse>;
  confirm(tx: TxCtx, id: string, input: ConfirmReceiptRequest): Promise<ReceiptView>;
  /** Marks CONFIRMED receipts as consumed by an expense (ExpensesModule). */
  requireConfirmed(ctx: AnyCtx, id: string): Promise<ReceiptView>;

  // ---- worker-facing (§38) ----
  /** Returns null when the receipt is already CONFIRMED (idempotent no-op) or does not exist. */
  beginOcr(
    tx: TxCtx,
    receiptId: string,
  ): Promise<{ receiptId: string; documentId: string; ocrRunId: string } | null>;
  completeOcr(tx: TxCtx, ocrRunId: string, result: OcrExtraction): Promise<ReceiptView>;
  failOcr(
    tx: TxCtx,
    ocrRunId: string,
    error: { code: string; message: string },
    final: boolean,
  ): Promise<void>;
}
