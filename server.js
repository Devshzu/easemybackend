import app from './src/app.js';
import { config } from './src/config/env.config.js';
import { logger } from './src/config/logger.js';
import { connectDB, disconnectDB } from './src/config/db.js';
import { startBlogScheduler } from './src/modules/blog/blog.scheduler.js';
import { startSitemapScheduler } from './src/modules/sitemap/sitemap.scheduler.js';

// Connect to Database
connectDB();
startBlogScheduler();
startSitemapScheduler();

const server = app.listen(config.port, () => {
  logger.info(`🚀 EaseMyWeb Backend Server running in [${config.nodeEnv}] mode on port ${config.port}`);
  logger.info(`👉 Health Check: http://localhost:${config.port}/health`);
  logger.info(`👉 API v1 Base: http://localhost:${config.port}/api/v1`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('UNHANDLED REJECTION! 💥 Shutting down...', err);
  server.close(async () => {
    await disconnectDB();
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('UNCAUGHT EXCEPTION! 💥 Shutting down...', err);
  process.exit(1);
});

// Handle termination signals
process.on('SIGTERM', async () => {
  logger.info('👋 SIGTERM received. Shutting down gracefully...');
  await disconnectDB();
  server.close(() => {
    logger.info('💥 Process terminated!');
  });
});
