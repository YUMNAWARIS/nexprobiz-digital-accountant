import {
  add,
  isZero,
  money,
  moneyFromDb,
  sub,
  sum,
  ZERO,
  type DashboardResponse,
  type EuerResponse,
  type Money,
  type VatReportResponse,
} from '@fa/contracts';
import type { AnyCtx } from '@/core/context';
import type { AccountingService } from '../accounting';
import { SYSTEM_ACCOUNTS } from '../accounting';
import type { BusinessProfileService } from '../business-profile';
import type { ReportingService } from './reporting.contract';
import type { ReportingRepository } from './internal/reporting.repository';

/**
 * Revenue  = CREDIT - DEBIT on revenue accounts (category_code = REVENUE_SERVICES, plus §19/7% system revenue accounts)
 * Expenses = DEBIT - CREDIT on expense accounts (any expense category_code)
 * Output VAT = CREDIT - DEBIT on OUTPUT_VAT accounts; Input VAT = DEBIT - CREDIT on INPUT_VAT accounts.
 * Only POSTED journal lines exist; a reversal contributes the mirrored line, so cancelled/reversed net to zero (§30).
 */
export class ReportingServiceImpl implements ReportingService {
  constructor(
    private readonly repo: ReportingRepository,
    private readonly profile: BusinessProfileService,
    private readonly accounting: AccountingService,
  ) {}

  private async aggregate(ctx: AnyCtx, year: number) {
    const profile = await this.profile.getCurrent(ctx);
    const chart = profile?.chartOfAccounts ?? 'SKR03';
    const sys = SYSTEM_ACCOUNTS[chart];
    const revenueAccounts = new Set([sys.REVENUE_7, sys.REVENUE_EXEMPT]);
    const outputVat = new Set([sys.OUTPUT_VAT_19, sys.OUTPUT_VAT_7]);
    const inputVat = new Set([sys.INPUT_VAT_19, sys.INPUT_VAT_7]);
    const categories = await this.accounting.listCategories(ctx);
    const byCode = new Map(categories.map((c) => [c.code, c]));

    let revenue: Money = ZERO;
    let outVat: Money = ZERO;
    let inVat: Money = ZERO;
    const expenseByCategory = new Map<string, Money>();

    for (const row of await this.repo.accountBalances(ctx, year)) {
      const credit = moneyFromDb(row.credit);
      const debit = moneyFromDb(row.debit);
      const cat = row.category_code ? byCode.get(row.category_code) : undefined;
      if (cat?.type === 'REVENUE' || revenueAccounts.has(row.account_number))
        revenue = add(revenue, sub(credit, debit));
      else if (cat?.type === 'EXPENSE')
        expenseByCategory.set(
          cat.code,
          add(expenseByCategory.get(cat.code) ?? ZERO, sub(debit, credit)),
        );
      else if (outputVat.has(row.account_number)) outVat = add(outVat, sub(credit, debit));
      else if (inputVat.has(row.account_number)) inVat = add(inVat, sub(debit, credit));
    }
    const expenses = sum([...expenseByCategory.values()]);
    return { profile, revenue, expenses, outVat, inVat, expenseByCategory, byCode };
  }

  async dashboard(ctx: AnyCtx, year: number): Promise<DashboardResponse> {
    const a = await this.aggregate(ctx, year);
    const klein = a.profile?.vatRegime === 'KLEINUNTERNEHMER';
    return {
      year,
      revenue: a.revenue,
      expenses: a.expenses,
      profit: sub(a.revenue, a.expenses),
      outstandingInvoices: money(await this.repo.outstandingInvoices(ctx, year)),
      vat: klein
        ? { outputVat: ZERO, inputVat: ZERO, payable: ZERO }
        : { outputVat: a.outVat, inputVat: a.inVat, payable: sub(a.outVat, a.inVat) },
      workItems: await this.repo.workItems(ctx),
    };
  }

  async euer(ctx: AnyCtx, year: number): Promise<EuerResponse> {
    const a = await this.aggregate(ctx, year);
    // Reversed entries net to zero (§30) — a category with nothing left is not listed.
    const expenses = [...a.expenseByCategory.entries()]
      .filter(([, amount]) => !isZero(amount))
      .map(([code, amount]) => ({
        categoryCode: code,
        name: a.byCode.get(code)?.nameDe ?? code,
        amount,
      }))
      .sort((x, y) => x.categoryCode.localeCompare(y.categoryCode));
    return {
      year,
      income: { services: a.revenue, total: a.revenue },
      expenses,
      totalExpenses: a.expenses,
      profit: sub(a.revenue, a.expenses),
    };
  }

  async vat(ctx: AnyCtx, year: number): Promise<VatReportResponse> {
    const a = await this.aggregate(ctx, year);
    if (a.profile?.vatRegime === 'KLEINUNTERNEHMER')
      return { year, vatRegime: 'KLEINUNTERNEHMER', outputVat: ZERO, inputVat: ZERO, netVat: ZERO };
    return {
      year,
      vatRegime: 'REGULAR',
      outputVat: a.outVat,
      inputVat: a.inVat,
      netVat: sub(a.outVat, a.inVat),
    };
  }
}
