/**
 * Deterministic German receipt parser over raw OCR text (no AI — §3 forbids AI categorization,
 * and §38 only needs merchant / date / net / tax / total + confidence).
 * Pure function. Returns null for anything it cannot find; the human review step (§16) fills gaps.
 */
export interface OcrWord {
  text: string;
  confidence: number; // 0..100
}
export interface ParsedReceipt {
  merchant: string | null;
  receiptNumber: string | null;
  receiptDate: string | null; // YYYY-MM-DD
  netAmount: string | null;
  taxAmount: string | null;
  grossAmount: string | null;
  /** 0.0000 – 1.0000 */
  confidence: string;
  matched: { total?: string; tax?: string; net?: string; date?: string };
}

const AMOUNT = /(-?\d{1,3}(?:[.\s]\d{3})*(?:,\d{2})|-?\d+[.,]\d{2})\s*(?:€|EUR)?/gi;
const TOTAL_KEYS =
  /\b(summe|gesamt(?:betrag|summe)?|total|zu zahlen|betrag|endbetrag|brutto|rechnungsbetrag|zahlbetrag|bar|ec[- ]?karte|kartenzahlung)\b/i;
const TAX_KEYS = /\b(mwst|m\.w\.st|ust|umsatzsteuer|mehrwertsteuer|vat|tax)\b/i;
const NET_KEYS = /\b(netto|net|nettobetrag)\b/i;
const NOISE_LINE =
  /^(kassenbon|bon|rechnung|quittung|beleg|kunden(?:beleg|kopie)|tel\.?|telefon|www\.|http|uid|ust-?id|steuer-?nr)/i;

function toMoney(raw: string): string | null {
  let s = raw.replace(/[€\sEUR]/gi, '');
  if (/,\d{2}$/.test(s))
    s = s.replace(/\./g, '').replace(',', '.'); // 1.234,56 → 1234.56
  else if (/\.\d{2}$/.test(s)) s = s.replace(/,/g, ''); // 1,234.56 → 1234.56
  const n = Number(s);
  if (!Number.isFinite(n)) return null;
  return n.toFixed(2);
}

export function parseGermanDate(text: string): string | null {
  const m1 = text.match(/\b(\d{1,2})\.(\d{1,2})\.(\d{2}|\d{4})\b/);
  if (m1) {
    const [, d, m, y] = m1;
    const yyyy = y!.length === 2 ? `20${y}` : y!;
    const dd = d!.padStart(2, '0');
    const mm = m!.padStart(2, '0');
    if (Number(mm) >= 1 && Number(mm) <= 12 && Number(dd) >= 1 && Number(dd) <= 31)
      return `${yyyy}-${mm}-${dd}`;
  }
  const m2 = text.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
  if (m2) return `${m2[1]}-${m2[2]}-${m2[3]}`;
  return null;
}

const DATE_TOKENS =
  /\b\d{1,2}\.\d{1,2}\.(?:\d{2}|\d{4})\b|\b\d{4}-\d{2}-\d{2}\b|\b\d{1,2}:\d{2}(?::\d{2})?\b/g;
function amountsIn(line: string): string[] {
  const cleaned = line.replace(DATE_TOKENS, ' ');
  return [...cleaned.matchAll(AMOUNT)]
    .map((m) => toMoney(m[1]!))
    .filter((x): x is string => x !== null);
}
/** First amount that appears AFTER the keyword on the line (e.g. "Netto 21,77 MwSt 4,13"). */
function amountAfter(line: string, keyword: RegExp): string | null {
  const m = line.match(keyword);
  if (!m || m.index === undefined) return null;
  const tail = line
    .slice(m.index + m[0].length)
    .replace(/^\s*[A-Z]?\s*\d{1,2}(?:[.,]\d+)?\s*%/, ''); // skip "19,00%"
  return amountsIn(tail)[0] ?? null;
}
const last = <T>(a: T[]): T | undefined => a[a.length - 1];
const cmp = (a: string, b: string) => Number(a) - Number(b);

export function parseGermanReceipt(text: string, words: OcrWord[] = []): ParsedReceipt {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const matched: ParsedReceipt['matched'] = {};

  // merchant: first line that is not noise and not mostly digits
  const merchant =
    lines.find(
      (l) =>
        l.length >= 3 &&
        !NOISE_LINE.test(l) &&
        l.replace(/[^A-Za-zÄÖÜäöüß]/g, '').length >= 3 &&
        !/^\d/.test(l),
    ) ?? null;

  // date: first line with a date
  let receiptDate: string | null = null;
  for (const l of lines) {
    const d = parseGermanDate(l);
    if (d) {
      receiptDate = d;
      matched.date = l;
      break;
    }
  }

  // receipt number
  const rn = lines
    .map((l) =>
      l.match(
        /\b(?:bon(?:-?nr)?|beleg(?:-?nr)?|rechnungs?-?nr|nr\.?|no\.?)[:\s#]*([A-Z0-9][A-Z0-9-/]{2,})/i,
      ),
    )
    .find(Boolean);
  const receiptNumber = rn?.[1] ?? null;

  // total: last keyword line with an amount; else the largest amount on the receipt
  let grossAmount: string | null = null;
  for (const l of lines) {
    if (TOTAL_KEYS.test(l) && !TAX_KEYS.test(l) && !NET_KEYS.test(l)) {
      const a = last(amountsIn(l));
      if (a && Number(a) > 0) {
        grossAmount = a;
        matched.total = l;
      }
    }
  }
  if (!grossAmount) {
    const all = lines
      .flatMap(amountsIn)
      .filter((a) => Number(a) > 0)
      .sort(cmp);
    grossAmount = last(all) ?? null;
    if (grossAmount) matched.total = '(largest amount)';
  }

  // tax: lines mentioning MwSt/USt — sum of the amounts (multi-rate receipts list several)
  const taxLines = lines.filter(
    (l) => TAX_KEYS.test(l) && !/id|nr/i.test(l.replace(/mwst|ust/gi, '')),
  );
  let taxAmount: string | null = null;
  const taxParts: string[] = [];
  for (const l of taxLines) {
    // "MwSt 19% 4,13" or "A 19,00% 21,77 4,13 25,90" → take the amount that is < total and smallest plausible
    const amts = amountsIn(l).filter(
      (a) => Number(a) > 0 && (!grossAmount || Number(a) < Number(grossAmount)),
    );
    const pctMatch = l.match(/(\d{1,2}(?:[.,]\d+)?)\s*%/);
    if (amts.length) {
      // prefer the amount right after the MwSt keyword; else the one consistent with the percentage against the gross
      const after = amountAfter(l, TAX_KEYS);
      let pick = after && amts.includes(after) ? after : amts[0]!;
      if (pctMatch && grossAmount) {
        const pct = Number(pctMatch[1]!.replace(',', '.')) / 100;
        const expected = Number(grossAmount) - Number(grossAmount) / (1 + pct);
        pick = amts.reduce(
          (best, a) =>
            Math.abs(Number(a) - expected) < Math.abs(Number(best) - expected) ? a : best,
          pick,
        );
      }
      taxParts.push(pick);
      matched.tax = l;
    }
  }
  if (taxParts.length) taxAmount = taxParts.reduce((s, a) => s + Number(a), 0).toFixed(2);

  // net
  let netAmount: string | null = null;
  for (const l of lines) {
    if (NET_KEYS.test(l)) {
      const a = amountAfter(l, NET_KEYS) ?? last(amountsIn(l));
      if (a) {
        netAmount = a;
        matched.net = l;
      }
    }
  }
  if (!netAmount && grossAmount && taxAmount)
    netAmount = (Number(grossAmount) - Number(taxAmount)).toFixed(2);

  // confidence: mean word confidence, weighted down for each missing field
  const meanWord = words.length
    ? words.reduce((s, w) => s + w.confidence, 0) / words.length / 100
    : 0.5;
  const found = [merchant, receiptDate, grossAmount, taxAmount].filter(Boolean).length;
  const confidence = Math.max(0, Math.min(1, meanWord * (0.4 + 0.15 * found))).toFixed(4);

  return {
    merchant,
    receiptNumber,
    receiptDate,
    netAmount,
    taxAmount,
    grossAmount,
    confidence,
    matched,
  };
}
