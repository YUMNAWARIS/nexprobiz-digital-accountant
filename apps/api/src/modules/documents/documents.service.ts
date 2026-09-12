import type { DocumentRow } from '@fa/database';
import type { DocumentType } from '@fa/contracts';
import type { AnyCtx, TxCtx } from '@/core/context';
import { AppError } from '@/core/errors';
import type { DocumentStoragePort } from '@/core/ports';
import type { DocumentsService, DocumentView } from './documents.contract';
import type { DocumentsRepository } from './internal/documents.repository';

function toView(r: DocumentRow): DocumentView {
  return {
    id: r.id,
    type: r.type as DocumentType,
    originalFilename: r.original_filename,
    mimeType: r.mime_type,
    sizeBytes: Number(r.size_bytes),
    sha256: r.sha256,
    createdAt: r.created_at.toISOString(),
  };
}

export class DocumentsServiceImpl implements DocumentsService {
  constructor(
    private readonly repo: DocumentsRepository,
    private readonly storage: DocumentStoragePort,
  ) {}

  async store(
    tx: TxCtx,
    input: {
      type: DocumentType;
      buffer: Buffer;
      mimeType: string;
      originalFilename: string;
      allowedMimeTypes?: readonly string[];
      maxBytes?: number;
    },
  ): Promise<DocumentView> {
    if (input.maxBytes && input.buffer.length > input.maxBytes)
      throw new AppError(
        'PAYLOAD_TOO_LARGE',
        `File exceeds ${(input.maxBytes / 1024 / 1024).toFixed(0)} MB.`,
      );
    if (input.allowedMimeTypes && !input.allowedMimeTypes.includes(input.mimeType))
      throw new AppError('UNSUPPORTED_MEDIA_TYPE', `Unsupported file type ${input.mimeType}.`);
    if (input.buffer.length === 0)
      throw new AppError('VALIDATION_FAILED', 'File is empty.', [
        { field: 'file', message: 'File is empty.' },
      ]);
    const blob = await this.storage.upload({
      tenantId: tx.tenantId,
      type: input.type,
      buffer: input.buffer,
      mimeType: input.mimeType,
      originalFilename: input.originalFilename,
    });
    const row = await this.repo.create(tx, {
      type: input.type,
      blob_name: blob.blobName,
      original_filename: input.originalFilename.slice(0, 255),
      mime_type: input.mimeType,
      size_bytes: String(blob.sizeBytes),
      sha256: blob.sha256,
    });
    return toView(row);
  }
  async get(ctx: AnyCtx, id: string): Promise<DocumentView> {
    return toView(await this.repo.requireById(ctx, id));
  }
  async getBuffer(ctx: AnyCtx, id: string): Promise<{ doc: DocumentView; buffer: Buffer }> {
    const row = await this.repo.requireById(ctx, id);
    return { doc: toView(row), buffer: await this.storage.getBuffer(row.blob_name) };
  }
}
