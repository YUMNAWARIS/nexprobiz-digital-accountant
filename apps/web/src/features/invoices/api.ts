import type {
  CancelInvoiceRequest,
  CreateInvoiceRequest,
  FinalizeInvoiceResponse,
  InvoiceListResponse,
  InvoiceView,
  ListInvoicesQuery,
  PaymentListResponse,
  PaymentView,
  RecordPaymentRequest,
  UpdateInvoiceRequest,
} from '@fa/contracts';
import { api, apiDownload } from '@/lib/api-client';
export const invoicesApi = {
  list: (q: Partial<ListInvoicesQuery>) => api<InvoiceListResponse>('/invoices', { query: q }),
  get: (id: string) => api<InvoiceView>(`/invoices/${id}`),
  create: (body: CreateInvoiceRequest) => api<InvoiceView>('/invoices', { method: 'POST', body }),
  update: (id: string, body: UpdateInvoiceRequest) =>
    api<InvoiceView>(`/invoices/${id}`, { method: 'PATCH', body }),
  finalize: (id: string) =>
    api<FinalizeInvoiceResponse>(`/invoices/${id}/finalize`, { method: 'POST', body: {} }),
  cancel: (id: string, body: CancelInvoiceRequest) =>
    api<InvoiceView>(`/invoices/${id}/cancel`, { method: 'POST', body }),
  downloadPdf: (id: string, number: string) =>
    apiDownload(`/invoices/${id}/pdf`, `Rechnung-${number}.pdf`),
  downloadXRechnung: (id: string, number: string) =>
    apiDownload(`/invoices/${id}/xrechnung`, `XRechnung-${number}.xml`),
  payments: (id: string) => api<PaymentListResponse>(`/invoices/${id}/payments`),
  recordPayment: (id: string, body: RecordPaymentRequest) =>
    api<PaymentView>(`/invoices/${id}/payments`, { method: 'POST', body }),
};
