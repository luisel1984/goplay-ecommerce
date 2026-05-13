import { app } from './app.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';

const server = app.listen(env.PORT, () => {
  logger.info(`🚀 GoPlayCommerce backend running on http://localhost:${env.PORT}`);
  logger.info(`   Environment: ${env.NODE_ENV}`);
  logger.info(`   Frontend:    ${env.FRONTEND_URL}`);
});

const shutdown = (signal: string) => {
  logger.info(`${signal} received, shutting down…`);
  server.close(() => process.exit(0));
};
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
