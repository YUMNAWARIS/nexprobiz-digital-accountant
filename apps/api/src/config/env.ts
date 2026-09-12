import 'dotenv/config';
import { z } from 'zod';

const Env = z.object({
  NODE_ENV: z.enum(['development', 'test', 'sandbox', 'production']).default('development'),
  PORT: z.coerce.number().int().default(8000),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  WEB_ORIGIN: z.string().default('http://localhost:3000'),
  GIT_SHA: z.string().default('dev'),

  DATABASE_URL: z.string().url(),

  JWT_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),

  STORAGE_DRIVER: z.enum(['s3', 'local']).default('s3'),
  STORAGE_LOCAL_DIR: z.string().default('./storage'),
  S3_ENDPOINT: z.string().optional(),
  S3_REGION: z.string().default('us-east-1'),
  S3_BUCKET: z.string().default('documents'),
  S3_ACCESS_KEY_ID: z.string().optional(),
  S3_SECRET_ACCESS_KEY: z.string().optional(),
  S3_FORCE_PATH_STYLE: z.coerce.boolean().default(true),

  QUEUE_DRIVER: z.enum(['bullmq', 'inmemory']).default('bullmq'),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  QUEUE_RECEIPT_OCR: z.string().default('receipt-ocr'),

  FEEDBACK_URL: z.string().default('mailto:feedback@example.com'),
});
export type Env = z.infer<typeof Env>;

export function loadEnv(overrides: Partial<Record<keyof Env, string>> = {}): Env {
  const r = Env.safeParse({ ...process.env, ...overrides });
  if (!r.success) {
    const issues = r.error.issues.map((i) => `  ${i.path.join('.')}: ${i.message}`).join('\n');
    throw new Error(`Invalid environment:\n${issues}`);
  }
  return r.data;
}
