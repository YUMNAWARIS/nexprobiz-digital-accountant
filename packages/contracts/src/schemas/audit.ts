/** Story 15.1 Audit API · §11.25 audit_events */
import { z } from "zod";
import { AuditEntityType, AuditEventType } from "../enums";
import { IsoDateTime, PageQuery, Uuid, paginated } from "./common";

export const ListAuditQuery = PageQuery.extend({
  eventType: AuditEventType.optional(),
  entityType: AuditEntityType.optional(),
  entityId: Uuid.optional(),
});
export type ListAuditQuery = z.infer<typeof ListAuditQuery>;

export const AuditEventView = z.object({
  id: Uuid,
  eventType: AuditEventType,
  entityType: AuditEntityType,
  entityId: Uuid,
  actorUserId: Uuid.nullable(),
  actorEmail: z.string().nullable(),
  metadata: z.record(z.unknown()).nullable(),
  requestId: z.string().nullable(),
  occurredAt: IsoDateTime,
});
export type AuditEventView = z.infer<typeof AuditEventView>;

export const AuditListResponse = paginated(AuditEventView);
export type AuditListResponse = z.infer<typeof AuditListResponse>;
