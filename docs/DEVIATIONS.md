# Deviations from the specification

Every item below was an explicit decision by the product owner before implementation started. Everything not listed follows the spec literally (schema §11, contracts §19–32, posting rules §13, state machines §14–16, error contract §18, events §35).

| #   | Spec says                                           | We do                                                      | Section                               | Why                                                                                                                                           |
| --- | --------------------------------------------------- | ---------------------------------------------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | React + Vite + React Router                         | **Next.js 15 App Router**                                  | §5.2, §50                             | Owner decision. Next's file routes implement §50 one-to-one.                                                                                  |
| 2   | NestJS                                              | **Express 5 + TypeScript** modular monolith                | §5.4, §9, §64.8                       | Owner decision. Module boundaries (§9) are kept and enforced by dependency-cruiser; DI is a typed composition root. See `docs/architecture/`. |
| 3   | Prisma ORM                                          | **Knex**                                                   | §5.4, §6 (`packages/database/prisma`) | Owner decision. `packages/database` holds Knex migrations/seeds instead of `prisma/`.                                                         |
| 4   | Azure Queue Storage                                 | **BullMQ + Redis**                                         | §5.6, §37                             | Azure excluded. Same message contract (§37), same retry rule (≤3 then FAILED).                                                                |
| 5   | Azure Blob Storage                                  | **S3-compatible: MinIO (local) / Cloudflare R2 (hosted)**  | §5.6, §9.8, ARCH-003                  | Azure excluded. `DocumentStoragePort` unchanged; only the adapter differs.                                                                    |
| 6   | Azure AI Document Intelligence `prebuilt-receipt`   | **Tesseract.js + deterministic German receipt parser**     | §11.13, §38                           | Azure excluded. `ocr_runs.provider = TESSERACT`, `model = deu+eng`. Full raw output stored. Human review step (§16 NEEDS_REVIEW) unchanged.   |
| 7   | Application Insights + Log Analytics                | **Pino structured JSON logs**                              | §44, Story 16.6                       | Azure excluded. §49 fields and redaction rules implemented verbatim.                                                                          |
| 8   | Azure Key Vault, managed identities                 | **Environment variables; `.env` gitignored**               | SEC-006, SEC-007                      | Azure excluded. No secrets in the repository.                                                                                                 |
| 9   | Epic 16 Azure Bicep / App Service / Static Web Apps | **docker-compose for local development; hosting deferred** | §43–47, Epic 16                       | Owner decision: local only for now. `deploy-sandbox.yml` is authored but inactive.                                                            |
| 10  | (implicit) `apps/api/src/main.ts` + `app.module.ts` | `main.ts` + `app.ts` + `composition-root.ts`               | §6                                    | Express has no `@Module`; the composition root is the equivalent.                                                                             |

## Spec gaps resolved (not deviations)

- **SKR03/SKR04 account numbers** are not given in the spec. Seeded with conventional values, flagged `REQUIRES_STEUERBERATER_CONFIRMATION` — see `docs/accounting/skr-mappings.md`.
- **Invoice numbering under concurrency**: `invoice_sequences` row is locked with `SELECT … FOR UPDATE` inside the finalize transaction (§11.7).
- **Child tables without `tenant_id`** (`invoice_lines`, `journal_lines` per §11.9/§11.21): Row-Level Security scopes them through their parent.

## §61 release gate — Azure-specific items marked N/A

Key Vault, Application Insights, Azure sandbox deployed, PostgreSQL backups (managed) → replaced by env vars, Pino, docker-compose, and a deferred hosting decision. All functional and testing items in §61 still apply in full.
