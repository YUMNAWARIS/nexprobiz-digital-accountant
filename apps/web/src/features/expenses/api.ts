import type {
  AccountCategoryListResponse,
  CreateExpenseRequest,
  ExpenseListResponse,
  ExpenseView,
  ListExpensesQuery,
  ReverseExpenseRequest,
  UpdateExpenseRequest,
} from '@fa/contracts';
import { api } from '@/lib/api-client';
export const expensesApi = {
  list: (q: Partial<ListExpensesQuery>) => api<ExpenseListResponse>('/expenses', { query: q }),
  get: (id: string) => api<ExpenseView>(`/expenses/${id}`),
  create: (body: CreateExpenseRequest) => api<ExpenseView>('/expenses', { method: 'POST', body }),
  update: (id: string, body: UpdateExpenseRequest) =>
    api<ExpenseView>(`/expenses/${id}`, { method: 'PATCH', body }),
  post: (id: string) => api<ExpenseView>(`/expenses/${id}/post`, { method: 'POST', body: {} }),
  reverse: (id: string, body: ReverseExpenseRequest) =>
    api<ExpenseView>(`/expenses/${id}/reverse`, { method: 'POST', body }),
  categories: () => api<AccountCategoryListResponse>('/account-categories'),
};
