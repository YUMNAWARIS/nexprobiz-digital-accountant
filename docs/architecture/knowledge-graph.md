# Knowledge Graph — Freelancer Accounting Sandbox

Purpose: a compact, machine-friendly map of the codebase so new work can be produced without
re-reading the tree. Nodes are `[Package] · [Module] · [Port] · [Table] · [Route] · [Convention]`.
Edges are `→ depends on`, `⇒ emits`, `⊂ owns`. Keep this file in sync when adding a module.

Source of truth for behaviour: spec PDF + `docs/DEVIATIONS.md`. Plan: `~/.claude/plans/attached-document-is-the-toasty-pony.md`.

---

## 0. Commands (always `export PATH=$HOME/.local/bin:$PATH` first)

| Goal      | Command                                                                                                                                              |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Stack     | `pnpm docker:up` (postgres 5432 · redis 6379 · minio 9000/9001)                                                                                      |
| DB        | `pnpm db:migrate && pnpm db:seed` · `pnpm db:reset` · `SEED_DEMO=true pnpm db:seed`                                                                  |
| Dev       | `pnpm --filter "./packages/*" build` then `pnpm dev:api` / `dev:web` / `dev:worker`                                                                  |
| Gate      | `pnpm format; pnpm -r lint; pnpm -r typecheck; pnpm arch; pnpm -r test`                                                                              |
| API only  | `cd apps/api; pnpm test:unit` · `pnpm test:integration` (needs docker PG; recreates `fa_test`) · `pnpm test:integration -- test/x.test.ts -t "name"` |
| Web build | `pnpm --filter @fa/web build` (22 routes)                                                                                                            |
| OpenAPI   | Swagger at `http://localhost:8000/api/docs` (non-prod)                                                                                               |

Gotchas: `pnpm format` reflows files → re-grep before exact-string edits · Prettier config = single quotes, width 100 · knex CLI = `tsx node_modules/knex/bin/cli.js` · `middleware.ts` lives in `apps/web/src/` · pages using `useSearchParams` need `<Suspense>`.

---

## 1. Packages

```
@fa/config     tsconfig.base/node/react · eslint.base.mjs (ignores, guardrails) · prettier.config.mjs
@fa/contracts  src/money.ts · enums.ts · errors.ts · events.ts · schemas/{common,auth,business-profile,
               clients,invoices,payments,receipts,expenses,banking,reconciliation,reports,datev,audit,health}.ts
@fa/database   knexfile.ts · migrations/001..017 · seeds/01..04 · src/index.ts (createDb, TENANT_TABLES,
               ALL_TABLES, assertNumericIsString) · src/types.ts (row types, 26 tables)
@fa/api        Express 5 · src/{config,core,http,infra,modules,worker} · test/ (integration)
@fa/worker     thin runner → apps/api/src/worker/main.ts
@fa/web        Next 15 App Router · src/{app,components,features,lib,providers}
```

Dependency direction: `web → contracts` · `api → contracts, database` · `worker → api` · nothing imports `api` internals.

---

## 2. Core primitives (`apps/api/src/core`)

| Node                                | Shape                                                                                                        | Rule                                                                                                                  |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------- |
| `RequestCtx`                        | `{tenantId, actor, requestId, now, logger}`                                                                  | built by `http/context.ts::reqCtx(req)` from JWT only                                                                 |
| `TxCtx`                             | `RequestCtx & {trx, onCommit(fn), __brand}`                                                                  | **only** `createUnitOfWork` makes one; `uow.write(ctx, tx => …)` / `uow.read(ctx, tx => …)` set `app.tenant_id` → RLS |
| `systemCtx()`                       | tenant-scoped ctx for worker/outbox                                                                          | used by worker + outbox reclaimer                                                                                     |
| `TenantScopedRepository<Row>`       | `#db` private · `q(ctx)`, `qLocked(tx)`, `insertOne`, `requireById` (→404), `requireByIdForUpdate`, `update` | every repo extends it; no raw knex outside `internal/*.repository.ts`                                                 |
| `AppError(code, message, details?)` | maps via `ERROR_CODES` → `{status, code, message, details?, requestId}`                                      | throw subclasses; never `res.status(4xx)` manually                                                                    |
| `Clock`, `IdGenerator`              | injectable                                                                                                   | tests deterministic                                                                                                   |
| `ports/`                            | `DocumentStoragePort`, `QueuePort`, `OcrPort`, `EInvoiceGenerator`, `InvoicePdfGenerator`                    | impls in `infra/` (local/s3 storage, inmemory/bullmq queue)                                                           |

Money: `Money`/`Rate`/`Qty` branded strings from `@fa/contracts` · `toDecimal/fromDecimal` only in `domain/` · `add/sub/mulQty/applyRate/allocate/eq/abs/isZero…` · ESLint bans `parseFloat`, `Math.round`, `Number.parseFloat`; VAT literals banned in invoicing/expenses/payments.

---

## 3. Module graph (`apps/api/src/modules`)

Factory signature: `createXModule(deps) → { name, service, router? }`. Deps are **service interfaces** from other modules' `index.ts` barrels only. `common = { db, clock, ids, routeDeps }`.

```
Tier 0  audit(common)                     outbox({db, ids, logger})
Tier 1  users({db})   tenants({db})   auth({db, users, tenants, clock, secrets, routeDeps})
Tier 2  tax-rules({db})   business-profile(common, audit, outbox)   clients(common)
        accounting(common)   documents({db, storage})
Tier 3  invoicing(common, logger, clients, profile, taxRules, accounting, audit, outbox, documents?)  [afterFinalize late-bound]
        payments(common, invoicing, profile, accounting, audit, outbox)
        receipts(common, documents, queue, outbox)
        expenses(common, receipts, accounting, profile, taxRules, audit, outbox)
        banking(common, audit, outbox)
        reconciliation(common, banking, payments, expenses, audit, outbox)
        datev(common, accounting, profile, documents, audit, outbox)
Tier 4  reporting(common, profile, accounting)   health({db, storage, version})
routed = [auth, profile, clients, accounting, invoicing, payments, receipts, expenses,
          banking, reconciliation, datev, reporting, audit]   → app.use('/api/v1', …)
```

Per-module ownership:

| Module           | ⊂ Tables                                                                   | Public service (key methods)                                                                                                                                    | ⇒ Audit / Events                                                                 |
| ---------------- | -------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| auth             | users, sessions, tenants, tenant_memberships (via users/tenants)           | register, login, refresh, logout, me                                                                                                                            | —                                                                                |
| business-profile | business_profile_versions                                                  | `requireCurrent(ctx)`, get, put (new version)                                                                                                                   | BUSINESS_PROFILE_CHANGED / BusinessProfileChanged                                |
| tax-rules        | tax_rule_sets, tax_rule_values                                             | `rateFor(ctx, taxTreatment, date)`, limits                                                                                                                      | —                                                                                |
| clients          | clients                                                                    | CRUD, archive (DELETE→204), `requireActive`                                                                                                                     | —                                                                                |
| accounting       | account_categories, chart_account_mappings, journal_entries, journal_lines | `postInvoice/postPayment/postExpense/reverseEntry`, `getEntry`, `listCategories`, `resolveAccount(cat, chart, fy)`, `systemAccounts(chart)`, EÜR/VAT aggregates | —                                                                                |
| documents        | documents                                                                  | `store(tx, {type, buffer, mimeType, originalFilename})`, `getBuffer`, `ready()`                                                                                 | —                                                                                |
| invoicing        | invoice_sequences, invoices, invoice_lines                                 | create/update(DRAFT)/finalize/cancel/list/get, `getPdf`, `getXRechnung`, `requireFinalized`                                                                     | INVOICE_FINALIZED, INVOICE_CANCELLED / InvoiceFinalized, InvoiceCancelled        |
| payments         | payments                                                                   | record(tx, invoiceId, body), list, `get(ctx,id)`                                                                                                                | PAYMENT_RECORDED / PaymentRecorded                                               |
| receipts         | receipts, ocr_runs                                                         | upload(202), get, list, confirm, beginOcr/completeOcr/failOcr                                                                                                   | ReceiptUploaded, ReceiptExtracted, ReceiptConfirmed                              |
| expenses         | expenses                                                                   | create/update(DRAFT)/post/reverse/list/`get`                                                                                                                    | EXPENSE_POSTED, EXPENSE_REVERSED / ExpensePosted, ExpenseReversed                |
| banking          | bank_imports, bank_transactions                                            | importCsv, list, get, classify                                                                                                                                  | BANK_TRANSACTION_CLASSIFIED / BankTransactionImported, BankTransactionClassified |
| reconciliation   | reconciliations                                                            | create (rules §28, abs-amount eq)                                                                                                                               | TRANSACTION_RECONCILED / TransactionReconciled                                   |
| datev            | exports                                                                    | `begin` → `generate` → (`fail`), list, get, download                                                                                                            | DATEV_EXPORT_GENERATED / DatevExportGenerated                                    |
| reporting        | — (reads journal)                                                          | dashboard, euer, vat                                                                                                                                            | —                                                                                |
| audit            | audit_events                                                               | `record(tx, {eventType, entityType, entityId, metadata})`, list                                                                                                 | —                                                                                |
| outbox           | outbox_events                                                              | `publish(tx, {eventType, aggregateId, payload})`, start/stop reclaimer                                                                                          | —                                                                                |

Posting shapes (`accounting/domain/posting-rules.ts`) — each entry has **exactly one pivot line** (no `counterAccount`), all other lines point at it. DATEV mapper emits one row per non-pivot line:

```
invoice  AR DR gross (pivot) · Revenue CR net [ctr AR] · OutputVAT CR tax [ctr AR]   (KU: no VAT line)
payment  Bank DR amt (pivot) · AR CR amt [ctr Bank]
expense  Expense DR net [ctr Bank] · InputVAT DR tax [ctr Bank] · Bank CR gross (pivot)  (KU: Expense DR gross)
reversal swap every direction, keep account+amount, reversal_of = original
```

System accounts (`domain/system-accounts.ts`): SKR03 AR 1400 · Bank 1200 · OutVAT 1776/1771 · InVAT 1576/1571; SKR04 AR 1200 · Bank 1800 · OutVAT 3806/3801 · InVAT 1406/1401. Category accounts come from `chart_account_mappings` seeds (REQUIRES_STEUERBERATER_CONFIRMATION).

---

## 4. Routes (all under `/api/v1`, auth required except auth/*, health)

```
auth              POST /auth/register|login|refresh|logout · GET /me
business-profile  GET|PUT /business-profile
clients           POST|GET /clients · GET|PATCH|DELETE /clients/:id
accounting        GET /account-categories
invoicing         POST|GET /invoices · GET|PATCH /invoices/:id · POST /invoices/:id/finalize|cancel · GET /invoices/:id/pdf|xrechnung
payments          POST|GET /invoices/:id/payments
receipts          POST|GET /receipts · GET /receipts/:id · PATCH /receipts/:id/confirm
expenses          POST|GET /expenses · GET|PATCH /expenses/:id · POST /expenses/:id/post|reverse
banking           GET /bank-imports/template · POST /bank-imports (multipart `file`) · GET /bank-transactions[/:id] · PATCH /bank-transactions/:id/classification
reconciliation    POST /reconciliations
datev             POST /exports/datev · GET /exports · GET /exports/:id · GET /exports/:id/download
reporting         GET /dashboard · GET /reports/euer · GET /reports/vat   (?year=)
audit             GET /audit
health            GET /health · GET /health/ready
```

Route definition idiom (`*.routes.ts`):

```ts
const route = defineRoutes(router, '/base', deps);   // deps = { uow, auth? }
route({ method, path, summary, tag, schemas: { body?, query?, params? }, response: { status, schema | contentType } },
      async (req, res) => { res.status(201).json(await uow.write(reqCtx(req), tx => service.x(tx, validatedBody(req, Schema)))); });
```

Registered routes feed `ROUTE_REGISTRY` → OpenAPI. Multi-step flows that must persist intermediate state use multiple `uow.write` calls in the handler (see datev: begin → generate → fail).

---

## 5. Contracts (`@fa/contracts`)

- `body({...})` = preprocess rejecting `tenantId/tenant_id/userId/user_id` + strict object; use for every request body.
- `IsoDate` validates a real calendar date; `Uuid`; `PageQuery {page, pageSize}`; `paginated(Item)` → `{data, meta}`; `DateRangeQuery`; `YearQuery`.
- Query schemas with transforms (e.g. `reconciled: 'true'|'false' → boolean`) — web hooks must type params as `z.input<typeof Schema>`.
- Enums: `INVOICE_STATUS, EXPENSE_STATUS, RECEIPT_STATUS, BANK_CLASSIFICATION, RECONCILIATION_TARGET, EXPORT_STATUS ['PENDING','COMPLETED','FAILED'], EXPORT_TYPE ['DATEV_BOOKINGS'], TAX_TREATMENT ['STANDARD_19','REDUCED_7','KLEINUNTERNEHMER_19'], CHART ['SKR03','SKR04'], VAT_REGIME, …` and `SANDBOX.{HEADER_WARNING, REPORT_DISCLAIMER, VAT_PREVIEW_DISCLAIMER, DATEV_DISCLAIMER, UNSUPPORTED_CASE_MESSAGE}`.
- Error codes: see `errors.ts::ERROR_CODES` (48 codes, each with HTTP status).
- Events (§35, 12): BusinessProfileChanged · InvoiceFinalized · InvoiceCancelled · PaymentRecorded · ReceiptUploaded · ReceiptExtracted · ReceiptConfirmed · ExpensePosted · ExpenseReversed · BankTransactionImported · BankTransactionClassified · TransactionReconciled · DatevExportGenerated. Queue: `RECEIPT_OCR_QUEUE='receipt-ocr'`.

---

## 6. Database (`@fa/database`)

Roles: `fa_owner` (migrations, `DATABASE_ADMIN_URL`) · `fa_runtime` (app, no BYPASSRLS, `DATABASE_URL`). RLS policy on every tenant table: `tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid`.

Triggers: audit_events append-only · journal balance (deferred constraint) · journal immutability · invoice/expense finalized-immutability. Key uniques: `(tenant_id, invoice_number)`, `(tenant_id, external_key)` on bank_transactions, `(bank_transaction_id)` + `(target_type, target_id)` on reconciliations, `(reversal_of)` partial.

Migrations 001–017 (extensions/roles → identity → profile → tax rules → accounting ref → clients → invoicing → payments → documents → receipts → expenses → banking → reconciliation → journal → exports → audit+outbox → RLS). Seeds 01–04 (categories, SKR mappings FY2026, tax rules DE/2026, demo tenant gated by `SEED_DEMO`).

---

## 7. Worker (`apps/api/src/worker`)

`main.ts` → BullMQ Worker on `receipt-ocr` (attempts 3) → `createReceiptOcrHandler({receipts, documents, ocr, logger})`. OCR: `TesseractOcr` (`deu+eng`, `{text, blocks}` → words) or `StubOcr`. Parser: `parseGermanReceipt(text, words)` → merchant/date/net/tax/total/confidence; `amountAfter(line, keyword)`, `parseGermanDate`. Idempotent: CONFIRMED receipts are acked without processing.

---

## 8. Web (`apps/web/src`)

```
lib/        env.ts · session.ts · cookies.ts (fa_access/fa_refresh) · api-client.ts (api<T>, apiDownload, ApiError; single-flight refresh on 401) · format.ts (eur, pct, date, dateTime)
providers/  QueryProvider · ThemeProvider (AppRouterCacheProvider) · createAppTheme
components/ layout/{AppNav (NAV list), SandboxBanner} · ui/{DataTable, PageHeader, ErrorAlert, StatusChip, FormTextField}
features/<name>/{api.ts, hooks.ts, components/*}   for auth, business-profile, clients, invoices, receipts, expenses, banking, datev, reports, audit
app/(auth)/{login,register} · app/(app)/{onboarding,dashboard,audit,settings/business,clients[/new,/[id]],invoices[/new,/[id]],
            receipts[/[id]],expenses[/new,/[id]],banking[/import],reports/{euer,vat},exports/datev}
```

i18n (Epic 18, `docs/stories/EPIC-18-language-toggle.md`): `next-intl` without routing · locale from cookie `fa_locale` (`src/i18n/config.ts`, `src/i18n/request.ts`) · default `de` · messages `messages/{de,en}.json` (namespaces `common, nav, sandbox, auth, status, enums, profile, clients, invoices, expenses, receipts, dashboard, reports, audit, banking, datev`; `errors` DE-only = §18 codes) · `LanguageToggle` in AppNav · `useFormat()` for `eur/pct/date/dateTime` · `useZodResolver(S)` (locale error map) + `translateValidation` in `FormTextField` · `useStatusLabel()` · `useErrorMessage()` · `useCategoryName()` (nameDe/nameEn). Add a string = key in **both** JSON files + `useTranslations('<ns>')`.

Idioms: feature `api.ts` = thin typed wrappers over `api()`; `hooks.ts` = `useQuery` keyed `[feature, 'list', q]` / `[feature, id]` + mutations invalidating `[feature]`, `['dashboard']`, `['reports']`. Forms: `useForm<z.input<S>, unknown, z.output<S>>({ resolver: useZodResolver(S) })` + `FormTextField`. Money display-only via `useFormat().eur`. Files: `apiDownload(path, filename)`; uploads: hidden `<input type=file>` + `formData`.

---

## 9. Tests

- Unit (`src/**/__tests__`): money, schemas (contracts); posting-rules, invoice-totals, bank-csv, german-receipt.parser, architecture (dep-cruiser) (api).
- Integration (`apps/api/test/*.test.ts`, 16 suites, 93 tests): harness `createHarness()` → `{http, adminDb, db, queue, container, truncateAll, close}`; fixtures `registerUser (→ token, userId, tenantId)`, `setupTenant(h, profile?) (→ + profileId, clientId)`, `finalizedInvoice(h, token, clientId)`, `invoice100`, `assertAllJournalsBalanced`, `PROFILE_REGULAR/KLEINUNTERNEHMER`, `CLIENT`.
- Mandatory invariants TEST-ACC-001…010 all covered (001 payments/expenses/invoicing · 002–004 invoicing · 005 expenses · 006–007 invoicing · 008 expenses · 009 every suite · 010 banking).
- Test bodies for bodiless POSTs must `.send({})` (strict body validation).

---

## 10. Adding a feature — checklist

1. Contract: schema in `packages/contracts/src/schemas/<x>.ts` (use `body()`), enums/errors/events if new; `pnpm --filter @fa/contracts build`.
2. DB: migration in `packages/database/migrations` (+ RLS in 017 pattern if new tenant table, add to `TENANT_TABLES`), row type in `src/types.ts`.
3. Module: `internal/<x>.repository.ts` (extends `TenantScopedRepository`) → `domain/` pure fns → `<x>.service.ts` (mutations `(tx: TxCtx, cmd)`, reads `(ctx, q)`; audit + outbox in same tx) → `<x>.routes.ts` via `defineRoutes` → `<x>.module.ts` factory → `index.ts` barrel.
4. Wire in `composition-root.ts` (import, `Services` field, instantiate in tier order, `services` object, `routed` array).
5. Tests: unit for domain, integration file in `apps/api/test/`, include a cross-tenant 404 case.
6. Web: `features/<x>/{api,hooks}.ts` → page under `app/(app)/…` (all strings via `useTranslations`, keys in `messages/de.json` **and** `en.json`) → nav entry in `AppNav` if top-level.
7. Gate: `pnpm format; pnpm -r lint; pnpm -r typecheck; pnpm arch; pnpm -r test; pnpm --filter @fa/web build`.
