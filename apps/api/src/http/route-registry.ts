/**
 * Every route is declared through here so a contract test can assert that
 * (a) every non-public route carries requireAuth and (b) every route with a body validates it.
 * This replaces NestJS's global ValidationPipe + guards.
 */
import type { RequestHandler, Router } from "express";
import type { ZodTypeAny } from "zod";
import { validate, type Schemas } from "./middleware/validate";

export type Method = "get" | "post" | "put" | "patch" | "delete";

export interface RouteDef {
  method: Method;
  path: string;
  summary: string;
  tag: string;
  public?: boolean;
  schemas?: Schemas;
  response?: { status: number; schema?: ZodTypeAny; contentType?: string };
  /** multipart/form-data upload field */
  upload?: { field: string; maxBytes: number; mimeTypes: readonly string[] };
}

export interface RegisteredRoute extends RouteDef {
  fullPath: string;
}

export const ROUTE_REGISTRY: RegisteredRoute[] = [];

export interface RouteDeps {
  requireAuth: RequestHandler;
  asyncHandler: (fn: RequestHandler) => RequestHandler;
}

/** Composes the middleware chain in the one correct order: auth → upload → validate → handler. */
export function defineRoutes(
  router: Router,
  basePath: string,
  deps: RouteDeps,
) {
  return (
    def: RouteDef,
    handler: RequestHandler,
    extra: RequestHandler[] = [],
  ) => {
    const chain: RequestHandler[] = [];
    if (!def.public) chain.push(deps.requireAuth);
    chain.push(...extra);
    if (def.schemas) chain.push(validate(def.schemas));
    chain.push(deps.asyncHandler(handler));
    router[def.method](def.path, ...chain);
    ROUTE_REGISTRY.push({
      ...def,
      fullPath: `${basePath}${def.path}`.replace(/\/{2,}/g, "/"),
    });
  };
}

export const asyncHandler =
  (fn: RequestHandler): RequestHandler =>
  (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
