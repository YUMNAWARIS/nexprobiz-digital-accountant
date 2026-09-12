import type { Knex } from 'knex';

/**
 * Extensions + the runtime role.
 *
 * Two roles exist by design (tenant isolation, ARCH-006 / SEC-004):
 *   - the OWNER role runs migrations and owns every table  (DATABASE_ADMIN_URL)
 *   - fa_runtime is what the API/worker connect as           (DATABASE_URL)
 * fa_runtime has NO BYPASSRLS and is not the table owner, so Row-Level Security
 * (migration 017) applies to every query the application makes.
 */
export async function up(knex: Knex): Promise<void> {
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');

  const password = process.env.DB_RUNTIME_PASSWORD ?? 'fa_runtime';
  await knex.raw(
    `
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'fa_runtime') THEN
        CREATE ROLE fa_runtime LOGIN PASSWORD '${password.replace(/'/g, "''")}' NOBYPASSRLS NOSUPERUSER NOCREATEDB NOCREATEROLE;
      END IF;
    END
    $$;
  `,
  );

  await knex.raw('GRANT USAGE ON SCHEMA public TO fa_runtime');
  await knex.raw(
    'GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO fa_runtime',
  );
  await knex.raw('GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO fa_runtime');
  // Tables created by later migrations inherit these grants.
  await knex.raw(
    'ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO fa_runtime',
  );
  await knex.raw(
    'ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO fa_runtime',
  );

  // updated_at maintenance for tables that have it.
  await knex.raw(`
    CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
    BEGIN
      NEW.updated_at = now();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw('DROP FUNCTION IF EXISTS set_updated_at()');
  await knex.raw('ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM fa_runtime');
  await knex.raw(
    'ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM fa_runtime',
  );
  await knex.raw('REVOKE ALL ON ALL TABLES IN SCHEMA public FROM fa_runtime');
  await knex.raw('REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM fa_runtime');
  await knex.raw('REVOKE USAGE ON SCHEMA public FROM fa_runtime');
  // The role is cluster-wide and may still hold grants in OTHER databases (e.g. fa_test);
  // dropping it there would fail and leave this migration half-rolled-back. Keep the role.
}
