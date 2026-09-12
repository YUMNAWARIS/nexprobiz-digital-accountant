import type { Actor } from "@/core/context";
import type { Logger } from "pino";

declare module "express-serve-static-core" {
  interface Request {
    log: Logger;
    auth?: Actor;
  }
}
/** pino-http types req.id as ReqId; normalize to string once. */
export function reqId(req: { id?: unknown }): string {
  return typeof req.id === "string" ? req.id : String(req.id ?? "unknown");
}
