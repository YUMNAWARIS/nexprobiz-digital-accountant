import type {
  LoginRequest,
  LoginResponse,
  MeResponse,
  RegisterRequest,
  RegisterResponse,
} from '@fa/contracts';
import { api } from '@/lib/api-client';
import { getRefreshToken } from '@/lib/session';
export const authApi = {
  register: (body: RegisterRequest) =>
    api<RegisterResponse>('/auth/register', { method: 'POST', body, auth: false }),
  login: (body: LoginRequest) =>
    api<LoginResponse>('/auth/login', { method: 'POST', body, auth: false }),
  logout: () =>
    api<void>('/auth/logout', {
      method: 'POST',
      body: { refreshToken: getRefreshToken() ?? '' },
      auth: false,
    }),
  me: () => api<MeResponse>('/me'),
};
