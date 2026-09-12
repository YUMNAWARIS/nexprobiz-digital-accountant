import type { DocumentType } from '@fa/contracts';
import type { AnyCtx, TxCtx } from '@/core/context';

export interface DocumentView {
  id: string;
  type: DocumentType;
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
  sha256: string;
  createdAt: string;
}

/** §9.8 — the ONLY module that touches blob storage. Never store bytes in Postgres (ARCH-003). */
export interface DocumentsService {
  /** Validates size/MIME, hashes, uploads under a randomized name, records metadata. */
  store(
    tx: TxCtx,
    input: {
      type: DocumentType;
      buffer: Buffer;
      mimeType: string;
      originalFilename: string;
      allowedMimeTypes?: readonly string[];
      maxBytes?: number;
    },
  ): Promise<DocumentView>;
  get(ctx: AnyCtx, id: string): Promise<DocumentView>;
  getBuffer(ctx: AnyCtx, id: string): Promise<{ doc: DocumentView; buffer: Buffer }>;
}
