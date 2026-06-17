import { env } from './configs/env.config';
import { databaseManager } from './configs/database.config';
import { createLogger } from './utils/logger.utils';
import app from './app';
import http from 'http';

const logger = createLogger('auto-majid-server');

const PORT = process.env.PORT

async function startServer() {
  try{
    logger.info("Starting AutoMajid Server");

    logger.info("Connecting to database...");
    await databaseManager.connect();

   

    // Create raw HTTP Server
    const httpServer = http.createServer(app);


    logger.info("Starting Express server...");
    httpServer.listen(PORT, () => {
      logger.info(`Auto-Majid Server running on ${PORT}`, {
        port: PORT,
        timeStamp: new Date().toISOString()
      });
    });

    

  } catch (error: any) {
    logger.error("Falied to start server", {
      error: error.message,
      stack: error.stack,
    });
    process.exit(1);
  }
}

async function gracefulShutdown(signal: string) {
  logger.info(`Received ${signal}, starting graceful shutdown...`);
  try {
    
    logger.info("Closing database connection...");
    await databaseManager.disconnect();
    logger.info("Shutdown complete, exiting process.");
    process.exit(0);
  } catch (error: any) {
    logger.error('Error during graceful shutdown', {error: error.message, stack: error.stack});
    process.exit(1);
  }
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', {error: error.message, stack: error.stack});
  process.exit(1);
})


startServer();