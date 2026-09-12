import type {
  CreateDatevExportRequest,
  DatevExportResponse,
  ExportListResponse,
  ExportView,
} from '@fa/contracts';
import { api, apiDownload } from '@/lib/api-client';
export const datevApi = {
  create: (body: CreateDatevExportRequest) =>
    api<DatevExportResponse>('/exports/datev', { method: 'POST', body }),
  list: () => api<ExportListResponse>('/exports'),
  get: (id: string) => api<ExportView>(`/exports/${id}`),
  download: (e: Pick<ExportView, 'id' | 'createdAt'>) =>
    apiDownload(
      `/exports/${e.id}/download`,
      `EXTF_Buchungsstapel_${e.createdAt.slice(0, 10).replace(/-/g, '')}.csv`,
    ),
};
