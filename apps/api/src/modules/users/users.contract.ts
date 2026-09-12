import type { Knex } from 'knex';
export interface UserView {
  id: string;
  email: string;
  status: string;
}
export interface UsersService {
  findByEmail(
    email: string,
    trx?: Knex.Transaction,
  ): Promise<(UserView & { passwordHash: string }) | null>;
  findById(id: string, trx?: Knex.Transaction): Promise<UserView | null>;
  create(input: { email: string; passwordHash: string }, trx?: Knex.Transaction): Promise<UserView>;
}
