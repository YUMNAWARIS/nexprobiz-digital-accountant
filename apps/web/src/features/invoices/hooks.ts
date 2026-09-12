'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  CancelInvoiceRequest,
  ListInvoicesQuery,
  RecordPaymentRequest,
  UpdateInvoiceRequest,
} from '@fa/contracts';
import { invoicesApi } from './api';

const inv = (id?: string) => (id ? ['invoices', id] : ['invoices']);
export const useInvoices = (q: Partial<ListInvoicesQuery>) =>
  useQuery({ queryKey: ['invoices', 'list', q], queryFn: () => invoicesApi.list(q) });
export const useInvoice = (id: string) =>
  useQuery({ queryKey: inv(id), queryFn: () => invoicesApi.get(id), enabled: !!id });
export const useInvoicePayments = (id: string) =>
  useQuery({
    queryKey: ['invoices', id, 'payments'],
    queryFn: () => invoicesApi.payments(id),
    enabled: !!id,
  });

function useInvalidate() {
  const qc = useQueryClient();
  return () =>
    qc
      .invalidateQueries({ queryKey: ['invoices'] })
      .then(() => qc.invalidateQueries({ queryKey: ['dashboard'] }));
}
export function useCreateInvoice() {
  const inv = useInvalidate();
  return useMutation({ mutationFn: invoicesApi.create, onSuccess: inv });
}
export function useUpdateInvoice(id: string) {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: (b: UpdateInvoiceRequest) => invoicesApi.update(id, b),
    onSuccess: inv,
  });
}
export function useFinalizeInvoice(id: string) {
  const inv = useInvalidate();
  return useMutation({ mutationFn: () => invoicesApi.finalize(id), onSuccess: inv });
}
export function useCancelInvoice(id: string) {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: (b: CancelInvoiceRequest) => invoicesApi.cancel(id, b),
    onSuccess: inv,
  });
}
export function useRecordPayment(id: string) {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: (b: RecordPaymentRequest) => invoicesApi.recordPayment(id, b),
    onSuccess: inv,
  });
}
