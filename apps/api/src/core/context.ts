/**
 * Request / transaction context. See plan §4 "Transaction propagation".
 *
 * TxCtx is nominally branded: only createUnitOfWork() can produce one, so a method whose
 * signature takes TxCtx PROVABLY runs inside a Postgres transaction with app.tenant_id set.
 */
import type { Knex } from 'knex';
import type { Logger } from 'pino';

export interface Actor {
  readonly kind: 'USER' | 'SYSTEM';
  readonly userId: string | null; // null for SYSTEM (worker, outbox dispatcher)
  readonly tenantId: string;
  readonly sessionId: string | null;
}

/** Read context — no transaction. */
export interface RequestCtx {
  readonly tenantId: string;
  readonly actor: Actor;
  readonly requestId: string;
  readonly now: Date;
  readonly logger: Logger;
}

declare const TX_BRAND: unique symbol;

/** Write context — carries THE transaction. */
export interface TxCtx extends RequestCtx {
  readonly trx: Knex.Transaction;
  readonly [TX_BRAND]: true;
  /** Runs after COMMIT only. Never on rollback. The only sanctioned post-commit hook. */
  onCommit(fn: () => void | Promise<void>): void;
}

export type AnyCtx = RequestCtx | TxCtx;

export function isTxCtx(c: AnyCtx): c is TxCtx {
  return 'trx' in c;
}

export function systemCtx(tenantId: string, logger: Logger, requestId = 'system'): RequestCtx {
  return {
    tenantId,
    actor: { kind: 'SYSTEM', userId: null, tenantId, sessionId: null },
    requestId,
    now: new Date(),
    logger,
  };
}
