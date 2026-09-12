# Epic 18 — UI language toggle (German / English)

Client-requested addition (not in the spec's §2 list; the spec anticipates it only in data via
`account_categories.name_de / name_en`). Treated as a normal epic with the §60 definition of done.

## Story 18.1 — Toggle and persistence

**As a** sandbox reviewer **I want** to switch the web app between German and English **so that**
non-German-speaking reviewers can evaluate the workflow.

Acceptance:

- Default language for a new visitor is **German**.
- A `DE | EN` toggle in the app bar switches the language instantly on every page, without changing
  the URL (§50 routes are unchanged — no `/en/...` prefix).
- The choice persists across reloads and sessions (cookie `fa_locale`, 1 year, `SameSite=Lax`).
- `<html lang>` reflects the active language (accessibility / screen readers).
- An unknown cookie value falls back to German.

## Story 18.2 — Everything the user reads is translated

- All navigation, page titles, table headers, form labels, helper texts, buttons, dialogs, alerts
  and empty states (~330 strings) come from `apps/web/messages/{de,en}.json`.
- Status/classification chips and enum menus (invoice/expense/receipt/bank/export statuses, tax
  treatments, payment methods, business types, VAT regimes) are translated.
- Account category names use the API's `nameDe` / `nameEn`.
- Audit event types are shown as readable labels in both languages.
- Dates, times and money follow the language: `12.09.2026 · 1.234,56 €` (DE) vs
  `12 Sept 2026 · €1,234.56` (EN). Amounts remain strings from the API — formatting only (ARCH-004).
- Form validation messages are localized (zod defaults via a per-locale error map; custom
  contract messages via a lookup table).
- §18 API error messages are shown in German when the UI is German (mapped by `code`, all 47 codes);
  in English the server message is displayed as-is. The error code is always appended.
- Sandbox banner and the §63 disclaimers (reports, VAT preview, DATEV) exist in both languages.

## Explicitly unchanged

- Invoice PDF, XRechnung XML and the DATEV file stay **German** — they are regulatory documents for
  German recipients and are independent of the UI language.
- The API (`/api/v1`) is language-neutral: it returns codes, enum values and English §18 messages.

## Implementation

| Piece                                              | Location                                                                                                                                                                                                      |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Locale config (cookie name, locales, Intl tags)    | `apps/web/src/i18n/config.ts`                                                                                                                                                                                 |
| Server request config (cookie → locale → messages) | `apps/web/src/i18n/request.ts` (registered in `next.config.ts` via `createNextIntlPlugin`)                                                                                                                    |
| Provider + `<html lang>`                           | `apps/web/src/app/layout.tsx` (`NextIntlClientProvider`)                                                                                                                                                      |
| Toggle                                             | `apps/web/src/components/layout/LanguageToggle.tsx` (sets cookie, `router.refresh()`)                                                                                                                         |
| Messages                                           | `apps/web/messages/de.json`, `en.json` — namespaces: `common, nav, sandbox, auth, status, enums, profile, clients, invoices, expenses, receipts, dashboard, reports, audit, banking, datev, errors` (DE only) |
| Locale-aware formatting                            | `apps/web/src/lib/format.ts` → `useFormat()` returning `{ eur, pct, date, dateTime }`                                                                                                                         |
| Validation messages                                | `apps/web/src/i18n/validation.ts` (`zodErrorMap`, `translateValidation`), `useZodResolver()`                                                                                                                  |
| Status labels / API errors                         | `StatusChip.useStatusLabel()`, `ErrorAlert.useErrorMessage()`                                                                                                                                                 |
| Category names                                     | `features/expenses/hooks.ts::useCategoryName()`                                                                                                                                                               |

Library: `next-intl` 4 (App Router, "without i18n routing" mode).

## Adding a string

1. Add the key to **both** `messages/de.json` and `messages/en.json` under the feature namespace.
2. In the component: `const t = useTranslations('<namespace>')` → `t('key')` / `t('key', { var })`.
3. Never format money/dates by hand — use `useFormat()`.
