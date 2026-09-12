import type {
  ClientListResponse,
  ClientView,
  CreateClientRequest,
  ListClientsQuery,
  UpdateClientRequest,
} from '@fa/contracts';
import type { AnyCtx, TxCtx } from '@/core/context';
/** §9.5 / §21 */
export interface ClientsService {
  create(tx: TxCtx, input: CreateClientRequest): Promise<ClientView>;
  update(tx: TxCtx, id: string, input: UpdateClientRequest): Promise<ClientView>;
  archive(tx: TxCtx, id: string): Promise<void>;
  get(ctx: AnyCtx, id: string): Promise<ClientView>;
  /** Throws CLIENT_ARCHIVED — used by invoicing (Story 4.1). */
  requireActive(ctx: AnyCtx, id: string): Promise<ClientView>;
  list(ctx: AnyCtx, query: ListClientsQuery): Promise<ClientListResponse>;
}
