import type { Knex } from 'knex';
import type { AuditEventRow } from '@fa/database';
import type { AnyCtx, TxCtx } from '@/core/context';
import { TenantScopedRepository } from '@/core/scoped-repository';

export class AuditRepository extends TenantScopedRepository<AuditEventRow> {
  constructor(db: Knex) {
    super(db, 'audit_events', 'AuditEvent');
  }
  // NOTE: deliberately no update/delete methods (§9.16). The DB trigger enforces it too.
  append(
    tx: TxCtx,
    row: Omit<AuditEventRow, 'id' | 'tenant_id' | 'occurred_at'> & { occurred_at: Date },
  ): Promise<AuditEventRow> {
    return this.insertOne(tx, row);
  }
  async list(
    ctx: AnyCtx,
    f: {
      eventType?: string;
      entityType?: string;
      entityId?: string;
      page: number;
      pageSize: number;
    },
  ) {
    const base = this.q(ctx).modify((qb): void => {
      if (f.eventType) qb.where('audit_events.event_type', f.eventType);
      if (f.entityType) qb.where('audit_events.entity_type', f.entityType);
      if (f.entityId) qb.where('audit_events.entity_id', f.entityId);
    });
    const [{ count } = { count: '0' }] = (await base
      .clone()
      .count<{ count: string }[]>('* as count')) as { count: string }[];
    const rows = (await base
      .clone()
      .leftJoin('users', 'users.id', 'audit_events.actor_user_id')
      .select('audit_events.*', 'users.email as actor_email')
      .orderBy('audit_events.occurred_at', 'desc')
      .orderBy('audit_events.id', 'desc')
      .offset((f.page - 1) * f.pageSize)
      .limit(f.pageSize)) as Array<AuditEventRow & { actor_email: string | null }>;
    return { rows, total: Number(count) };
  }
}
