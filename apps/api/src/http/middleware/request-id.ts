import { randomUUID } from "node:crypto";
import type { RequestHandler } from "express";

/** §18/§49 — every request carries a request ID; echoed on the response. */
export const requestId: RequestHandler = (req, res, next) => {
  const incoming = req.header("x-request-id");
  const id =
    incoming && /^[A-Za-z0-9._-]{8,128}$/.test(incoming)
      ? incoming
      : randomUUID();
  req.id = id;
  res.setHeader("x-request-id", id);
  next();
};
