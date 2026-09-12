/** §49 — never log passwords, JWTs, refresh tokens, DB passwords, receipt bytes, or the auth header. */
import pino, { type Logger } from "pino";

export const REDACT_PATHS = [
  "req.headers.authorization",
  "req.headers.cookie",
  'res.headers["set-cookie"]',
  "*.password",
  "*.passwordHash",
  "*.password_hash",
  "*.accessToken",
  "*.refreshToken",
  "*.refresh_token_hash",
  "*.token",
  "*.buffer",
  "DATABASE_URL",
  "JWT_SECRET",
  "JWT_REFRESH_SECRET",
  "S3_SECRET_ACCESS_KEY",
];

export function createLogger(opts: {
  level: string;
  pretty?: boolean;
  name?: string;
}): Logger {
  return pino({
    name: opts.name ?? "api",
    level: opts.level,
    redact: { paths: REDACT_PATHS, censor: "[REDACTED]" },
    ...(opts.pretty
      ? {
          transport: {
            target: "pino-pretty",
            options: { colorize: true, translateTime: "HH:MM:ss" },
          },
        }
      : {}),
  });
}
