'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ListClientsQuery, UpdateClientRequest } from '@fa/contracts';
import { clientsApi } from './api';

export const useClients = (q: Partial<ListClientsQuery>) =>
  useQuery({ queryKey: ['clients', q], queryFn: () => clientsApi.list(q) });
export const useClient = (id: string) =>
  useQuery({ queryKey: ['clients', id], queryFn: () => clientsApi.get(id), enabled: !!id });
export function useCreateClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: clientsApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clients'] }),
  });
}
export function useUpdateClient(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (b: UpdateClientRequest) => clientsApi.update(id, b),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clients'] }),
  });
}
export function useArchiveClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: clientsApi.archive,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clients'] }),
  });
}
