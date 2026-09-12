import type { Rate, TaxTreatment } from '@fa/contracts';
import type { AnyCtx } from '@/core/context';

/** §9.4 — deterministic sandbox rules. NOT income tax. */
export interface TaxRates {
  taxYear: number;
  byTreatment: Record<TaxTreatment, Rate>; // KLEINUNTERNEHMER_19 → "0.0000"
}
export interface TaxRulesService {
  ratesForYear(ctx: AnyCtx, taxYear: number): Promise<TaxRates>;
  rateFor(ctx: AnyCtx, taxYear: number, treatment: TaxTreatment): Promise<Rate>;
}
