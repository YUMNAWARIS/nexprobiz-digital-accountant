import type { Knex } from 'knex';
import type { UserRow } from '@fa/database';

/** users is a global table (no tenant_id) — used before a tenant context exists (login/register). */
export class UsersRepository {
  constructor(private readonly db: Knex) {}
  findByEmail(email: string, trx?: Knex.Transaction) {
    return (trx ?? this.db)<UserRow>('users').where({ email }).first();
  }
  findById(id: string, trx?: Knex.Transaction) {
    return (trx ?? this.db)<UserRow>('users').where({ id }).first();
  }
  async insert(
    row: { email: string; password_hash: string },
    trx?: Knex.Transaction,
  ): Promise<UserRow> {
    const [r] = await (trx ?? this.db)<UserRow>('users').insert(row).returning('*');
    return r as UserRow;
  }
}
