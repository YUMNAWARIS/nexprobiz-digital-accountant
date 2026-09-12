import type { Knex } from 'knex';
import type { Logger } from 'pino';
import type { IdGenerator } from '@/core/ids';
import type { DomainEventBus } from './outbox.contract';
import { OutboxRepository } from './internal/outbox.repository';
import { OutboxServiceImpl } from './outbox.service';

export function createOutboxModule(deps: { db: Knex; ids: IdGenerator; logger: Logger }) {
  const service = new OutboxServiceImpl(new OutboxRepository(deps.db), deps.ids, deps.logger);
  return {
    name: 'outbox',
    service,
    bus: service as DomainEventBus,
    start: () => service.start(),
    stop: () => service.stop(),
  };
}
