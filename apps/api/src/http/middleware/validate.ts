import type { RequestHandler } from 'express';
import type { ZodTypeAny, z } from 'zod';
import { ValidationError } from '@/core/errors';

export interface Schemas {
  body?: ZodTypeAny;
  query?: ZodTypeAny;
  params?: ZodTypeAny;
}

declare module 'express-serve-static-core' {
  interface Request {
    validated: { body: unknown; query: unknown; params: unknown };
  }
}

function toDetails(err: z.ZodError, where: string) {
  return err.issues.map((i) => ({
    field: i.path.length ? i.path.join('.') : where,
    message: i.message,
  }));
}

/** Parsed values are stored on req.validated; raw req.body/query are never read by controllers. */
export function validate(schemas: Schemas): RequestHandler {
  return (req, _res, next) => {
    const out: { body: unknown; query: unknown; params: unknown } = {
      body: undefined,
      query: undefined,
      params: undefined,
    };
    for (const [key, schema] of Object.entries(schemas) as Array<[keyof Schemas, ZodTypeAny]>) {
      const r = schema.safeParse(req[key]);
      if (!r.success) return next(new ValidationError(toDetails(r.error, key)));
      out[key] = r.data;
    }
    req.validated = out;
    next();
  };
}

export function validatedBody<T extends ZodTypeAny>(
  req: { validated: { body: unknown } },
  _s: T,
): z.output<T> {
  return req.validated.body;
}
export function validatedQuery<T extends ZodTypeAny>(
  req: { validated: { query: unknown } },
  _s: T,
): z.output<T> {
  return req.validated.query;
}
export function validatedParams<T extends ZodTypeAny>(
  req: { validated: { params: unknown } },
  _s: T,
): z.output<T> {
  return req.validated.params;
}
