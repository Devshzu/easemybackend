import cron from 'node-cron';
import { config } from '../../config/env.config.js';
import { logger } from '../../config/logger.js';
import { generateAndPublishBlog } from './blog.generator.js';

export function startBlogScheduler() {
  if (!config.blogAutomation.enabled) {
    logger.info('Automated blog publishing is disabled');
    return;
  }
  cron.schedule(config.blogAutomation.cron, async () => {
    try {
      await generateAndPublishBlog();
    } catch (error) {
      logger.error('Automated blog publishing failed', error);
    }
  }, { timezone: process.env.BLOG_AUTOMATION_TIMEZONE || 'Asia/Kolkata' });
  logger.info(`Automated blog publishing enabled with schedule: ${config.blogAutomation.cron}`);
}