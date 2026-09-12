'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ConfirmReceiptRequest, ListReceiptsQuery } from '@fa/contracts';
import { receiptsApi } from './api';

export const useReceipts = (q: Partial<ListReceiptsQuery>) =>
  useQuery({ queryKey: ['receipts', 'list', q], queryFn: () => receiptsApi.list(q) });
/** Polls while OCR is running (§53 "Reading receipt…"). */
export const useReceipt = (id: string) =>
  useQuery({
    queryKey: ['receipts', id],
    queryFn: () => receiptsApi.get(id),
    enabled: !!id,
    refetchInterval: (q) =>
      q.state.data?.status === 'OCR_PROCESSING' || q.state.data?.status === 'UPLOADED'
        ? 1500
        : false,
  });
export function useUploadReceipt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: receiptsApi.upload,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['receipts'] }),
  });
}
export function useConfirmReceipt(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (b: ConfirmReceiptRequest) => receiptsApi.confirm(id, b),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['receipts'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
