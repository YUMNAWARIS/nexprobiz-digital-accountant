/**
 * SKR system accounts by chart. These are not categories, so they are not in
 * chart_account_mappings. REQUIRES_STEUERBERATER_CONFIRMATION — see docs/accounting/skr-mappings.md
 */
import type { ChartOfAccounts } from '@fa/contracts';

export interface SystemAccounts {
  ACCOUNTS_RECEIVABLE: string;
  BANK: string;
  OUTPUT_VAT_19: string;
  OUTPUT_VAT_7: string;
  INPUT_VAT_19: string;
  INPUT_VAT_7: string;
  REVENUE_7: string;
  REVENUE_EXEMPT: string;
}

export const SYSTEM_ACCOUNTS: Record<ChartOfAccounts, SystemAccounts> = {
  SKR03: {
    ACCOUNTS_RECEIVABLE: '1400',
    BANK: '1200',
    OUTPUT_VAT_19: '1776',
    OUTPUT_VAT_7: '1771',
    INPUT_VAT_19: '1576',
    INPUT_VAT_7: '1571',
    REVENUE_7: '8300',
    REVENUE_EXEMPT: '8200',
  },
  SKR04: {
    ACCOUNTS_RECEIVABLE: '1200',
    BANK: '1800',
    OUTPUT_VAT_19: '3806',
    OUTPUT_VAT_7: '3801',
    INPUT_VAT_19: '1406',
    INPUT_VAT_7: '1401',
    REVENUE_7: '4300',
    REVENUE_EXEMPT: '4200',
  },
};
