/**
 * The ONLY place a transaction is opened and the ONLY producer of TxCtx.
 * Sets app.tenant_id transaction-locally as the first statement — this is what activates
 * RLS (migration 017). Reads also go through a (read-only) transaction for the same reason.
 * onCommit hooks fire strictly after db.transaction() resolves, i.e. after COMMIT (§36).
 */
import type { Knex } from 'knex';
import type { RequestCtx, TxCtx } from './context';

export interface UnitOfWork {
  write<T>(ctx: RequestCtx, fn: (tx: TxCtx) => Promise<T>): Promise<T>;
  read<T>(ctx: RequestCtx, fn: (tx: TxCtx) => Promise<T>): Promise<T>;
}

export function createUnitOfWork(db: Knex): UnitOfWork {
  async function run<T>(
    ctx: RequestCtx,
    readOnly: boolean,
    fn: (tx: TxCtx) => Promise<T>,
  ): Promise<T> {
    const hooks: Array<() => void | Promise<void>> = [];
    const result = await db.transaction(async (trx) => {
      if (readOnly) await trx.raw('SET TRANSACTION READ ONLY');
      await trx.raw("SELECT set_config('app.tenant_id', ?, true)", [ctx.tenantId]);
      const tx = Object.assign(Object.create(null) as object, ctx, {
        trx,
        onCommit: (f: () => void | Promise<void>) => {
          hooks.push(f);
        },
      }) as unknown as TxCtx;
      return fn(tx);
    });
    for (const h of hooks) {
      try {
        await h();
      } catch (e) {
        ctx.logger.error({ err: e, requestId: ctx.requestId }, 'onCommit hook failed');
      }
    }
    return result;
  }
  return {
    write: (ctx, fn) => run(ctx, false, fn),
    read: (ctx, fn) => run(ctx, true, fn),
  };
}

/** Run inside an existing tx, or open one. Lets services be composable from either side. */
export function inTx<T>(
  uow: UnitOfWork,
  ctx: RequestCtx | TxCtx,
  fn: (tx: TxCtx) => Promise<T>,
): Promise<T> {
  return 'trx' in ctx ? fn(ctx) : uow.write(ctx, fn);
}
