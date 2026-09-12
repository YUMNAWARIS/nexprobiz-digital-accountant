import { createApp } from './app';
import { loadEnv } from './config/env';
import { createContainer, createInfra } from './composition-root';
import { createLogger } from './infra/logger';

function main() {
  const env = loadEnv();
  const logger = createLogger({
    level: env.LOG_LEVEL,
    pretty: env.NODE_ENV === 'development',
  });
  const container = createContainer(createInfra(env, logger));
  const app = createApp({
    env,
    logger,
    healthRouter: container.healthRouter,
    apiRouters: container.apiRouters,
  });

  const server = app.listen(env.PORT, () =>
    logger.info({ port: env.PORT, env: env.NODE_ENV }, 'api listening'),
  );

  const shutdown = (signal: string) => {
    logger.info({ signal }, 'shutting down');
    server.close(() => {
      container
        .shutdown()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
    });
    setTimeout(() => process.exit(1), 30_000).unref();
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('unhandledRejection', (err) => {
    logger.fatal({ err }, 'unhandledRejection');
    process.exit(1);
  });
}

try {
  main();
} catch (err: unknown) {
  console.error(err);
  process.exit(1);
}
