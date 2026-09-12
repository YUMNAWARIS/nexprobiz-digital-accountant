import type { Request } from 'express';
import type { RequestCtx } from '@/core/context';
import { UnauthorizedError } from '@/core/errors';
import type { Clock } from '@/core/clock';
import { reqId } from '@/http/types';

/** The ONE place req.auth is turned into a RequestCtx. */
export function makeReqCtx(clock: Clock) {
  return (req: Request): RequestCtx => {
    if (!req.auth) throw new UnauthorizedError();
    return {
      tenantId: req.auth.tenantId,
      actor: req.auth,
      requestId: reqId(req),
      now: clock.now(),
      logger: req.log,
    };
  };
}
