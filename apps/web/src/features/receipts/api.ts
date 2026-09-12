import type {
  ConfirmReceiptRequest,
  ListReceiptsQuery,
  ReceiptListResponse,
  ReceiptUploadResponse,
  ReceiptView,
} from '@fa/contracts';
import { api } from '@/lib/api-client';
export const receiptsApi = {
  list: (q: Partial<ListReceiptsQuery>) => api<ReceiptListResponse>('/receipts', { query: q }),
  get: (id: string) => api<ReceiptView>(`/receipts/${id}`),
  upload: (file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    return api<ReceiptUploadResponse>('/receipts', { method: 'POST', formData: fd });
  },
  confirm: (id: string, body: ConfirmReceiptRequest) =>
    api<ReceiptView>(`/receipts/${id}/confirm`, { method: 'PATCH', body }),
};
