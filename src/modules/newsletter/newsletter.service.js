import { logger } from '../../config/logger.js';

export class NewsletterService {
  static async subscribe(email) {
    logger.info(`Newsletter subscription request for: ${email}`);
    return {
      email,
      subscribed: true,
      timestamp: new Date().toISOString()
    };
  }
}
