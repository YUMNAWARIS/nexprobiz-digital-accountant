import type { Knex } from 'knex';
import type { Clock } from '@/core/clock';
import type { RouteDeps } from '@/http/route-registry';
import type { TenantsService } from '../tenants';
import type { UsersService } from '../users';
import type { AuthService } from './auth.contract';
import { AuthServiceImpl } from './auth.service';
import { createAuthRoutes } from './auth.routes';
import { SessionsRepository } from './internal/sessions.repository';

export function createAuthModule(deps: {
  db: Knex;
  users: UsersService;
  tenants: TenantsService;
  clock: Clock;
  secrets: { accessSecret: string; refreshSecret: string };
  routeDeps: RouteDeps;
}) {
  const service: AuthService = new AuthServiceImpl(
    deps.db,
    deps.users,
    deps.tenants,
    new SessionsRepository(deps.db),
    deps.secrets,
    deps.clock,
  );
  return { name: 'auth', service, router: createAuthRoutes(service, deps.routeDeps) };
}
