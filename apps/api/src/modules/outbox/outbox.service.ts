import { EVENT_REGISTRY, type DomainEvent, type EventType } from '@fa/contracts';
import type { Logger } from 'pino';
import type { TxCtx } from '@/core/context';
import type { IdGenerator } from '@/core/ids';
import type {
  DomainEventBus,
  DomainEventHandler,
  OutboxService,
  PublishCommand,
} from './outbox.contract';
import type { OutboxRepository } from './internal/outbox.repository';

/**
 * publish(): writes outbox row in tx; registers an onCommit hook that dispatches it.
 * A polling reclaimer (start()) re-dispatches rows whose hook never ran (crash between COMMIT and dispatch).
 */
export class OutboxServiceImpl implements OutboxService, DomainEventBus {
  private readonly handlers = new Map<string, DomainEventHandler[]>();
  private timer: NodeJS.Timeout | null = null;

  constructor(
    private readonly repo: OutboxRepository,
    private readonly ids: IdGenerator,
    private readonly logger: Logger,
  ) {}

  subscribe(eventType: EventType | '*', handler: DomainEventHandler): void {
    const list = this.handlers.get(eventType) ?? [];
    list.push(handler);
    this.handlers.set(eventType, list);
  }

  async publish<T extends EventType>(tx: TxCtx, cmd: PublishCommand<T>): Promise<{ id: string }> {
    const def = EVENT_REGISTRY[cmd.eventType];
    const payload = def.payload.parse(cmd.payload);
    const row = await this.repo.insert(tx, {
      id: this.ids.uuid(),
      tenant_id: tx.tenantId,
      event_type: cmd.eventType,
      event_version: def.version,
      aggregate_type: def.aggregateType,
      aggregate_id: cmd.aggregateId,
      payload: JSON.stringify(payload) as unknown,
      occurred_at: tx.now,
    } as never);
    tx.onCommit(() => this.dispatch(row.id));
    return { id: row.id };
  }

  private async dispatch(id: string): Promise<void> {
    const row = await this.repo.findById(id);
    if (!row || row.published_at) return;
    const event: DomainEvent = {
      eventId: row.id,
      eventType: row.event_type as EventType,
      eventVersion: row.event_version,
      tenantId: row.tenant_id ?? '',
      aggregateType: row.aggregate_type,
      aggregateId: row.aggregate_id,
      occurredAt: row.occurred_at.toISOString(),
      payload: row.payload as never,
    };
    const handlers = [
      ...(this.handlers.get(event.eventType) ?? []),
      ...(this.handlers.get('*') ?? []),
    ];
    try {
      for (const h of handlers) await h(event);
      await this.repo.markPublished([row.id]);
    } catch (err) {
      await this.repo.bumpAttempt(row.id);
      this.logger.error(
        { err, eventId: row.id, eventType: row.event_type },
        'outbox dispatch failed; will retry',
      );
    }
  }

  /** Reclaimer: every `intervalMs`, dispatch rows unpublished for > `olderThanMs`. */
  start(intervalMs = 15_000, olderThanMs = 30_000): void {
    if (this.timer) return;
    const tick = async () => {
      try {
        const rows = await this.repo.claimUnpublished(100, olderThanMs);
        for (const r of rows) await this.dispatch(r.id);
      } catch (err) {
        this.logger.error({ err }, 'outbox reclaimer tick failed');
      }
    };
    this.timer = setInterval(() => void tick(), intervalMs);
    this.timer.unref();
  }
  stop(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }
}
