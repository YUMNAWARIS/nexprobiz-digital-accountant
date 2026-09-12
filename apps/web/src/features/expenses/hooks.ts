'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocale } from 'next-intl';
import type { ListExpensesQuery, ReverseExpenseRequest, UpdateExpenseRequest } from '@fa/contracts';
import { expensesApi } from './api';

export const useExpenses = (q: Partial<ListExpensesQuery>) =>
  useQuery({ queryKey: ['expenses', 'list', q], queryFn: () => expensesApi.list(q) });
export const useExpense = (id: string) =>
  useQuery({ queryKey: ['expenses', id], queryFn: () => expensesApi.get(id), enabled: !!id });
export const useExpenseCategories = () =>
  useQuery({
    queryKey: ['account-categories'],
    queryFn: expensesApi.categories,
    staleTime: 3_600_000,
  });
/** Category display name in the UI language (API returns nameDe + nameEn). */
export function useCategoryName() {
  const locale = useLocale();
  const cats = useExpenseCategories();
  return (idOrCode: string, fallback: string) => {
    const c = cats.data?.data.find((x) => x.id === idOrCode || x.code === idOrCode);
    return c ? (locale === 'en' ? c.nameEn : c.nameDe) : fallback;
  };
}
function useInvalidate() {
  const qc = useQueryClient();
  return () =>
    Promise.all([
      qc.invalidateQueries({ queryKey: ['expenses'] }),
      qc.invalidateQueries({ queryKey: ['receipts'] }),
      qc.invalidateQueries({ queryKey: ['dashboard'] }),
      qc.invalidateQueries({ queryKey: ['reports'] }),
    ]).then(() => undefined);
}
export function useCreateExpense() {
  const inv = useInvalidate();
  return useMutation({ mutationFn: expensesApi.create, onSuccess: inv });
}
export function useUpdateExpense(id: string) {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: (b: UpdateExpenseRequest) => expensesApi.update(id, b),
    onSuccess: inv,
  });
}
export function usePostExpense(id: string) {
  const inv = useInvalidate();
  return useMutation({ mutationFn: () => expensesApi.post(id), onSuccess: inv });
}
export function useReverseExpense(id: string) {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: (b: ReverseExpenseRequest) => expensesApi.reverse(id, b),
    onSuccess: inv,
  });
}
