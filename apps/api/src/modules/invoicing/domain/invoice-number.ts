/** Story 5.3 — "2026-000001", "2026-000002"; optional business prefix from the profile. */
export function formatInvoiceNumber(prefix: string, year: number, seq: number): string {
  return `${prefix}${year}-${String(seq).padStart(6, '0')}`;
}
