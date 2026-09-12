import type { Actor } from '@/core/context';
import type { Logger } from 'pino';

declare module 'express-serve-static-core' {
  interface Request {
    log: Logger;
    auth?: Actor;
  }
}
/** pino-http types req.id as ReqId; normalize to string once. */
export function reqId(req: { id?: unknown }): string {
  if (typeof req.id === 'string') return req.id;
  if (typeof req.id === 'number') return String(req.id);
  return 'unknown';
}
