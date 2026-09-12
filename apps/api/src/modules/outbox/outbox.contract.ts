import type { DomainEvent, EventPayload, EventType } from '@fa/contracts';
import type { TxCtx } from '@/core/context';

export interface PublishCommand<T extends EventType> {
  eventType: T;
  aggregateId: string;
  payload: EventPayload<T>;
}

/** §36 — the outbox row is written INSIDE the domain transaction; dispatch happens after COMMIT. */
export interface OutboxService {
  publish<T extends EventType>(tx: TxCtx, cmd: PublishCommand<T>): Promise<{ id: string }>;
}

/** Consumers of committed domain events (in-process). */
export type DomainEventHandler = (event: DomainEvent) => Promise<void>;
export interface DomainEventBus {
  subscribe(eventType: EventType | '*', handler: DomainEventHandler): void;
}
