/**
 * Integration tests run against the docker-compose Postgres (fast, no testcontainers pull).
 * A dedicated database `fa_test` is created from scratch and migrated once per run.
 * Override with TEST_DATABASE_ADMIN_URL / TEST_DATABASE_URL.
 */
import "dotenv/config";
import { execSync } from "node:child_process";
import path from "node:path";
import knex from "knex";

const ADMIN =
  process.env.TEST_DATABASE_ADMIN_URL ??
  "postgres://fa_owner:fa_owner@localhost:5432/postgres";
const TEST_DB = "fa_test";

export default async function globalSetup(): Promise<void> {
  const admin = knex({ client: "pg", connection: ADMIN });
  try {
    await admin.raw(
      `SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = ?`,
      [TEST_DB],
    );
    await admin.raw(`DROP DATABASE IF EXISTS ${TEST_DB}`);
    await admin.raw(`CREATE DATABASE ${TEST_DB}`);
  } finally {
    await admin.destroy();
  }
  const adminTestUrl = ADMIN.replace(/\/[^/]*$/, `/${TEST_DB}`);
  const dbPkg = path.resolve(__dirname, "../../../../packages/database");
  execSync(
    "npx tsx node_modules/knex/bin/cli.js --knexfile knexfile.ts migrate:latest",
    {
      cwd: dbPkg,
      env: {
        ...process.env,
        DATABASE_ADMIN_URL: adminTestUrl,
        DB_RUNTIME_PASSWORD: "fa_runtime",
      },
      stdio: "pipe",
    },
  );
  execSync(
    "npx tsx node_modules/knex/bin/cli.js --knexfile knexfile.ts seed:run",
    {
      cwd: dbPkg,
      env: {
        ...process.env,
        DATABASE_ADMIN_URL: adminTestUrl,
        SEED_DEMO: "false",
      },
      stdio: "pipe",
    },
  );
  process.env.TEST_DATABASE_URL =
    process.env.TEST_DATABASE_URL ??
    `postgres://fa_runtime:fa_runtime@localhost:5432/${TEST_DB}`;
  process.env.TEST_DATABASE_ADMIN_URL_DB = adminTestUrl;
}
