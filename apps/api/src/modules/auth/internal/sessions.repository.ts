import type { Knex } from 'knex';
import type { SessionRow } from '@fa/database';

/** §11.2 sessions — refresh tokens stored ONLY as a hash (SEC-002). */
export class SessionsRepository {
  constructor(private readonly db: Knex) {}
  async create(
    row: { user_id: string; refresh_token_hash: string; expires_at: Date },
    trx?: Knex.Transaction,
  ): Promise<SessionRow> {
    const [r] = await (trx ?? this.db)<SessionRow>('sessions').insert(row).returning('*');
    return r as SessionRow;
  }
  findByHash(hash: string): Promise<SessionRow | undefined> {
    return this.db<SessionRow>('sessions').where({ refresh_token_hash: hash }).first();
  }
  findById(id: string): Promise<SessionRow | undefined> {
    return this.db<SessionRow>('sessions').where({ id }).first();
  }
  async revoke(id: string): Promise<void> {
    await this.db('sessions')
      .where({ id })
      .whereNull('revoked_at')
      .update({ revoked_at: this.db.fn.now() });
  }
}
