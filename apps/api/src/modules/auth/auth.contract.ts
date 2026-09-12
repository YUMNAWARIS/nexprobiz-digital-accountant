import type { LoginResponse, MeResponse, RegisterResponse } from '@fa/contracts';
export interface AuthService {
  register(input: { email: string; password: string }): Promise<RegisterResponse>;
  login(input: { email: string; password: string }): Promise<LoginResponse>;
  refresh(refreshToken: string): Promise<LoginResponse>;
  logout(refreshToken: string): Promise<void>;
  me(userId: string, tenantId: string): Promise<MeResponse>;
}
