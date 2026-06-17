import { env } from './configs/env.config';
import { databaseManager } from './configs/database.config';
import { logger } from './utils/logger.utils';
import app from './app';

const startServer = async (): Promise<void> => {
  await databaseManager.connect();

  const port = Number(env.PORT);
  app.listen(port, () => {
    logger.info(`Server running in ${env.NODE_ENV} mode on port ${port}`);
  });
};

startServer().catch((err) => {
  logger.error('Failed to start server:', err);
  process.exit(1);
});
