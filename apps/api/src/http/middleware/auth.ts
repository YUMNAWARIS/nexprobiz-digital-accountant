import type { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { z } from "zod";
import type { Actor } from "@/core/context";
import { UnauthorizedError } from "@/core/errors";

/** SEC-003 — user_id and tenant_id come ONLY from the verified access token. */
export const AccessClaims = z.object({
  sub: z.string().uuid(),
  tid: z.string().uuid(),
  sid: z.string().uuid(),
  typ: z.literal("access"),
});
export type AccessClaims = z.infer<typeof AccessClaims>;

export function createRequireAuth(secret: string): RequestHandler {
  return (req, _res, next) => {
    const header = req.header("authorization");
    if (!header?.startsWith("Bearer ")) return next(new UnauthorizedError());
    const token = header.slice(7).trim();
    let payload: unknown;
    try {
      payload = jwt.verify(token, secret, { algorithms: ["HS256"] });
    } catch (e) {
      const name = (e as { name?: string })?.name;
      return next(
        new UnauthorizedError(
          name === "TokenExpiredError" ? "TOKEN_EXPIRED" : "UNAUTHORIZED",
          "Invalid or expired access token.",
        ),
      );
    }
    const r = AccessClaims.safeParse(payload);
    if (!r.success) return next(new UnauthorizedError());
    req.auth = Object.freeze<Actor>({
      kind: "USER",
      userId: r.data.sub,
      tenantId: r.data.tid,
      sessionId: r.data.sid,
    });
    next();
  };
}
