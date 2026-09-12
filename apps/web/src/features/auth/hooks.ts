'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { clearSession, saveSession } from '@/lib/session';
import { authApi } from './api';

export const useMe = () => useQuery({ queryKey: ['me'], queryFn: authApi.me });
export function useLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: authApi.login,
    onSuccess: (t) => {
      saveSession(t);
      qc.clear();
    },
  });
}
export function useRegister() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: authApi.register,
    onSuccess: (t) => {
      saveSession(t);
      qc.clear();
    },
  });
}
export function useLogout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: authApi.logout,
    onSettled: () => {
      clearSession();
      qc.clear();
    },
  });
}
