/**
 * Runtime Knex factory. The application connects as fa_runtime (DATABASE_URL) —
 * NOT the owner — so Row-Level Security applies (migration 017).
 */
import knex, { type Knex } from 'knex';
import pg from 'pg';

export * from './types';

/**
 * ARCH-008 backstop: node-postgres must return NUMERIC (OID 1700) as a string.
 * Registering a float parser anywhere in the dependency tree would silently turn
 * every amount into IEEE-754. We assert at startup that nobody did.
 */
export const PG_NUMERIC_OID = 1700;
export function assertNumericIsString(): void {
  const parser = pg.types.getTypeParser(PG_NUMERIC_OID) as (v: string) => unknown;
  const parsed = parser('1.005');
  if (typeof parsed !== 'string' || parsed !== '1.005') {
    throw new Error('ARCH-008 violation: pg NUMERIC type parser is not identity/string');
  }
}

export interface CreateDbOptions {
  connectionString: string;
  poolMin?: number;
  poolMax?: number;
  applicationName?: string;
}

export function createDb(opts: CreateDbOptions): Knex {
  assertNumericIsString();
  return knex({
    client: 'pg',
    connection: {
      connectionString: opts.connectionString,
      application_name: opts.applicationName ?? 'fa',
    },
    pool: { min: opts.poolMin ?? 0, max: opts.poolMax ?? 10 },
    // Money is bound as strings; never let knex coerce.
    wrapIdentifier: (v, orig) => orig(v),
  });
}

export const TENANT_TABLES = [
  'business_profile_versions',
  'clients',
  'invoice_sequences',
  'invoices',
  'payments',
  'documents',
  'receipts',
  'ocr_runs',
  'expenses',
  'bank_imports',
  'bank_transactions',
  'reconciliations',
  'journal_entries',
  'exports',
  'audit_events',
] as const;
export type TenantTable = (typeof TENANT_TABLES)[number];

export const ALL_TABLES = [
  'users',
  'sessions',
  'tenants',
  'tenant_memberships',
  'tax_rule_sets',
  'tax_rule_values',
  'account_categories',
  'chart_account_mappings',
  ...TENANT_TABLES,
  'invoice_lines',
  'journal_lines',
  'outbox_events',
] as const;
