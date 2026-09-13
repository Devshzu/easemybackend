import { Subscription } from './subscription.model.js';
import { logger } from '../../config/logger.js';
import { ApiError } from '../../utils/apiError.js';

export class NewsletterService {
  /**
   * Public Subscribe
   */
  static async subscribe(emailInput) {
    if (!emailInput || typeof emailInput !== 'string') {
      throw new ApiError(400, 'Valid email address is required');
    }

    const email = emailInput.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new ApiError(400, 'Invalid email format');
    }

    let subscription = await Subscription.findOne({ email });

    if (subscription) {
      if (subscription.status === 'ACTIVE') {
        return {
          alreadySubscribed: true,
          message: 'You are already subscribed to EaseMyWeb newsletter.',
          subscription
        };
      } else {
        // Re-activate subscription
        subscription.status = 'ACTIVE';
        subscription.subscribedAt = new Date();
        subscription.unsubscribedAt = undefined;
        await subscription.save();
        logger.info(`Reactivated newsletter subscription for: ${email}`);
        return {
          reactivated: true,
          message: 'Welcome back! Your newsletter subscription has been reactivated.',
          subscription
        };
      }
    }

    // New subscription
    subscription = await Subscription.create({ email, status: 'ACTIVE' });
    logger.info(`New newsletter subscription created for: ${email}`);
    return {
      success: true,
      message: 'Successfully subscribed to EaseMyWeb newsletter!',
      subscription
    };
  }

  /**
   * Public Unsubscribe by token
   */
  static async unsubscribeByToken(token) {
    if (!token) {
      throw new ApiError(400, 'Unsubscribe token is required');
    }

    const subscription = await Subscription.findOne({ unsubscribeToken: token });
    if (!subscription) {
      throw new ApiError(404, 'Invalid or expired unsubscribe link');
    }

    if (subscription.status === 'UNSUBSCRIBED') {
      return { message: 'You have already unsubscribed.', subscription };
    }

    subscription.status = 'UNSUBSCRIBED';
    subscription.unsubscribedAt = new Date();
    await subscription.save();

    logger.info(`User unsubscribed via token: ${subscription.email}`);
    return { message: 'You have been successfully unsubscribed from EaseMyWeb newsletter.', subscription };
  }

  /**
   * Admin: Get subscribers list with search, filter, and pagination
   */
  static async getAdminSubscribers({ page = 1, limit = 10, search = '', status = '' }) {
    const query = {};

    if (search && search.trim()) {
      query.email = { $regex: search.trim(), $options: 'i' };
    }

    if (status && ['ACTIVE', 'UNSUBSCRIBED'].includes(status.toUpperCase())) {
      query.status = status.toUpperCase();
    }

    const numericPage = Math.max(1, parseInt(page, 10));
    const numericLimit = Math.max(1, Math.min(100, parseInt(limit, 10)));
    const skip = (numericPage - 1) * numericLimit;

    const [subscribers, total] = await Promise.all([
      Subscription.find(query).sort({ createdAt: -1 }).skip(skip).limit(numericLimit).lean(),
      Subscription.countDocuments(query)
    ]);

    return {
      subscribers,
      pagination: {
        page: numericPage,
        limit: numericLimit,
        total,
        totalPages: Math.ceil(total / numericLimit) || 1
      }
    };
  }

  /**
   * Admin: Get summary subscriber statistics
   */
  static async getSubscriberStats() {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [total, active, unsubscribed, subscribedThisMonth] = await Promise.all([
      Subscription.countDocuments({}),
      Subscription.countDocuments({ status: 'ACTIVE' }),
      Subscription.countDocuments({ status: 'UNSUBSCRIBED' }),
      Subscription.countDocuments({ createdAt: { $gte: startOfMonth } })
    ]);

    return {
      total,
      active,
      unsubscribed,
      subscribedThisMonth
    };
  }

  /**
   * Admin: Update subscriber status
   */
  static async updateSubscriberStatus(id, status) {
    const normalizedStatus = (status || '').toUpperCase();
    if (!['ACTIVE', 'UNSUBSCRIBED'].includes(normalizedStatus)) {
      throw new ApiError(400, 'Invalid status value. Must be ACTIVE or UNSUBSCRIBED.');
    }

    const updateData = { status: normalizedStatus };
    if (normalizedStatus === 'UNSUBSCRIBED') {
      updateData.unsubscribedAt = new Date();
    } else {
      updateData.subscribedAt = new Date();
    }

    const subscription = await Subscription.findByIdAndUpdate(id, updateData, { new: true });
    if (!subscription) {
      throw new ApiError(404, 'Subscriber not found');
    }

    return subscription;
  }

  /**
   * Admin: Delete subscriber
   */
  static async deleteSubscriber(id) {
    const subscription = await Subscription.findByIdAndDelete(id);
    if (!subscription) {
      throw new ApiError(404, 'Subscriber not found');
    }
    return subscription;
  }
}
