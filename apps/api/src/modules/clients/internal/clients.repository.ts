import type { Knex } from 'knex';
import type { ClientRow } from '@fa/database';
import type { AnyCtx, TxCtx } from '@/core/context';
import { TenantScopedRepository } from '@/core/scoped-repository';

export class ClientsRepository extends TenantScopedRepository<ClientRow> {
  constructor(db: Knex) {
    super(db, 'clients', 'Client');
  }
  create(
    tx: TxCtx,
    row: Omit<
      ClientRow,
      'id' | 'tenant_id' | 'created_at' | 'updated_at' | 'archived_at' | 'status'
    >,
  ): Promise<ClientRow> {
    return this.insertOne(tx, { ...row, status: 'ACTIVE', archived_at: null } as never);
  }
  async update(tx: TxCtx, id: string, patch: Partial<ClientRow>): Promise<ClientRow> {
    const [r] = await this.q(tx)
      .where('id', id)
      .update(patch as never)
      .returning('*');
    return r as ClientRow;
  }
  async list(ctx: AnyCtx, f: { search?: string; status?: string; page: number; pageSize: number }) {
    const base = this.q(ctx).modify((qb): void => {
      if (f.status) qb.where('clients.status', f.status);
      if (f.search)
        qb.where((w): void => {
          void w
            .whereILike('clients.name', `%${f.search}%`)
            .orWhereILike('clients.email', `%${f.search}%`)
            .orWhereILike('clients.contact_name', `%${f.search}%`);
        });
    });
    const [{ count } = { count: '0' }] = (await base
      .clone()
      .count<{ count: string }[]>('* as count')) as { count: string }[];
    const rows = (await base
      .clone()
      .orderBy('clients.name', 'asc')
      .offset((f.page - 1) * f.pageSize)
      .limit(f.pageSize)) as ClientRow[];
    return { rows, total: Number(count) };
  }
}
