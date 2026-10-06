import cron from 'node-cron';
import { config } from '../../config/env.config.js';
import { logger } from '../../config/logger.js';
import { SocialPublisherService } from '../../services/socialPublisher.service.js';

/**
 * Social Media Post Scheduler
 * Handles automated publishing of scheduled social media posts
 */
class SocialScheduler {
  constructor() {
    this.schedulerTask = null;
    this.isRunning = false;
  }

  /**
   * Start the social media publishing scheduler
   */
  start() {
    if (!config.socialPublishing.enabled) {
      logger.info('Social publishing scheduler is disabled');
      return;
    }

    if (this.schedulerTask) {
      logger.warn('Social publishing scheduler is already running');
      return;
    }

    try {
      logger.info(`Starting social publishing scheduler with cron: ${config.socialPublishing.cron}`);
      
      this.schedulerTask = cron.schedule(config.socialPublishing.cron, async () => {
        if (this.isRunning) {
          logger.warn('Previous social publishing task is still running, skipping this execution');
          return;
        }

        this.isRunning = true;
        try {
          logger.info('Running scheduled social media publishing task');
          const result = await SocialPublisherService.processScheduledPosts();
          logger.info(`Social publishing task completed:`, result);
        } catch (error) {
          logger.error('Social publishing task failed:', error);
        } finally {
          this.isRunning = false;
        }
      }, {
        scheduled: false,
        timezone: 'Asia/Kolkata'
      });

      this.schedulerTask.start();
      logger.info('Social publishing scheduler started successfully');
    } catch (error) {
      logger.error('Failed to start social publishing scheduler:', error);
    }
  }

  /**
   * Stop the social media publishing scheduler
   */
  stop() {
    if (this.schedulerTask) {
      this.schedulerTask.stop();
      this.schedulerTask = null;
      logger.info('Social publishing scheduler stopped');
    }
  }

  /**
   * Get scheduler status
   */
  getStatus() {
    return {
      enabled: config.socialPublishing.enabled,
      running: Boolean(this.schedulerTask),
      processing: this.isRunning,
      cronExpression: config.socialPublishing.cron,
    };
  }

  /**
   * Manually trigger publishing process (for testing)
   */
  async triggerManually() {
    if (this.isRunning) {
      throw new Error('Publishing task is already running');
    }

    this.isRunning = true;
    try {
      logger.info('Manually triggering social media publishing task');
      const result = await SocialPublisherService.processScheduledPosts();
      logger.info('Manual social publishing task completed:', result);
      return result;
    } finally {
      this.isRunning = false;
    }
  }
}

// Create singleton instance
export const socialScheduler = new SocialScheduler();

// Auto-start if enabled
if (config.socialPublishing.enabled) {
  // Start with a small delay to ensure all services are initialized
  setTimeout(() => {
    socialScheduler.start();
  }, 5000);
}