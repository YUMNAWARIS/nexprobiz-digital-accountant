'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ClassifyBankTransactionRequest, CreateReconciliationRequest } from '@fa/contracts';
import { bankingApi, type BankTransactionsQuery } from './api';

export const useBankTransactions = (q: Partial<BankTransactionsQuery>) =>
  useQuery({ queryKey: ['bank-transactions', 'list', q], queryFn: () => bankingApi.list(q) });
function useInvalidate() {
  const qc = useQueryClient();
  return () =>
    Promise.all([
      qc.invalidateQueries({ queryKey: ['bank-transactions'] }),
      qc.invalidateQueries({ queryKey: ['dashboard'] }),
    ]).then(() => undefined);
}
export function useImportBankCsv() {
  const inv = useInvalidate();
  return useMutation({ mutationFn: bankingApi.import, onSuccess: inv });
}
export function useClassifyBankTransaction() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: (v: { id: string } & ClassifyBankTransactionRequest) =>
      bankingApi.classify(v.id, { classification: v.classification }),
    onSuccess: inv,
  });
}
export function useReconcile() {
  const inv = useInvalidate();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (b: CreateReconciliationRequest) => bankingApi.reconcile(b),
    onSuccess: () =>
      Promise.all([inv(), qc.invalidateQueries({ queryKey: ['invoices'] })]).then(() => undefined),
  });
}
