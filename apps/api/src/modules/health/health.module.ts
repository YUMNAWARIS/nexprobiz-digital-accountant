/** §48 — GET /health, GET /health/ready (Postgres + blob storage). Mounted at root, not /api/v1. */
import { Router } from "express";
import type { Knex } from "knex";
import type { HealthResponse, ReadyResponse } from "@fa/contracts";
import type { DocumentStoragePort } from "@/core/ports";

export interface HealthModuleDeps {
  db: Knex;
  storage: DocumentStoragePort;
  version: string;
}

export function createHealthModule(deps: HealthModuleDeps) {
  const router = Router();

  router.get("/health", (_req, res) => {
    const body: HealthResponse = { status: "ok", version: deps.version };
    res.json(body);
  });

  router.get("/health/ready", async (_req, res) => {
    const [pgOk, blobOk] = await Promise.all([
      deps.db
        .raw("select 1")
        .then(() => true)
        .catch(() => false),
      deps.storage.healthCheck().catch(() => false),
    ]);
    const body: ReadyResponse = {
      status: pgOk && blobOk ? "ok" : "degraded",
      checks: {
        postgres: pgOk ? "ok" : "fail",
        blobStorage: blobOk ? "ok" : "fail",
      },
    };
    res.status(pgOk && blobOk ? 200 : 503).json(body);
  });

  return { name: "health", router };
}
