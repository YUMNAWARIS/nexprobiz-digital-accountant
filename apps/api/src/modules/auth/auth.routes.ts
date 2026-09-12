import { Router } from 'express';
import {
  LoginRequest,
  LoginResponse,
  LogoutRequest,
  MeResponse,
  RefreshRequest,
  RegisterRequest,
  RegisterResponse,
} from '@fa/contracts';
import { UnauthorizedError } from '@/core/errors';
import { defineRoutes, type RouteDeps } from '@/http/route-registry';
import { validatedBody } from '@/http/middleware/validate';
import type { AuthService } from './auth.contract';

/** §19 Authentication REST Contracts */
export function createAuthRoutes(service: AuthService, deps: RouteDeps): Router {
  const auth = Router();
  const route = defineRoutes(auth, '/auth', deps);

  route(
    {
      method: 'post',
      path: '/register',
      summary: 'Register (creates user + tenant + OWNER membership)',
      tag: 'Auth',
      public: true,
      schemas: { body: RegisterRequest },
      response: { status: 201, schema: RegisterResponse },
    },
    async (req, res) => {
      res.status(201).json(await service.register(validatedBody(req, RegisterRequest)));
    },
  );
  route(
    {
      method: 'post',
      path: '/login',
      summary: 'Login',
      tag: 'Auth',
      public: true,
      schemas: { body: LoginRequest },
      response: { status: 200, schema: LoginResponse },
    },
    async (req, res) => {
      res.json(await service.login(validatedBody(req, LoginRequest)));
    },
  );
  route(
    {
      method: 'post',
      path: '/refresh',
      summary: 'Rotate refresh token',
      tag: 'Auth',
      public: true,
      schemas: { body: RefreshRequest },
      response: { status: 200, schema: LoginResponse },
    },
    async (req, res) => {
      res.json(await service.refresh(validatedBody(req, RefreshRequest).refreshToken));
    },
  );
  route(
    {
      method: 'post',
      path: '/logout',
      summary: 'Revoke session',
      tag: 'Auth',
      public: true,
      schemas: { body: LogoutRequest },
      response: { status: 204 },
    },
    async (req, res) => {
      await service.logout(validatedBody(req, LogoutRequest).refreshToken);
      res.status(204).end();
    },
  );

  const me = Router();
  const meRoute = defineRoutes(me, '', deps);
  meRoute(
    {
      method: 'get',
      path: '/me',
      summary: 'Current user',
      tag: 'Auth',
      response: { status: 200, schema: MeResponse },
    },
    async (req, res) => {
      if (!req.auth?.userId) throw new UnauthorizedError();
      res.json(await service.me(req.auth.userId, req.auth.tenantId));
    },
  );

  const mount = Router();
  mount.use('/auth', auth);
  mount.use(me);
  return mount;
}
