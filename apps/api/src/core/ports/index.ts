/** §9.8 DocumentStoragePort, §9.9 QueuePort, OCR + e-invoice ports. Implementations live in infra/. */
import type { DocumentType } from "@fa/contracts";

export interface StoredBlob {
  blobName: string;
  sizeBytes: number;
  sha256: string;
}
export interface DocumentStoragePort {
  /** Stores bytes under a randomized name (SEC-005). Returns name + hash. */
  upload(input: {
    tenantId: string;
    type: DocumentType;
    buffer: Buffer;
    mimeType: string;
    originalFilename: string;
  }): Promise<StoredBlob>;
  getDownloadUrl(
    blobName: string,
    opts?: { expiresInSeconds?: number; filename?: string },
  ): Promise<string>;
  getBuffer(blobName: string): Promise<Buffer>;
  healthCheck(): Promise<boolean>;
}

export interface QueuePort {
  enqueue<T extends object>(
    queue: string,
    message: T,
    opts?: { jobId?: string },
  ): Promise<void>;
  close(): Promise<void>;
}

/** Result the OCR provider hands back (§38 "map: merchant, date, net, tax, total"). */
export interface OcrExtraction {
  provider: string;
  model: string;
  rawResult: unknown;
  merchant: string | null;
  receiptNumber: string | null;
  receiptDate: string | null; // YYYY-MM-DD
  netAmount: string | null;
  taxAmount: string | null;
  grossAmount: string | null;
  confidence: string; // "0.0000".."1.0000"
}
export interface OcrPort {
  extract(buffer: Buffer, mimeType: string): Promise<OcrExtraction>;
}

export interface GeneratedDocument {
  buffer: Buffer;
  mimeType: string;
  filename: string;
}
/** §39 — XML is never generated inside InvoiceService. */
export interface EInvoiceGenerator {
  generate(
    invoiceId: string,
    ctx: import("../context").AnyCtx,
  ): Promise<GeneratedDocument>;
}
export interface InvoicePdfGenerator {
  generate(
    invoiceId: string,
    ctx: import("../context").AnyCtx,
  ): Promise<GeneratedDocument>;
}
