import type { DashboardResponse, EuerResponse, VatReportResponse } from '@fa/contracts';
import type { AnyCtx } from '@/core/context';
/** §9.14 — read-only. Owns no accounting truth. No mutations are permitted. */
export interface ReportingService {
  dashboard(ctx: AnyCtx, year: number): Promise<DashboardResponse>;
  euer(ctx: AnyCtx, year: number): Promise<EuerResponse>;
  vat(ctx: AnyCtx, year: number): Promise<VatReportResponse>;
}
