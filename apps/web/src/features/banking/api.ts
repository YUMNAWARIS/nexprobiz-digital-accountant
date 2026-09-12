import { type ListBankTransactionsQuery as ListBankTransactionsQuerySchema } from '@fa/contracts';
import type {
  BankImportResponse,
  BankTransactionListResponse,
  BankTransactionView,
  ClassifyBankTransactionRequest,
  CreateReconciliationRequest,
  ReconciliationView,
} from '@fa/contracts';
import type { z } from 'zod';
import { api, apiDownload } from '@/lib/api-client';
export type BankTransactionsQuery = z.input<typeof ListBankTransactionsQuerySchema>;
export const bankingApi = {
  template: () => apiDownload('/bank-imports/template', 'bank-import-template.csv'),
  import: (file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    return api<BankImportResponse>('/bank-imports', { method: 'POST', formData: fd });
  },
  list: (q: Partial<BankTransactionsQuery>) =>
    api<BankTransactionListResponse>('/bank-transactions', { query: q }),
  get: (id: string) => api<BankTransactionView>(`/bank-transactions/${id}`),
  classify: (id: string, body: ClassifyBankTransactionRequest) =>
    api<BankTransactionView>(`/bank-transactions/${id}/classification`, { method: 'PATCH', body }),
  reconcile: (body: CreateReconciliationRequest) =>
    api<ReconciliationView>('/reconciliations', { method: 'POST', body }),
};
