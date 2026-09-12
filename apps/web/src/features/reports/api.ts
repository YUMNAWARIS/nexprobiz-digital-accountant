import type { DashboardResponse, EuerResponse, VatReportResponse } from '@fa/contracts';
import { api } from '@/lib/api-client';
export const reportsApi = {
  dashboard: (year: number) => api<DashboardResponse>('/dashboard', { query: { year } }),
  euer: (year: number) => api<EuerResponse>('/reports/euer', { query: { year } }),
  vat: (year: number) => api<VatReportResponse>('/reports/vat', { query: { year } }),
};
