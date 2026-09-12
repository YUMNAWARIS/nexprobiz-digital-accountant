'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { datevApi } from './api';

export const useExports = () => useQuery({ queryKey: ['exports'], queryFn: datevApi.list });
export function useCreateDatevExport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: datevApi.create,
    onSettled: () => qc.invalidateQueries({ queryKey: ['exports'] }),
  });
}
