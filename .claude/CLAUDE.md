# Freelancer Accounting — Germany Sandbox MVP

Source of truth: the spec PDF ("Freelancer Accounting SaaS Sandbox MVP") + `docs/DEVIATIONS.md`.
Implementation plan: `~/.claude/plans/attached-document-is-the-toasty-pony.md`.
Codebase map (read first): `docs/architecture/knowledge-graph.md`.

## Stack (approved deviations from the spec in docs/DEVIATIONS.md)

- pnpm monorepo: `apps/api` (Express 5 + TS), `apps/web` (Next.js 15), `apps/worker` (BullMQ), `apps/mobile` (Expo),
  `packages/contracts` (Zod/enums/events/money), `packages/database` (Knex migrations+seeds), `packages/config`.
- Postgres 16 (Knex, NOT Prisma) · Redis/BullMQ · MinIO/R2 via S3 SDK · Tesseract.js OCR · Pino logs.

## Commands (pnpm must be on PATH: `export PATH=$HOME/.local/bin:$PATH`)

- Stack: `pnpm docker:up` · DB: `pnpm db:migrate && pnpm db:seed` (`pnpm db:reset` to wipe)
- Dev: `pnpm dev:api` / `pnpm dev:web` / `pnpm dev:worker` (build packages first: `pnpm --filter "./packages/*" build`)
- Checks: `pnpm lint && pnpm typecheck && pnpm arch && pnpm test` — all must pass before finishing (§64.20)

## Hard rules (from spec §8 / §64 — enforced by DB triggers, RLS, TS brands and dependency-cruiser)

- Money is `Money` (branded string) from `@fa/contracts/money`; decimal.js only inside `domain/`. Never `parseFloat`/`Number()` an amount.
- Every mutation = domain write + audit_event + outbox_event in ONE transaction via `uow.write(ctx, tx => ...)`. External effects only in `tx.onCommit`.
- tenant_id comes only from the JWT (`req.auth`). Never from a body. Repositories extend `TenantScopedRepository`.
- Modules import other modules ONLY via their `index.ts` barrel. `internal/` and `domain/` are private. Only AccountingModule writes journal tables. Only DocumentsModule touches storage.
- Finalized invoices / posted expenses / journal lines are never updated. Corrections are reversals.
- No VAT rate literals in invoicing/expenses/payments — rates come from TaxRulesService (ESLint enforced).
- Error responses follow §18 `{status, code, message, details?, requestId}` — throw `AppError` subclasses.
- Build only what the spec lists (§2). Nothing from §3. No placeholder pages.

## Conventions

- Module folder: `index.ts` (barrel) · `*.module.ts` (factory) · `*.contract.ts` · `*.service.ts` · `*.controller.ts` · `*.routes.ts` · `domain/` · `internal/` · `__tests__/`
- Service signatures: mutations `(tx: TxCtx, cmd)`, reads `(ctx: AnyCtx, query)`.
- Routes registered via `defineRoutes()` so `ROUTE_REGISTRY` + OpenAPI stay in sync.
- Tests: unit in `src/**/__tests__/*.test.ts`; integration in `apps/api/test/*.test.ts` using `test/setup/harness.ts` (needs docker Postgres).
- Web UI text: never hard-code — `useTranslations('<ns>')` with keys in `apps/web/messages/de.json` **and** `en.json`; money/dates via `useFormat()` (Epic 18, `docs/stories/EPIC-18-language-toggle.md`).
- Never commit `.env`. Secrets only in env vars.
