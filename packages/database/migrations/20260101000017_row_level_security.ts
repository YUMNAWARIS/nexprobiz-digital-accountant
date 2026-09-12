import type { Knex } from 'knex';

/**
 * ARCH-006 / SEC-004 — Row-Level Security on every tenant-owned table.
 *
 * The application (fa_runtime) sets `app.tenant_id` transaction-locally as the FIRST statement
 * of every transaction (see apps/api/src/core/unit-of-work.ts). A query that forgets
 * WHERE tenant_id = ? returns zero rows instead of leaking; an INSERT with a foreign tenant_id
 * fails on WITH CHECK. FORCE applies the policy even to the table owner.
 *
 * Child tables without their own tenant_id (invoice_lines, journal_lines — per §11.9 / §11.21)
 * are scoped through their parent.
 */
const TENANT_TABLES = [
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
];

const TENANT_EXPR = "NULLIF(current_setting('app.tenant_id', true), '')::uuid";

export async function up(knex: Knex): Promise<void> {
  for (const table of TENANT_TABLES) {
    await knex.raw(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY`);
    await knex.raw(`ALTER TABLE ${table} FORCE ROW LEVEL SECURITY`);
    await knex.raw(`
      CREATE POLICY tenant_isolation ON ${table}
        USING (tenant_id = ${TENANT_EXPR})
        WITH CHECK (tenant_id = ${TENANT_EXPR})
    `);
  }

  await knex.raw('ALTER TABLE invoice_lines ENABLE ROW LEVEL SECURITY');
  await knex.raw('ALTER TABLE invoice_lines FORCE ROW LEVEL SECURITY');
  await knex.raw(`
    CREATE POLICY tenant_isolation ON invoice_lines
      USING (EXISTS (SELECT 1 FROM invoices i WHERE i.id = invoice_lines.invoice_id AND i.tenant_id = ${TENANT_EXPR}))
      WITH CHECK (EXISTS (SELECT 1 FROM invoices i WHERE i.id = invoice_lines.invoice_id AND i.tenant_id = ${TENANT_EXPR}))
  `);

  await knex.raw('ALTER TABLE journal_lines ENABLE ROW LEVEL SECURITY');
  await knex.raw('ALTER TABLE journal_lines FORCE ROW LEVEL SECURITY');
  await knex.raw(`
    CREATE POLICY tenant_isolation ON journal_lines
      USING (EXISTS (SELECT 1 FROM journal_entries e WHERE e.id = journal_lines.journal_entry_id AND e.tenant_id = ${TENANT_EXPR}))
      WITH CHECK (EXISTS (SELECT 1 FROM journal_entries e WHERE e.id = journal_lines.journal_entry_id AND e.tenant_id = ${TENANT_EXPR}))
  `);

  // The balance trigger and RLS-subquery both run as the invoking user; make the trigger
  // function SECURITY DEFINER so it can always see all lines of the entry being validated.
  await knex.raw('ALTER FUNCTION assert_journal_entry_balanced() SECURITY DEFINER');
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw('ALTER FUNCTION assert_journal_entry_balanced() SECURITY INVOKER');
  for (const table of [...TENANT_TABLES, 'invoice_lines', 'journal_lines']) {
    await knex.raw(`DROP POLICY IF EXISTS tenant_isolation ON ${table}`);
    await knex.raw(`ALTER TABLE ${table} NO FORCE ROW LEVEL SECURITY`);
    await knex.raw(`ALTER TABLE ${table} DISABLE ROW LEVEL SECURITY`);
  }
}
