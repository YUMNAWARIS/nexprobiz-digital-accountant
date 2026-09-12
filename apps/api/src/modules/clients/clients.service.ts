import type {
  ClientListResponse,
  ClientView,
  CreateClientRequest,
  ListClientsQuery,
  UpdateClientRequest,
} from '@fa/contracts';
import type { ClientRow } from '@fa/database';
import type { AnyCtx, TxCtx } from '@/core/context';
import { AppError } from '@/core/errors';
import type { ClientsService } from './clients.contract';
import type { ClientsRepository } from './internal/clients.repository';

export function toClientView(r: ClientRow): ClientView {
  return {
    id: r.id,
    name: r.name,
    contactName: r.contact_name,
    email: r.email,
    street: r.street,
    postalCode: r.postal_code,
    city: r.city,
    country: r.country,
    vatId: r.vat_id,
    paymentTermDays: r.payment_term_days,
    status: r.status as ClientView['status'],
    createdAt: r.created_at.toISOString(),
    updatedAt: r.updated_at.toISOString(),
    archivedAt: r.archived_at?.toISOString() ?? null,
  };
}

export class ClientsServiceImpl implements ClientsService {
  constructor(private readonly repo: ClientsRepository) {}

  async create(tx: TxCtx, i: CreateClientRequest): Promise<ClientView> {
    return toClientView(
      await this.repo.create(tx, {
        name: i.name,
        contact_name: i.contactName ?? null,
        email: i.email ?? null,
        street: i.street ?? null,
        postal_code: i.postalCode ?? null,
        city: i.city ?? null,
        country: i.country,
        vat_id: i.vatId ?? null,
        payment_term_days: i.paymentTermDays ?? null,
      }),
    );
  }
  async update(tx: TxCtx, id: string, i: UpdateClientRequest): Promise<ClientView> {
    const existing = await this.repo.requireByIdForUpdate(tx, id);
    if (existing.status === 'ARCHIVED')
      throw new AppError('CLIENT_ARCHIVED', 'Archived clients cannot be edited.');
    const patch: Partial<ClientRow> = {};
    if (i.name !== undefined) patch.name = i.name;
    if (i.contactName !== undefined) patch.contact_name = i.contactName;
    if (i.email !== undefined) patch.email = i.email;
    if (i.street !== undefined) patch.street = i.street;
    if (i.postalCode !== undefined) patch.postal_code = i.postalCode;
    if (i.city !== undefined) patch.city = i.city;
    if (i.country !== undefined) patch.country = i.country;
    if (i.vatId !== undefined) patch.vat_id = i.vatId;
    if (i.paymentTermDays !== undefined) patch.payment_term_days = i.paymentTermDays;
    return toClientView(
      Object.keys(patch).length ? await this.repo.update(tx, id, patch) : existing,
    );
  }
  /** §21 DELETE — archive only. Idempotent. */
  async archive(tx: TxCtx, id: string): Promise<void> {
    const existing = await this.repo.requireByIdForUpdate(tx, id);
    if (existing.status === 'ARCHIVED') return;
    await this.repo.update(tx, id, { status: 'ARCHIVED', archived_at: tx.now });
  }
  async get(ctx: AnyCtx, id: string): Promise<ClientView> {
    return toClientView(await this.repo.requireById(ctx, id));
  }
  async requireActive(ctx: AnyCtx, id: string): Promise<ClientView> {
    const c = await this.get(ctx, id);
    if (c.status !== 'ACTIVE')
      throw new AppError('CLIENT_ARCHIVED', 'Archived clients cannot be used on new invoices.');
    return c;
  }
  async list(ctx: AnyCtx, q: ListClientsQuery): Promise<ClientListResponse> {
    const { rows, total } = await this.repo.list(ctx, q);
    return {
      data: rows.map(toClientView),
      meta: {
        page: q.page,
        pageSize: q.pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / q.pageSize)),
      },
    };
  }
}
