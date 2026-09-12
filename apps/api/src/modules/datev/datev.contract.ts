import type { CreateDatevExportRequest, DatevExportResponse, ExportView } from '@fa/contracts';
import type { AnyCtx, RequestCtx, TxCtx } from '@/core/context';
/** §9.15 — DATEV export creation, serialization, export history. Uses AccountingModule read model. */
export interface DatevService {
  begin(tx: TxCtx, input: CreateDatevExportRequest): Promise<ExportView>;
  generate(
    tx: TxCtx,
    exportId: string,
    input: CreateDatevExportRequest,
  ): Promise<DatevExportResponse>;
  fail(tx: TxCtx, exportId: string): Promise<void>;
  list(ctx: AnyCtx): Promise<ExportView[]>;
  get(ctx: AnyCtx, id: string): Promise<ExportView>;
  download(ctx: RequestCtx, id: string): Promise<{ buffer: Buffer; filename: string }>;
}
