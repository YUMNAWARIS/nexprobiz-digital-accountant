/**
 * ARCH-006 — every tenant-owned query includes tenant_id.
 * `#db` is a genuine ECMAScript private field: subclasses have NO way to build an
 * unscoped query. requireById() throws NotFoundError → 404 by construction (Story 2.4):
 * cross-tenant rows simply are not returned, so there is no existence oracle.
 */
import type { Knex } from 'knex';
import type { AnyCtx, TxCtx } from './context';
import { NotFoundError } from './errors';

export interface TenantRow {
  id: string;
  tenant_id: string;
}

export abstract class TenantScopedRepository<TRow extends TenantRow> {
  readonly #db: Knex;
  protected constructor(
    db: Knex,
    protected readonly table: string,
    protected readonly entity: string,
  ) {
    this.#db = db;
  }

  /** Tenant-scoped query builder. Uses the transaction when one is present. */
  protected q(ctx: AnyCtx): Knex.QueryBuilder<TRow, TRow[]> {
    const conn = 'trx' in ctx ? ctx.trx : this.#db;
    return conn<TRow>(this.table).where(
      `${this.table}.tenant_id`,
      ctx.tenantId,
    ) as Knex.QueryBuilder<TRow, TRow[]>;
  }
  protected qLocked(tx: TxCtx): Knex.QueryBuilder<TRow, TRow[]> {
    return this.q(tx).forUpdate();
  }
  /** Raw insert with tenant_id forced from ctx — never from the payload. */
  protected async insertOne(
    ctx: AnyCtx,
    row: Omit<TRow, 'tenant_id' | 'id'> & Partial<Pick<TRow, 'id'>>,
  ): Promise<TRow> {
    const conn = 'trx' in ctx ? ctx.trx : this.#db;
    const [created] = await conn<TRow>(this.table)
      .insert({ ...(row as object), tenant_id: ctx.tenantId } as never)
      .returning('*');
    return created as TRow;
  }
  protected async insertMany(
    ctx: AnyCtx,
    rows: Array<Omit<TRow, 'tenant_id' | 'id'>>,
  ): Promise<TRow[]> {
    if (rows.length === 0) return [];
    const conn = 'trx' in ctx ? ctx.trx : this.#db;
    return (await conn<TRow>(this.table)
      .insert(
        rows.map((r) => ({
          ...(r as object),
          tenant_id: ctx.tenantId,
        })) as never,
      )
      .returning('*')) as TRow[];
  }

  async findById(ctx: AnyCtx, id: string): Promise<TRow | null> {
    const row = await this.q(ctx).where(`${this.table}.id`, id).first();
    return (row as TRow | undefined) ?? null;
  }
  async requireById(ctx: AnyCtx, id: string): Promise<TRow> {
    const row = await this.findById(ctx, id);
    if (!row) throw new NotFoundError(this.entity, id);
    return row;
  }
  async requireByIdForUpdate(tx: TxCtx, id: string): Promise<TRow> {
    const row = (await this.qLocked(tx).where(`${this.table}.id`, id).first()) as TRow | undefined;
    if (!row) throw new NotFoundError(this.entity, id);
    return row;
  }
}

/** For global (non-tenant) reference tables: users, sessions, tenants, categories, tax rules. */
export function conn(db: Knex, ctx?: AnyCtx): Knex | Knex.Transaction {
  return ctx && 'trx' in ctx ? ctx.trx : db;
}
