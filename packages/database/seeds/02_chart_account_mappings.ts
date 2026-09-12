import type { Knex } from 'knex';

/**
 * §11.19 / §54 — SKR03 and SKR04 mappings for fiscal year 2026.
 *
 * ┌─────────────────────────────────────────────────────────────────────────────────┐
 * │ REQUIRES_STEUERBERATER_CONFIRMATION                                             │
 * │ The specification mandates seeding both charts but supplies no account numbers. │
 * │ The values below are the conventional SKR03/SKR04 accounts and MUST be confirmed│
 * │ by a Steuerberater before the client review. See docs/accounting/skr-mappings.md│
 * │ euer_code values reference "Anlage EÜR" line numbers and are likewise flagged.   │
 * └─────────────────────────────────────────────────────────────────────────────────┘
 */
export const FISCAL_YEAR = 2026;

export const CHART_MAPPINGS: Record<
  string,
  { SKR03: string; SKR04: string; euer_code: string | null }
> = {
  REVENUE_SERVICES: { SKR03: '8400', SKR04: '4400', euer_code: '14' }, // Betriebseinnahmen (umsatzsteuerpflichtig)
  OFFICE_SUPPLIES: { SKR03: '4930', SKR04: '6815', euer_code: '55' }, // Übrige Betriebsausgaben
  SOFTWARE: { SKR03: '4980', SKR04: '6837', euer_code: '55' },
  TRAVEL: { SKR03: '4670', SKR04: '6650', euer_code: '47' }, // Reisekosten
  TELEPHONE_INTERNET: { SKR03: '4920', SKR04: '6805', euer_code: '55' },
  BANK_FEES: { SKR03: '4970', SKR04: '6855', euer_code: '55' },
  PROFESSIONAL_SERVICES: { SKR03: '4950', SKR04: '6825', euer_code: '55' },
  MARKETING: { SKR03: '4610', SKR04: '6600', euer_code: '55' },
  OTHER_BUSINESS_EXPENSE: { SKR03: '4900', SKR04: '6300', euer_code: '55' },
};

export async function seed(knex: Knex): Promise<void> {
  const categories = await knex('account_categories').select<{ id: string; code: string }[]>(
    'id',
    'code',
  );
  const byCode = new Map(categories.map((c) => [c.code, c.id]));

  const rows: Array<{
    category_id: string;
    chart: 'SKR03' | 'SKR04';
    fiscal_year: number;
    account_number: string;
    euer_code: string | null;
  }> = [];
  for (const [code, m] of Object.entries(CHART_MAPPINGS)) {
    const categoryId = byCode.get(code);
    if (!categoryId)
      throw new Error(`[seed] account category ${code} missing — run 01_account_categories first`);
    rows.push({
      category_id: categoryId,
      chart: 'SKR03',
      fiscal_year: FISCAL_YEAR,
      account_number: m.SKR03,
      euer_code: m.euer_code,
    });
    rows.push({
      category_id: categoryId,
      chart: 'SKR04',
      fiscal_year: FISCAL_YEAR,
      account_number: m.SKR04,
      euer_code: m.euer_code,
    });
  }

  await knex('chart_account_mappings')
    .insert(rows)
    .onConflict(['category_id', 'chart', 'fiscal_year'])
    .merge(['account_number', 'euer_code']);
  console.log(
    `[seed] chart_account_mappings: ${rows.length} rows upserted for FY${FISCAL_YEAR} (REQUIRES_STEUERBERATER_CONFIRMATION)`,
  );
}
