/**
 * Integration harness: real Express app over the migrated fa_test database,
 * in-memory queue, local filesystem storage, deterministic clock.
 */
import "dotenv/config";
import knex, { type Knex } from "knex";
import { mkdtempSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import pg from "pg";
import request from "supertest";
import type { Express } from "express";
import { createApp } from "@/app";
import { loadEnv } from "@/config/env";
import {
  createContainer,
  createInfra,
  type Container,
} from "@/composition-root";
import { createLogger } from "@/infra/logger";
import { InMemoryQueue } from "@/infra/queue/inmemory.queue";
import { LocalDocumentStorage } from "@/infra/storage/local.storage";
import { ALL_TABLES } from "@fa/database";

pg.types.setTypeParser(1082, (v: string) => v);

export interface Harness {
  app: Express;
  http: request.Agent;
  container: Container;
  db: Knex; // runtime role (RLS applies)
  adminDb: Knex; // owner role — for truncation and assertions only
  queue: InMemoryQueue;
  close(): Promise<void>;
  truncateAll(): Promise<void>;
}

export async function createHarness(): Promise<Harness> {
  const env = loadEnv({
    NODE_ENV: "test",
    LOG_LEVEL: "silent",
    DATABASE_URL: process.env.TEST_DATABASE_URL!,
    JWT_SECRET: "test-access-secret-test-access-secret-0000",
    JWT_REFRESH_SECRET: "test-refresh-secret-test-refresh-secret-00",
    STORAGE_DRIVER: "local",
    QUEUE_DRIVER: "inmemory",
  });
  const logger = createLogger({ level: "silent" });
  const queue = new InMemoryQueue();
  const storage = new LocalDocumentStorage(
    mkdtempSync(path.join(os.tmpdir(), "fa-test-storage-")),
  );
  const infra = createInfra(env, logger, { queue, storage });
  const container = createContainer(infra);
  const app = createApp({
    env,
    logger,
    healthRouter: container.healthRouter,
    apiRouters: container.apiRouters,
  });
  const adminDb = knex({
    client: "pg",
    connection: process.env.TEST_DATABASE_ADMIN_URL_DB!,
  });

  return {
    app,
    http: request.agent(app),
    container,
    db: infra.db,
    adminDb,
    queue,
    async close() {
      await container.shutdown();
      await adminDb.destroy();
    },
    async truncateAll() {
      // audit_events has a TRUNCATE-rejecting trigger; disable it for test cleanup only.
      const tables = ALL_TABLES.filter(
        (t) =>
          ![
            "account_categories",
            "chart_account_mappings",
            "tax_rule_sets",
            "tax_rule_values",
          ].includes(t),
      );
      await adminDb.raw(
        "ALTER TABLE audit_events DISABLE TRIGGER audit_events_no_truncate",
      );
      await adminDb.raw(`TRUNCATE ${tables.join(", ")} CASCADE`);
      await adminDb.raw(
        "ALTER TABLE audit_events ENABLE TRIGGER audit_events_no_truncate",
      );
      queue.messages.length = 0;
    },
  };
}
