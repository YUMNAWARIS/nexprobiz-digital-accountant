import type { Knex } from 'knex';
import { UsersRepository } from './internal/users.repository';
import { UsersServiceImpl } from './users.service';
export function createUsersModule(deps: { db: Knex }) {
  return { name: 'users', service: new UsersServiceImpl(new UsersRepository(deps.db)) };
}
