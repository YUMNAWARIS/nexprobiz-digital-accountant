import argon2 from 'argon2';
import type { Knex } from 'knex';
import {
  ACCESS_TOKEN_TTL_SECONDS,
  type LoginResponse,
  type MeResponse,
  type RegisterResponse,
} from '@fa/contracts';
import { AppError, UnauthorizedError, rethrowUnique } from '@/core/errors';
import type { Clock } from '@/core/clock';
import type { TenantsService } from '../tenants';
import type { UsersService } from '../users';
import type { AuthService } from './auth.contract';
import type { SessionsRepository } from './internal/sessions.repository';
import {
  hashRefreshToken,
  issueRefreshToken,
  signAccessToken,
  type TokenConfig,
} from './internal/tokens';

/** SEC-001 Argon2id. */
const ARGON = { type: argon2.argon2id, memoryCost: 19456, timeCost: 2, parallelism: 1 } as const;

export class AuthServiceImpl implements AuthService {
  constructor(
    private readonly db: Knex,
    private readonly users: UsersService,
    private readonly tenants: TenantsService,
    private readonly sessions: SessionsRepository,
    private readonly tokens: TokenConfig,
    private readonly clock: Clock,
  ) {}

  /** §19 — creates user + tenant + OWNER membership atomically. */
  async register(input: { email: string; password: string }): Promise<RegisterResponse> {
    const passwordHash = await argon2.hash(input.password, ARGON);
    const result = await this.db.transaction(async (trx) => {
      const user = await this.users
        .create({ email: input.email, passwordHash }, trx)
        .catch(
          rethrowUnique(
            'users_email_unique',
            () =>
              new AppError('EMAIL_ALREADY_EXISTS', 'An account with this email already exists.'),
          ),
        );
      const { tenantId } = await this.tenants.createForUser(
        { userId: user.id, name: user.email },
        trx,
      );
      const rt = issueRefreshToken();
      const session = await this.sessions.create(
        { user_id: user.id, refresh_token_hash: rt.hash, expires_at: rt.expiresAt },
        trx,
      );
      return { user, tenantId, session, rt };
    });
    return {
      user: { id: result.user.id, email: result.user.email },
      accessToken: signAccessToken(this.tokens, {
        userId: result.user.id,
        tenantId: result.tenantId,
        sessionId: result.session.id,
      }),
      refreshToken: result.rt.token,
    };
  }

  async login(input: { email: string; password: string }): Promise<LoginResponse> {
    const user = await this.users.findByEmail(input.email);
    // Same failure for unknown user and wrong password (Story 2.2).
    const ok = user ? await argon2.verify(user.passwordHash, input.password) : false;
    if (!user || !ok) throw new UnauthorizedError('INVALID_CREDENTIALS', 'Invalid credentials.');
    if (user.status !== 'ACTIVE')
      throw new UnauthorizedError('INVALID_CREDENTIALS', 'Invalid credentials.');
    const membership = await this.tenants.resolveForUser(user.id);
    if (!membership) throw new UnauthorizedError('INVALID_CREDENTIALS', 'Invalid credentials.');
    const rt = issueRefreshToken();
    const session = await this.sessions.create({
      user_id: user.id,
      refresh_token_hash: rt.hash,
      expires_at: rt.expiresAt,
    });
    return {
      accessToken: signAccessToken(this.tokens, {
        userId: user.id,
        tenantId: membership.tenantId,
        sessionId: session.id,
      }),
      refreshToken: rt.token,
      expiresIn: ACCESS_TOKEN_TTL_SECONDS,
    };
  }

  /** Story 2.3 — rotation: old session revoked, new one issued. Revoked/expired tokens fail. */
  async refresh(refreshToken: string): Promise<LoginResponse> {
    const session = await this.sessions.findByHash(hashRefreshToken(refreshToken));
    if (!session || session.revoked_at || session.expires_at <= this.clock.now()) {
      throw new UnauthorizedError(
        'INVALID_REFRESH_TOKEN',
        'Refresh token is invalid, expired or revoked.',
      );
    }
    const membership = await this.tenants.resolveForUser(session.user_id);
    if (!membership)
      throw new UnauthorizedError('INVALID_REFRESH_TOKEN', 'Refresh token is invalid.');
    await this.sessions.revoke(session.id);
    const rt = issueRefreshToken();
    const next = await this.sessions.create({
      user_id: session.user_id,
      refresh_token_hash: rt.hash,
      expires_at: rt.expiresAt,
    });
    return {
      accessToken: signAccessToken(this.tokens, {
        userId: session.user_id,
        tenantId: membership.tenantId,
        sessionId: next.id,
      }),
      refreshToken: rt.token,
      expiresIn: ACCESS_TOKEN_TTL_SECONDS,
    };
  }

  async logout(refreshToken: string): Promise<void> {
    const session = await this.sessions.findByHash(hashRefreshToken(refreshToken));
    if (session) await this.sessions.revoke(session.id);
  }

  async me(userId: string, tenantId: string): Promise<MeResponse> {
    const user = await this.users.findById(userId);
    if (!user) throw new UnauthorizedError();
    return { id: user.id, email: user.email, tenantId };
  }
}
