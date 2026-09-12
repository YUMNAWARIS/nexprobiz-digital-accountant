import type { Knex } from 'knex';

/** §11.18 — the nine sandbox categories, verbatim. Idempotent. */
export const ACCOUNT_CATEGORIES = [
  {
    code: 'REVENUE_SERVICES',
    name_de: 'Erlöse aus Dienstleistungen',
    name_en: 'Service revenue',
    type: 'REVENUE',
  },
  {
    code: 'OFFICE_SUPPLIES',
    name_de: 'Bürobedarf',
    name_en: 'Office supplies',
    type: 'EXPENSE',
  },
  {
    code: 'SOFTWARE',
    name_de: 'Software',
    name_en: 'Software',
    type: 'EXPENSE',
  },
  {
    code: 'TRAVEL',
    name_de: 'Reisekosten',
    name_en: 'Travel',
    type: 'EXPENSE',
  },
  {
    code: 'TELEPHONE_INTERNET',
    name_de: 'Telefon und Internet',
    name_en: 'Telephone & internet',
    type: 'EXPENSE',
  },
  {
    code: 'BANK_FEES',
    name_de: 'Nebenkosten des Geldverkehrs',
    name_en: 'Bank fees',
    type: 'EXPENSE',
  },
  {
    code: 'PROFESSIONAL_SERVICES',
    name_de: 'Rechts- und Beratungskosten',
    name_en: 'Professional services',
    type: 'EXPENSE',
  },
  {
    code: 'MARKETING',
    name_de: 'Werbekosten',
    name_en: 'Marketing',
    type: 'EXPENSE',
  },
  {
    code: 'OTHER_BUSINESS_EXPENSE',
    name_de: 'Sonstige betriebliche Aufwendungen',
    name_en: 'Other business expense',
    type: 'EXPENSE',
  },
] as const;

export async function seed(knex: Knex): Promise<void> {
  await knex('account_categories')
    .insert(ACCOUNT_CATEGORIES.map((c) => ({ ...c, active: true })))
    .onConflict('code')
    .merge(['name_de', 'name_en', 'type', 'active']);
  console.log(`[seed] account_categories: ${ACCOUNT_CATEGORIES.length} rows upserted`);
}
