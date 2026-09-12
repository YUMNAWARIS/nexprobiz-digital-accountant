import { reqId } from './http/types';
import cors from 'cors';
import express, { type Express, type Router } from 'express';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';
import type { Logger } from 'pino';
import swaggerUi from 'swagger-ui-express';
import type { Env } from './config/env';
import { errorHandler, notFoundHandler } from './http/middleware/error-handler';
import { requestId } from './http/middleware/request-id';
import { buildOpenApiDocument } from './http/openapi';

export interface AppParts {
  env: Env;
  logger: Logger;
  healthRouter: Router;
  apiRouters: Router[];
}

export const API_BASE = '/api/v1';

export function createApp(parts: AppParts): Express {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  app.use(requestId);
  app.use(
    pinoHttp({
      logger: parts.logger,
      genReqId: (req) => reqId(req),
      customProps: (req) => ({
        userId: req.auth?.userId ?? null,
        tenantId: req.auth?.tenantId ?? null,
      }),
      customLogLevel: (_req, res, err) =>
        err || res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info',
      autoLogging: { ignore: (req) => req.url === '/health' },
    }),
  );
  app.use(helmet());
  app.use(
    cors({
      origin: parts.env.WEB_ORIGIN.split(',').map((s) => s.trim()),
      credentials: false,
      exposedHeaders: ['x-request-id', 'content-disposition'],
    }),
  );
  app.use(express.json({ limit: '1mb' }));

  app.use(parts.healthRouter);
  for (const r of parts.apiRouters) app.use(API_BASE, r);

  if (parts.env.NODE_ENV !== 'production') {
    const doc = buildOpenApiDocument(parts.env.GIT_SHA);
    app.get('/api/docs.json', (_req, res) => res.json(doc));
    app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(doc));
  }

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
