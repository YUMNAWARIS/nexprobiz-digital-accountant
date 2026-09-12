import type { AuditListResponse, ListAuditQuery } from '@fa/contracts';
import { api } from '@/lib/api-client';
export const auditApi = {
  list: (q: Partial<ListAuditQuery>) => api<AuditListResponse>('/audit', { query: q }),
};
