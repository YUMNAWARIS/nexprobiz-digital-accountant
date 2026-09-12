/** BullMQ consumer entry. Run via apps/worker (`pnpm dev:worker`). */
import { RECEIPT_OCR_QUEUE } from '@fa/contracts';
import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import { loadEnv } from '@/config/env';
import { createContainer, createInfra } from '@/composition-root';
import { createLogger } from '@/infra/logger';
import { createReceiptOcrHandler, MAX_ATTEMPTS } from './functions/receipt-ocr.function';
import { TesseractOcr } from './services/tesseract-ocr.service';

function main() {
  const env = loadEnv();
  const logger = createLogger({
    level: env.LOG_LEVEL,
    pretty: env.NODE_ENV === 'development',
    name: 'worker',
  });
  const infra = createInfra(env, logger);
  const container = createContainer(infra);
  const ocr = new TesseractOcr({ cachePath: process.env.TESSERACT_CACHE ?? './.tesseract-cache' });
  const handle = createReceiptOcrHandler({
    uow: infra.uow,
    receipts: container.services.receipts,
    storage: infra.storage,
    documents: container.services.documents,
    ocr,
    logger,
  });

  const connection = new IORedis(env.REDIS_URL, { maxRetriesPerRequest: null });
  const worker = new Worker(
    RECEIPT_OCR_QUEUE,
    async (job) => handle(job.data, job.attemptsMade + 1),
    { connection, concurrency: 2 },
  );
  worker.on('ready', () =>
    logger.info({ queue: RECEIPT_OCR_QUEUE, maxAttempts: MAX_ATTEMPTS }, 'worker listening'),
  );
  worker.on('failed', (job, err) =>
    logger.warn({ jobId: job?.id, attempt: job?.attemptsMade, err: err.message }, 'job failed'),
  );

  const shutdown = async () => {
    logger.info('worker shutting down');
    await worker.close();
    await ocr.close();
    await connection.quit();
    await container.shutdown();
    process.exit(0);
  };
  process.on('SIGTERM', () => void shutdown());
  process.on('SIGINT', () => void shutdown());
}

main();
