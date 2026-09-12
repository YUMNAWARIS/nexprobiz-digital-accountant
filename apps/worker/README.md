# @fa/worker — receipt OCR consumer

Deployable unit for the BullMQ `receipt-ocr` queue (spec §37/§38). The implementation lives in the
modular monolith (`apps/api/src/worker/`) so the worker reuses `ReceiptsService`, `DocumentsService`,
the `UnitOfWork` and RLS exactly as the API does (ARCH-001: one modular monolith, two processes).

```
apps/api/src/worker/
  main.ts                                  BullMQ Worker bootstrap
  functions/receipt-ocr.function.ts        §38 algorithm, retry ≤ 3 then FAILED
  services/tesseract-ocr.service.ts        OcrPort adapter (Tesseract.js deu+eng) + StubOcr for tests
  services/german-receipt.parser.ts        deterministic merchant/date/net/tax/total extraction
```

Run: `pnpm dev:worker` (needs Redis + the API's `.env`). First run downloads Tesseract language data into `apps/api/.tesseract-cache`.
