'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiError } from '@/lib/api-client';
import { profileApi } from './api';

/** Returns null (not error) when no profile exists yet — onboarding state. */
export const useBusinessProfile = () =>
  useQuery({
    queryKey: ['business-profile'],
    queryFn: async () => {
      try {
        return await profileApi.get();
      } catch (e) {
        if (e instanceof ApiError && e.status === 404) return null;
        throw e;
      }
    },
  });
export function useSaveBusinessProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: profileApi.put,
    onSuccess: (v) => qc.setQueryData(['business-profile'], v),
  });
}
