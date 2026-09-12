/**
 * §26 Bank CSV Contract — one normalized format, headers exactly:
 *   booking_date,value_date,description,counterparty,amount,currency
 * Pure parser. Malformed rows are reported with their 1-based line number (header = line 1).
 */
import { createHash } from 'node:crypto';
import { BANK_CSV_HEADERS, BankCsvRow, type BankCsvRow as Row } from '@fa/contracts';

export interface ParsedCsv {
  rows: Array<{ line: number; row: Row }>;
  errors: Array<{ line: number; message: string }>;
  rowCount: number;
}

/** RFC-4180-ish line splitter: handles quoted fields with commas and doubled quotes. */
export function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = '';
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]!;
    if (inQ) {
      if (ch === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (ch === '"') inQ = false;
      else cur += ch;
    } else if (ch === '"') inQ = true;
    else if (ch === ',') {
      out.push(cur);
      cur = '';
    } else cur += ch;
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

export function parseBankCsv(text: string): ParsedCsv {
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/);
  const headerLine = lines[0]?.trim() ?? '';
  const header = splitCsvLine(headerLine).map((h) => h.toLowerCase());
  if (header.join(',') !== BANK_CSV_HEADERS.join(',')) {
    return {
      rows: [],
      errors: [{ line: 1, message: `Header must be exactly: ${BANK_CSV_HEADERS.join(',')}` }],
      rowCount: 0,
    };
  }
  const rows: ParsedCsv['rows'] = [];
  const errors: ParsedCsv['errors'] = [];
  let rowCount = 0;
  for (let i = 1; i < lines.length; i++) {
    const raw = lines[i]!;
    if (!raw.trim()) continue;
    rowCount++;
    const line = i + 1;
    const cells = splitCsvLine(raw);
    if (cells.length !== BANK_CSV_HEADERS.length) {
      errors.push({
        line,
        message: `Expected ${BANK_CSV_HEADERS.length} columns, got ${cells.length}.`,
      });
      continue;
    }
    const obj = Object.fromEntries(BANK_CSV_HEADERS.map((h, idx) => [h, cells[idx] ?? '']));
    const r = BankCsvRow.safeParse(obj);
    if (!r.success) {
      errors.push({
        line,
        message: r.error.issues.map((x) => `${x.path.join('.')}: ${x.message}`).join('; '),
      });
      continue;
    }
    rows.push({ line, row: r.data });
  }
  return { rows, errors, rowCount };
}

/** §11.16 — external_key = SHA256(booking_date + amount + currency + description + counterparty) */
export function externalKey(r: Row): string {
  return createHash('sha256')
    .update(`${r.booking_date}|${r.amount}|${r.currency}|${r.description}|${r.counterparty ?? ''}`)
    .digest('hex');
}
