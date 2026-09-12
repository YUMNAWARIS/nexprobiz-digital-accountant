import type {
  AuditEntityType,
  AuditEventType,
  AuditListResponse,
  ListAuditQuery,
} from '@fa/contracts';
import type { AnyCtx, TxCtx } from '@/core/context';

export interface RecordAuditCommand {
  eventType: AuditEventType;
  entityType: AuditEntityType;
  entityId: string;
  metadata?: Record<string, unknown> | null;
}

/** §9.16 — append-only. No update/delete exists on this interface or its repository. */
export interface AuditService {
  record(tx: TxCtx, cmd: RecordAuditCommand): Promise<{ id: string }>;
  list(ctx: AnyCtx, query: ListAuditQuery): Promise<AuditListResponse>;
}
