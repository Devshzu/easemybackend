import mongoose from 'mongoose';
import { Subscription } from './subscription.model.js';
import { BlogEmailDelivery } from './blogEmailDelivery.model.js';
import { mailService } from '../../utils/mailService.js';
import { getBlogNotificationEmailHtml } from '../../utils/emailTemplates/blogNotification.template.js';
import { logger } from '../../config/logger.js';

export class BlogEmailNotificationService {
  /**
   * Trigger blog email notification process for a newly published blog
   */
  static async triggerBlogNotification(blog) {
    if (!blog || !blog._id || !blog.published) {
      logger.warn(`Blog notification skipped: blog invalid or not published`);
      return;
    }

    try {
      logger.info(`Starting email notification trigger for published blog: "${blog.title}" (${blog._id})`);

      // 1. Fetch active subscribers
      const activeSubscribers = await Subscription.find({ status: 'ACTIVE' }).lean();
      if (!activeSubscribers || activeSubscribers.length === 0) {
        logger.info(`No active subscribers found for blog notification [Blog ID: ${blog._id}]`);
        return;
      }

      logger.info(`Found ${activeSubscribers.length} active subscribers for blog notification`);

      // 2. Prepare delivery records (using bulk write / ignore duplicates)
      const bulkOps = activeSubscribers.map((sub) => ({
        updateOne: {
          filter: { blogId: blog._id, subscriptionId: sub._id },
          update: {
            $setOnInsert: {
              blogId: blog._id,
              subscriptionId: sub._id,
              email: sub.email,
              status: 'PENDING',
              attempts: 0
            }
          },
          upsert: true
        }
      }));

      await BlogEmailDelivery.bulkWrite(bulkOps, { ordered: false });
      logger.info(`Successfully initialized PENDING delivery records for ${activeSubscribers.length} subscribers`);

      // 3. Process pending deliveries
      await BlogEmailNotificationService.processPendingDeliveries(blog._id, blog);
    } catch (error) {
      logger.error(`Error in triggerBlogNotification: ${error.message}`);
    }
  }

  /**
   * Process pending delivery records in batches
   */
  static async processPendingDeliveries(blogId, blogData = null) {
    try {
      let blog = blogData;
      if (!blog) {
        const { Blog } = await import('../blog/blog.model.js');
        blog = await Blog.findById(blogId).lean();
      }

      if (!blog) {
        logger.error(`Cannot process pending deliveries: Blog not found [ID: ${blogId}]`);
        return;
      }

      const BATCH_SIZE = 50;
      let hasMore = true;
      let totalSent = 0;
      let totalFailed = 0;

      while (hasMore) {
        // Fetch a batch of pending deliveries
        const pendingBatch = await BlogEmailDelivery.find({
          blogId,
          status: 'PENDING'
        })
          .populate('subscriptionId', 'unsubscribeToken status')
          .limit(BATCH_SIZE);

        if (!pendingBatch || pendingBatch.length === 0) {
          hasMore = false;
          break;
        }

        logger.info(`Processing batch of ${pendingBatch.length} pending emails for blog: "${blog.title}"`);

        for (const delivery of pendingBatch) {
          const subscription = delivery.subscriptionId;

          // Skip if subscriber is unsubscribed
          if (subscription && subscription.status === 'UNSUBSCRIBED') {
            delivery.status = 'FAILED';
            delivery.errorMessage = 'Subscriber is unsubscribed';
            delivery.failedAt = new Date();
            await delivery.save();
            totalFailed++;
            continue;
          }

          const unsubscribeToken = subscription?.unsubscribeToken || 'unsub';
          const html = getBlogNotificationEmailHtml({ blog, unsubscribeToken });
          const subject = `[EaseMyWeb] New Article: ${blog.title}`;

          try {
            delivery.attempts += 1;
            await mailService.sendMail({ to: delivery.email, subject, html });

            delivery.status = 'SENT';
            delivery.sentAt = new Date();
            delivery.errorMessage = undefined;
            await delivery.save();

            // Update subscriber lastEmailSentAt
            if (subscription && subscription._id) {
              await Subscription.findByIdAndUpdate(subscription._id, { lastEmailSentAt: new Date() });
            }

            totalSent++;
          } catch (err) {
            delivery.status = 'FAILED';
            delivery.failedAt = new Date();
            delivery.errorMessage = err.message || 'SMTP sending failed';
            await delivery.save();

            totalFailed++;
            logger.warn(`Failed to send blog email to ${delivery.email}: ${err.message}`);
          }
        }
      }

      logger.info(`Blog email dispatch completed for blog "${blog.title}". Sent: ${totalSent}, Failed: ${totalFailed}`);
    } catch (error) {
      logger.error(`Error in processPendingDeliveries: ${error.message}`);
    }
  }

  /**
   * Retry failed delivery records for a specific blog
   */
  static async retryFailedDeliveries(blogId) {
    const failedDeliveries = await BlogEmailDelivery.find({
      blogId,
      status: 'FAILED'
    });

    if (!failedDeliveries || failedDeliveries.length === 0) {
      return { retriedCount: 0, message: 'No failed deliveries found to retry.' };
    }

    // Reset status to PENDING
    await BlogEmailDelivery.updateMany(
      { blogId, status: 'FAILED' },
      { $set: { status: 'PENDING', errorMessage: '' } }
    );

    // Launch background processor
    setImmediate(() => {
      BlogEmailNotificationService.processPendingDeliveries(blogId)
        .catch((err) => logger.error(`Retry background worker error: ${err.message}`));
    });

    return { retriedCount: failedDeliveries.length, message: `Retrying ${failedDeliveries.length} failed email deliveries.` };
  }

  /**
   * Send test email to specified target email address
   */
  static async sendTestEmail(blogId, targetEmail) {
    const { Blog } = await import('../blog/blog.model.js');
    const blog = await Blog.findById(blogId).lean();

    if (!blog) {
      throw new Error('Blog post not found');
    }

    const html = getBlogNotificationEmailHtml({ blog, unsubscribeToken: 'test-token' });
    const subject = `[TEST PREVIEW] New Article: ${blog.title}`;

    await mailService.sendMail({ to: targetEmail, subject, html });
    return { success: true, targetEmail };
  }

  /**
   * Get notification metrics for a blog
   */
  static async getBlogNotificationStats(blogId) {
    const stats = await BlogEmailDelivery.aggregate([
      { $match: { blogId: new mongoose.Types.ObjectId(blogId) } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const result = {
      total: 0,
      sent: 0,
      failed: 0,
      pending: 0
    };

    for (const stat of stats) {
      if (stat._id === 'SENT') result.sent = stat.count;
      if (stat._id === 'FAILED') result.failed = stat.count;
      if (stat._id === 'PENDING') result.pending = stat.count;
      result.total += stat.count;
    }

    return result;
  }
}
