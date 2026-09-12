/**
 * The whole dependency graph in one typed file (ARCH-007 wiring).
 * Modules are built in dependency order and receive only public service interfaces.
 */
import type { Knex } from "knex";
import type { Logger } from "pino";
import type { Env } from "./config/env";
import { systemClock, type Clock } from "./core/clock";
import { systemIds, type IdGenerator } from "./core/ids";
import type { DocumentStoragePort, QueuePort } from "./core/ports";
import { createUnitOfWork, type UnitOfWork } from "./core/unit-of-work";
import { createRequireAuth } from "./http/middleware/auth";
import { makeReqCtx } from "./http/context";
import { asyncHandler } from "./http/route-registry";
import { createKnex } from "./infra/db/knex";
import { BullMqQueue } from "./infra/queue/bullmq.queue";
import { InMemoryQueue } from "./infra/queue/inmemory.queue";
import { LocalDocumentStorage } from "./infra/storage/local.storage";
import { S3DocumentStorage } from "./infra/storage/s3.storage";
import { createHealthModule } from "./modules/health";

export interface Infra {
  env: Env;
  logger: Logger;
  db: Knex;
  uow: UnitOfWork;
  clock: Clock;
  ids: IdGenerator;
  storage: DocumentStoragePort;
  queue: QueuePort;
}

export interface Container {
  infra: Infra;
  healthRouter: import("express").Router;
  apiRouters: import("express").Router[];
  shutdown(): Promise<void>;
}

export function createInfra(
  env: Env,
  logger: Logger,
  overrides: Partial<Infra> = {},
): Infra {
  const db = overrides.db ?? createKnex(env.DATABASE_URL);
  const storage =
    overrides.storage ??
    (env.STORAGE_DRIVER === "local"
      ? new LocalDocumentStorage(env.STORAGE_LOCAL_DIR)
      : new S3DocumentStorage({
          endpoint: env.S3_ENDPOINT,
          region: env.S3_REGION,
          bucket: env.S3_BUCKET,
          accessKeyId: env.S3_ACCESS_KEY_ID,
          secretAccessKey: env.S3_SECRET_ACCESS_KEY,
          forcePathStyle: env.S3_FORCE_PATH_STYLE,
        }));
  const queue =
    overrides.queue ??
    (env.QUEUE_DRIVER === "inmemory"
      ? new InMemoryQueue()
      : new BullMqQueue(env.REDIS_URL));
  return {
    env,
    logger,
    db,
    uow: overrides.uow ?? createUnitOfWork(db),
    clock: overrides.clock ?? systemClock,
    ids: overrides.ids ?? systemIds,
    storage,
    queue,
  };
}

export function createContainer(infra: Infra): Container {
  const requireAuth = createRequireAuth(infra.env.JWT_SECRET);
  const reqCtx = makeReqCtx(infra.clock);
  const routeDeps = { requireAuth, asyncHandler };
  void reqCtx; // used by feature modules (P1+)
  void routeDeps;

  const health = createHealthModule({
    db: infra.db,
    storage: infra.storage,
    version: infra.env.GIT_SHA,
  });

  return {
    infra,
    healthRouter: health.router,
    apiRouters: [],
    async shutdown() {
      await infra.queue.close();
      await infra.db.destroy();
    },
  };
}
