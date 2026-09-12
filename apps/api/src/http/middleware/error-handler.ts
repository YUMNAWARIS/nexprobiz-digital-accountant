import type { ErrorRequestHandler, RequestHandler } from "express";
import type { ApiErrorBody } from "@fa/contracts";
import { AppError } from "@/core/errors";
import { reqId } from "@/http/types";

/** §18 — every error body is {status, code, message, details?, requestId}. */
export const errorHandler: ErrorRequestHandler = (
  err: unknown,
  req,
  res,
  _next,
) => {
  const requestId = reqId(req);

  if (err instanceof AppError) {
    const body: ApiErrorBody = {
      status: err.status,
      code: err.code,
      message: err.message,
      requestId,
    };
    if (err.details?.length) body.details = err.details;
    if (err.status >= 500) req.log?.error({ err, requestId }, err.code);
    res.status(err.status).json(body);
    return;
  }

  // body-parser / multer style errors
  const e = err as {
    type?: string;
    status?: number;
    code?: string;
    message?: string;
  };
  if (e?.type === "entity.parse.failed") {
    res
      .status(400)
      .json({
        status: 400,
        code: "VALIDATION_FAILED",
        message: "Malformed JSON body.",
        requestId,
      } satisfies ApiErrorBody);
    return;
  }
  if (e?.type === "entity.too.large" || e?.code === "LIMIT_FILE_SIZE") {
    res
      .status(413)
      .json({
        status: 413,
        code: "PAYLOAD_TOO_LARGE",
        message: "Payload exceeds the sandbox limit.",
        requestId,
      } satisfies ApiErrorBody);
    return;
  }

  req.log?.error({ err, requestId }, "unhandled error");
  res
    .status(500)
    .json({
      status: 500,
      code: "INTERNAL_ERROR",
      message: "Internal server error.",
      requestId,
    } satisfies ApiErrorBody);
};

export const notFoundHandler: RequestHandler = (req, res) => {
  res
    .status(404)
    .json({
      status: 404,
      code: "NOT_FOUND",
      message: `Route ${req.method} ${req.path} not found.`,
      requestId: reqId(req),
    } satisfies ApiErrorBody);
};
