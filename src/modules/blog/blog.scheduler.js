import cron from 'node-cron';
import { config } from '../../config/env.config.js';
import { logger } from '../../config/logger.js';
import { generateAndPublishBlog } from './blog.generator.js';
import { enqueueBlogGeneration, startBlogWorker } from './blog.queue.js';

export function startBlogScheduler() {
  if (!config.blogAutomation.enabled) {
    logger.info('⏸️  Automated blog publishing is DISABLED (set BLOG_AUTOMATION_ENABLED=true in .env to enable)');
    return;
  }

  const timezone = process.env.BLOG_AUTOMATION_TIMEZONE || 'Asia/Kolkata';
  const cronSchedule = config.blogAutomation.cron || '0 0,6,12,18 * * *';

  if (!cron.validate(cronSchedule)) {
    logger.error(`❌ Invalid cron expression for blog automation: "${cronSchedule}"`);
    return;
  }

  if (config.blogAutomation.queueEnabled) {
    startBlogWorker();
  }

  cron.schedule(cronSchedule, async () => {
    logger.info(`⏰ Triggering scheduled blog generation run (${new Date().toLocaleString('en-IN', { timeZone: timezone })})`);
    try {
      if (config.blogAutomation.queueEnabled) {
        await enqueueBlogGeneration();
      } else {
        await generateAndPublishBlog();
      }
    } catch (error) {
      logger.error('❌ Scheduled automated blog publishing failed', error);
    }
  }, { timezone });

  logger.info(`✅ Automated blog publishing is ACTIVE with schedule: [${cronSchedule}] (Timezone: ${timezone})${config.blogAutomation.queueEnabled ? ' via BullMQ' : ''}`);

  // Optional: trigger immediate first run on startup so user sees it working without waiting hours
  if (process.env.BLOG_AUTOMATION_RUN_ON_STARTUP === 'true') {
    logger.info('🚀 BLOG_AUTOMATION_RUN_ON_STARTUP is enabled: scheduling initial run in 10s...');
    setTimeout(async () => {
      try {
        logger.info('🚀 Executing initial startup blog generation...');
        await generateAndPublishBlog();
      } catch (startupErr) {
        logger.error('Startup blog generation encountered an error:', startupErr);
      }
    }, 10000);
  }
}