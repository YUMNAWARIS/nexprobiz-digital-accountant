import type { BusinessProfileInput, BusinessProfileView } from '@fa/contracts';
import { api } from '@/lib/api-client';
export const profileApi = {
  get: () => api<BusinessProfileView>('/business-profile'),
  put: (body: BusinessProfileInput) =>
    api<BusinessProfileView>('/business-profile', { method: 'PUT', body }),
};
