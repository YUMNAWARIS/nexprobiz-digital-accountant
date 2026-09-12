/**
 * OcrPort adapter: Tesseract.js (deu+eng) + the German receipt parser.
 * Replaces Azure Document Intelligence prebuilt-receipt (docs/DEVIATIONS.md #6).
 * Raw Tesseract output is preserved in full in ocr_runs.raw_result (Story 8.3).
 */
import { createWorker, type Worker } from 'tesseract.js';
import type { OcrExtraction, OcrPort } from '@/core/ports';
import { parseGermanReceipt, type OcrWord } from './german-receipt.parser';

export const TESSERACT_PROVIDER = 'TESSERACT';
export const TESSERACT_MODEL = 'deu+eng';

export class TesseractOcr implements OcrPort {
  private worker: Promise<Worker> | null = null;
  constructor(private readonly opts: { cachePath?: string; langPath?: string } = {}) {}

  private get(): Promise<Worker> {
    if (!this.worker)
      this.worker = createWorker(TESSERACT_MODEL, 1, {
        cachePath: this.opts.cachePath ?? './.tesseract-cache',
        langPath: this.opts.langPath,
      });
    return this.worker;
  }

  async extract(buffer: Buffer, mimeType: string): Promise<OcrExtraction> {
    if (mimeType === 'application/pdf') {
      // Tesseract.js reads images only. Sandbox: PDFs are accepted for storage; OCR needs an image.
      throw Object.assign(
        new Error(
          'PDF receipts cannot be OCR-processed in the sandbox; upload a JPEG/PNG photo or review manually.',
        ),
        { code: 'OCR_PDF_UNSUPPORTED', final: true },
      );
    }
    const worker = await this.get();
    // v6: word-level data comes from blocks → paragraphs → lines → words (request via output flags)
    const { data } = await worker.recognize(buffer, {}, { text: true, blocks: true });
    const words: OcrWord[] = (data.blocks ?? []).flatMap((b) =>
      b.paragraphs.flatMap((p) =>
        p.lines.flatMap((l) => l.words.map((w) => ({ text: w.text, confidence: w.confidence }))),
      ),
    );
    const parsed = parseGermanReceipt(data.text, words);
    return {
      provider: TESSERACT_PROVIDER,
      model: TESSERACT_MODEL,
      rawResult: {
        text: data.text,
        confidence: data.confidence,
        words: words.slice(0, 2000),
        parsed,
      },
      merchant: parsed.merchant,
      receiptNumber: parsed.receiptNumber,
      receiptDate: parsed.receiptDate,
      netAmount: parsed.netAmount,
      taxAmount: parsed.taxAmount,
      grossAmount: parsed.grossAmount,
      confidence: parsed.confidence,
    };
  }

  async close(): Promise<void> {
    if (this.worker) await (await this.worker).terminate();
    this.worker = null;
  }
}

/** Deterministic stub for tests and CI (no language data download). */
export class StubOcr implements OcrPort {
  constructor(
    private readonly text = 'REWE Markt GmbH\nBon-Nr: 4711\n06.09.2026\nSumme 25,90\nMwSt 19% 4,13\nNetto 21,77',
  ) {}
  extract(): Promise<OcrExtraction> {
    const parsed = parseGermanReceipt(this.text, [{ text: 'stub', confidence: 94.7 }]);
    return Promise.resolve({
      provider: 'TESSERACT',
      model: 'stub',
      rawResult: { text: this.text, parsed },
      merchant: parsed.merchant,
      receiptNumber: parsed.receiptNumber,
      receiptDate: parsed.receiptDate,
      netAmount: parsed.netAmount,
      taxAmount: parsed.taxAmount,
      grossAmount: parsed.grossAmount,
      confidence: parsed.confidence,
    });
  }
}
