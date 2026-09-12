import { rate, ZERO_RATE, type Rate, type TaxTreatment } from '@fa/contracts';
import { z } from 'zod';
import type { AnyCtx } from '@/core/context';
import { UnsupportedAccountingCaseError } from '@/core/errors';
import type { TaxRates, TaxRulesService } from './tax-rules.contract';
import type { TaxRulesRepository } from './internal/tax-rules.repository';

const RateValue = z.object({ rate: z.string() });

export class TaxRulesServiceImpl implements TaxRulesService {
  private readonly cache = new Map<number, TaxRates>();
  constructor(private readonly repo: TaxRulesRepository) {}

  async ratesForYear(ctx: AnyCtx, taxYear: number): Promise<TaxRates> {
    const cached = this.cache.get(taxYear);
    if (cached) return cached;
    const set = await this.repo.activeSet(ctx, 'DE', taxYear);
    // §4: no rule set for the year → unsupported, never guessed.
    if (!set) throw new UnsupportedAccountingCaseError(`No active tax rule set for DE/${taxYear}.`);
    const get = (key: string): Rate => {
      const v = set.values.find((x) => x.rule_key === key);
      if (!v) throw new UnsupportedAccountingCaseError(`Tax rule ${key} missing for ${taxYear}.`);
      return rate(RateValue.parse(v.value_json).rate);
    };
    const rates: TaxRates = {
      taxYear,
      byTreatment: {
        STANDARD_19: get('VAT_STANDARD_RATE'),
        REDUCED_7: get('VAT_REDUCED_RATE'),
        KLEINUNTERNEHMER_19: ZERO_RATE,
      },
    };
    this.cache.set(taxYear, rates);
    return rates;
  }
  async rateFor(ctx: AnyCtx, taxYear: number, treatment: TaxTreatment): Promise<Rate> {
    return (await this.ratesForYear(ctx, taxYear)).byTreatment[treatment];
  }
}
