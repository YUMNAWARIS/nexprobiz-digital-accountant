import { createHash, randomBytes } from 'node:crypto';
import jwt from 'jsonwebtoken';
import { ACCESS_TOKEN_TTL_SECONDS, REFRESH_TOKEN_TTL_SECONDS } from '@fa/contracts';

export interface TokenConfig {
  accessSecret: string;
  refreshSecret: string;
}

/** Access token: HS256 JWT, 15 min (SEC-002). Claims: sub=user, tid=tenant, sid=session. */
export function signAccessToken(
  cfg: TokenConfig,
  c: { userId: string; tenantId: string; sessionId: string },
): string {
  return jwt.sign(
    { sub: c.userId, tid: c.tenantId, sid: c.sessionId, typ: 'access' },
    cfg.accessSecret,
    {
      algorithm: 'HS256',
      expiresIn: ACCESS_TOKEN_TTL_SECONDS,
    },
  );
}

/** Refresh token: opaque random 256-bit value; DB stores only sha256(token). 7 days (SEC-002). */
export function issueRefreshToken(): { token: string; hash: string; expiresAt: Date } {
  const token = randomBytes(32).toString('base64url');
  return {
    token,
    hash: hashRefreshToken(token),
    expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_SECONDS * 1000),
  };
}
export function hashRefreshToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
