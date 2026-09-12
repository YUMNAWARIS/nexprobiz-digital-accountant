import type { Knex } from 'knex';
import type { OutboxEventRow } from '@fa/database';
import type { TxCtx } from '@/core/context';

/** Not tenant-scoped: the dispatcher runs without a tenant. Rows are still written inside the tenant tx. */
export class OutboxRepository {
  constructor(private readonly db: Knex) {}

  async insert(
    tx: TxCtx,
    row: Omit<OutboxEventRow, 'id' | 'published_at' | 'attempt_count'>,
  ): Promise<OutboxEventRow> {
    const [r] = await tx
      .trx<OutboxEventRow>('outbox_events')
      .insert(row as never)
      .returning('*');
    return r as OutboxEventRow;
  }
  async claimUnpublished(limit: number, olderThanMs: number): Promise<OutboxEventRow[]> {
    return this.db<OutboxEventRow>('outbox_events')
      .whereNull('published_at')
      .where('occurred_at', '<', new Date(Date.now() - olderThanMs))
      .where('attempt_count', '<', 10)
      .orderBy('occurred_at', 'asc')
      .limit(limit);
  }
  async markPublished(ids: string[]): Promise<void> {
    if (!ids.length) return;
    await this.db('outbox_events').whereIn('id', ids).update({ published_at: this.db.fn.now() });
  }
  async bumpAttempt(id: string): Promise<void> {
    await this.db('outbox_events').where({ id }).increment('attempt_count', 1);
  }
  findById(id: string): Promise<OutboxEventRow | undefined> {
    return this.db<OutboxEventRow>('outbox_events').where({ id }).first();
  }
}
