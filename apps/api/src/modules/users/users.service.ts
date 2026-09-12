import type { Knex } from 'knex';
import type { UsersService, UserView } from './users.contract';
import type { UsersRepository } from './internal/users.repository';

export class UsersServiceImpl implements UsersService {
  constructor(private readonly repo: UsersRepository) {}
  async findByEmail(email: string, trx?: Knex.Transaction) {
    const r = await this.repo.findByEmail(email.toLowerCase(), trx);
    return r ? { id: r.id, email: r.email, status: r.status, passwordHash: r.password_hash } : null;
  }
  async findById(id: string, trx?: Knex.Transaction): Promise<UserView | null> {
    const r = await this.repo.findById(id, trx);
    return r ? { id: r.id, email: r.email, status: r.status } : null;
  }
  async create(
    input: { email: string; passwordHash: string },
    trx?: Knex.Transaction,
  ): Promise<UserView> {
    const r = await this.repo.insert(
      { email: input.email.toLowerCase(), password_hash: input.passwordHash },
      trx,
    );
    return { id: r.id, email: r.email, status: r.status };
  }
}
