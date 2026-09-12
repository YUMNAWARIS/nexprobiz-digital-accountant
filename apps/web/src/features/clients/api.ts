import type {
  ClientListResponse,
  ClientView,
  CreateClientRequest,
  ListClientsQuery,
  UpdateClientRequest,
} from '@fa/contracts';
import { api } from '@/lib/api-client';
export const clientsApi = {
  list: (q: Partial<ListClientsQuery>) => api<ClientListResponse>('/clients', { query: q }),
  get: (id: string) => api<ClientView>(`/clients/${id}`),
  create: (body: CreateClientRequest) => api<ClientView>('/clients', { method: 'POST', body }),
  update: (id: string, body: UpdateClientRequest) =>
    api<ClientView>(`/clients/${id}`, { method: 'PATCH', body }),
  archive: (id: string) => api<void>(`/clients/${id}`, { method: 'DELETE' }),
};
