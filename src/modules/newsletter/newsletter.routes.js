import { Router } from 'express';
import {
  handleSubscribe,
  handleUnsubscribe,
  handleGetSubscribers,
  handleGetSubscriberStats,
  handleUpdateSubscriberStatus,
  handleDeleteSubscriber,
  handleGetBlogNotificationStats,
  handleRetryBlogNotifications,
  handleSendTestEmail
} from './newsletter.controller.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';

const router = Router();

// Public routes
router.post('/subscribe', handleSubscribe);
router.get('/unsubscribe', handleUnsubscribe);
router.post('/unsubscribe', handleUnsubscribe);

// Admin routes (Protected by authMiddleware)
router.get('/admin/subscriptions', authMiddleware, handleGetSubscribers);
router.get('/admin/subscriptions/stats', authMiddleware, handleGetSubscriberStats);
router.patch('/admin/subscriptions/:id/status', authMiddleware, handleUpdateSubscriberStatus);
router.delete('/admin/subscriptions/:id', authMiddleware, handleDeleteSubscriber);

router.get('/admin/blogs/:id/email-notifications', authMiddleware, handleGetBlogNotificationStats);
router.post('/admin/blogs/:id/email-notifications/retry', authMiddleware, handleRetryBlogNotifications);
router.post('/admin/blogs/:id/email-notifications/test', authMiddleware, handleSendTestEmail);

export default router;
