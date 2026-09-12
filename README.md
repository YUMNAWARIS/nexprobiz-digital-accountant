# Freelancer Accounting — Germany Sandbox MVP

Accounting SaaS sandbox for German freelancers: register → business/tax profile → clients → invoices (PDF + XRechnung) → payments → receipts + OCR → expenses → bank CSV → reconciliation → dashboard / EÜR / VAT → DATEV export → audit trail.

> **Sandbox — For testing only. Do not use for official bookkeeping or tax filing.**

## Prerequisites

- Node 22 LTS, Docker Desktop
- pnpm 9 via corepack: `corepack enable --install-directory ~/.local/bin pnpm` and put `~/.local/bin` on your `PATH`

## Quick start

```bash
pnpm install
pnpm docker:up                          # postgres:16, redis:7, minio (+ creates bucket `documents`)
cp packages/database/.env.example packages/database/.env
cp apps/api/.env.example apps/api/.env
pnpm --filter "./packages/*" build      # contracts + database
pnpm db:migrate && pnpm db:seed         # 17 migrations, 26 tables, reference data
pnpm dev:api                            # http://localhost:8000  ·  Swagger: /api/docs  ·  /health/ready
```

## Checks

```bash
pnpm lint && pnpm typecheck && pnpm arch && pnpm test
```

`pnpm arch` runs dependency-cruiser (ARCH-002/003/007). API integration tests use the docker Postgres and recreate database `fa_test` on every run.

## Layout (spec §6)

```
apps/api        Express 5 + TS modular monolith  (§9 modules under src/modules/)
apps/web        Next.js 15 App Router            (§50 routes)
apps/worker     BullMQ receipt-ocr consumer      (§37/§38)
apps/mobile     Expo receipt capture app         (§52/§53)
packages/contracts   Zod schemas · enums · events · decimal money (shared by all apps)
packages/database    Knex migrations · seeds · row types
packages/config      shared tsconfig / eslint / prettier
infrastructure/docker  docker-compose for local dev
docs/           architecture · api · accounting · sandbox-testing · DEVIATIONS.md
```

## Deviations from the spec

See [docs/DEVIATIONS.md](docs/DEVIATIONS.md). SKR account numbers are seeded but **require Steuerberater confirmation** — see [docs/accounting/skr-mappings.md](docs/accounting/skr-mappings.md).
