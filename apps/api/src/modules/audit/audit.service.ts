import type { AuditListResponse, ListAuditQuery } from '@fa/contracts';
import type { AnyCtx, TxCtx } from '@/core/context';
import type { AuditService, RecordAuditCommand } from './audit.contract';
import type { AuditRepository } from './internal/audit.repository';

export class AuditServiceImpl implements AuditService {
  constructor(private readonly repo: AuditRepository) {}

  async record(tx: TxCtx, cmd: RecordAuditCommand): Promise<{ id: string }> {
    const row = await this.repo.append(tx, {
      actor_user_id: tx.actor.userId,
      event_type: cmd.eventType,
      entity_type: cmd.entityType,
      entity_id: cmd.entityId,
      metadata: cmd.metadata ? JSON.stringify(cmd.metadata) : null,
      request_id: /^[0-9a-f-]{36}$/i.test(tx.requestId) ? tx.requestId : null,
      occurred_at: tx.now,
    });
    return { id: row.id };
  }

  async list(ctx: AnyCtx, q: ListAuditQuery): Promise<AuditListResponse> {
    const { rows, total } = await this.repo.list(ctx, q);
    return {
      data: rows.map((r) => ({
        id: r.id,
        eventType: r.event_type as AuditListResponse['data'][number]['eventType'],
        entityType: r.entity_type as AuditListResponse['data'][number]['entityType'],
        entityId: r.entity_id,
        actorUserId: r.actor_user_id,
        actorEmail: r.actor_email,
        metadata: (r.metadata as Record<string, unknown> | null) ?? null,
        requestId: r.request_id,
        occurredAt: r.occurred_at.toISOString(),
      })),
      meta: {
        page: q.page,
        pageSize: q.pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / q.pageSize)),
      },
    };
  }
}
