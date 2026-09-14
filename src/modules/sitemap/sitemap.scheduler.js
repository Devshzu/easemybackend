import cron from 'node-cron';
import { logger } from '../../config/logger.js';
import { generateAndWriteSitemap } from './sitemap.generator.js';

export function startSitemapScheduler() {
  const enabled = process.env.SITEMAP_GENERATION_ENABLED === 'true';
  const cronExpression = process.env.SITEMAP_GENERATION_CRON || '0 3 * * *';

  if (!enabled) {
    logger.info('Daily sitemap generation is disabled');
    return;
  }

  cron.schedule(cronExpression, async () => {
    try {
      await generateAndWriteSitemap();
      logger.info('Daily sitemap refresh completed');
    } catch (error) {
      logger.error('Daily sitemap refresh failed', error);
    }
  }, {
    timezone: process.env.SITEMAP_TIMEZONE || 'Asia/Kolkata',
  });

  logger.info(`Daily sitemap generation enabled with schedule: ${cronExpression}`);
}
