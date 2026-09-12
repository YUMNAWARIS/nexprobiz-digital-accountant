/** §19 Authentication REST Contracts */
import { z } from 'zod';
import { body, Email, Uuid } from './common';

// Password policy: sandbox minimum; spec gives "StrongPassword123!" as the example.
export const Password = z.string().min(8).max(128);

export const RegisterRequest = body({ email: Email, password: Password });
export type RegisterRequest = z.infer<typeof RegisterRequest>;

export const AuthUser = z.object({ id: Uuid, email: z.string() });
export type AuthUser = z.infer<typeof AuthUser>;

export const RegisterResponse = z.object({
  user: AuthUser,
  accessToken: z.string(),
  refreshToken: z.string(),
});
export type RegisterResponse = z.infer<typeof RegisterResponse>;

export const LoginRequest = body({ email: Email, password: z.string().min(1) });
export type LoginRequest = z.infer<typeof LoginRequest>;

export const LoginResponse = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  expiresIn: z.number().int(), // seconds; 900 per SEC-002
});
export type LoginResponse = z.infer<typeof LoginResponse>;

export const RefreshRequest = body({ refreshToken: z.string().min(1) });
export type RefreshRequest = z.infer<typeof RefreshRequest>;
export const RefreshResponse = LoginResponse;
export type RefreshResponse = z.infer<typeof RefreshResponse>;

export const LogoutRequest = body({ refreshToken: z.string().min(1) });
export type LogoutRequest = z.infer<typeof LogoutRequest>;

export const MeResponse = z.object({
  id: Uuid,
  email: z.string(),
  tenantId: Uuid,
});
export type MeResponse = z.infer<typeof MeResponse>;

export const ACCESS_TOKEN_TTL_SECONDS = 15 * 60; // SEC-002
export const REFRESH_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60; // SEC-002
