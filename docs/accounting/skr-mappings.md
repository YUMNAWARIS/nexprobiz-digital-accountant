# SKR03 / SKR04 account mappings — REQUIRES STEUERBERATER CONFIRMATION

The specification mandates seeding both charts for FY2026 (§11.19, §54) but supplies no account numbers. The values below are the conventional accounts and are seeded by `packages/database/seeds/02_chart_account_mappings.ts`. **They must be confirmed by a Steuerberater before the client review.** Per §4, the sandbox does not guess tax treatment.

## Category mappings (`chart_account_mappings`, one account per category per chart)

| Category               | SKR03 | SKR04 | EÜR line |
| ---------------------- | ----- | ----- | -------- |
| REVENUE_SERVICES       | 8400  | 4400  | 14       |
| OFFICE_SUPPLIES        | 4930  | 6815  | 55       |
| SOFTWARE               | 4980  | 6837  | 55       |
| TRAVEL                 | 4670  | 6650  | 47       |
| TELEPHONE_INTERNET     | 4920  | 6805  | 55       |
| BANK_FEES              | 4970  | 6855  | 55       |
| PROFESSIONAL_SERVICES  | 4950  | 6825  | 55       |
| MARKETING              | 4610  | 6600  | 55       |
| OTHER_BUSINESS_EXPENSE | 4900  | 6300  | 55       |

## System accounts (code constant in `apps/api/src/modules/accounting/domain/system-accounts.ts`)

Not categories, so not in `chart_account_mappings`; keyed by chart.

| Role                                  | SKR03       | SKR04       |
| ------------------------------------- | ----------- | ----------- |
| Accounts receivable (Forderungen aLL) | 1400        | 1200        |
| Bank                                  | 1200        | 1800        |
| Output VAT 19 % / 7 %                 | 1776 / 1771 | 3806 / 3801 |
| Input VAT 19 % / 7 %                  | 1576 / 1571 | 1406 / 1401 |
| Revenue 7 %                           | 8300        | 4300        |
| Revenue §19 (tax-free)                | 8200        | 4200        |

## Posting rules (§13) as implemented

- Regular invoice: AR DR gross · Revenue CR net · Output VAT CR tax
- Kleinunternehmer invoice: AR DR net · Revenue(§19) CR net
- Payment: Bank DR · AR CR
- Regular expense: Expense DR net · Input VAT DR tax · Bank CR gross
- Kleinunternehmer expense: Expense DR gross · Bank CR gross (input VAT not recoverable)
