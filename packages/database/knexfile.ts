/**
 * Knex CLI config. Migrations and seeds run as the table OWNER (DATABASE_ADMIN_URL).
 * The application never uses this connection — see src/index.ts for the runtime pool.
 */
import "dotenv/config";
import type { Knex } from "knex";

const adminUrl =
  process.env.DATABASE_ADMIN_URL ??
  "postgres://fa_owner:fa_owner@localhost:5432/freelancer_accounting";

const config: Knex.Config = {
  client: "pg",
  connection: adminUrl,
  pool: { min: 0, max: 5 },
  migrations: {
    directory: "./migrations",
    extension: "ts",
    loadExtensions: [".ts"],
    tableName: "knex_migrations",
    stub: "./migrations/_stub.ts.txt",
  },
  seeds: {
    directory: "./seeds",
    loadExtensions: [".ts"],
  },
};

export default config;
// CommonJS interop for the knex CLI
module.exports = config;
