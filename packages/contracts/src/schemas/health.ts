/** §48 Health Endpoints */
import { z } from 'zod';

export const HealthResponse = z.object({
  status: z.literal('ok'),
  version: z.string(),
});
export type HealthResponse = z.infer<typeof HealthResponse>;

export const ReadyResponse = z.object({
  status: z.enum(['ok', 'degraded']),
  checks: z.object({
    postgres: z.enum(['ok', 'fail']),
    blobStorage: z.enum(['ok', 'fail']),
  }),
});
export type ReadyResponse = z.infer<typeof ReadyResponse>;
