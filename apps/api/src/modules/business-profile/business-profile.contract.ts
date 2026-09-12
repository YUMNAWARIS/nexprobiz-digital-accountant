import type { BusinessProfileInput, BusinessProfileView } from '@fa/contracts';
import type { AnyCtx, TxCtx } from '@/core/context';
/** §9.3 / §20 — PUT creates a new version; historical versions are never overwritten. */
export interface BusinessProfileService {
  getCurrent(ctx: AnyCtx): Promise<BusinessProfileView | null>;
  requireCurrent(ctx: AnyCtx): Promise<BusinessProfileView>;
  getVersion(ctx: AnyCtx, versionId: string): Promise<BusinessProfileView>;
  upsertVersion(tx: TxCtx, input: BusinessProfileInput): Promise<BusinessProfileView>;
}
