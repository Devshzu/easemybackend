import { NewsletterService } from './newsletter.service.js';
import { BlogEmailNotificationService } from './blogEmailNotification.service.js';
import { ApiResponse } from '../../utils/apiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

export const handleSubscribe = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const result = await NewsletterService.subscribe(email);
  res
    .status(200)
    .json(new ApiResponse(200, result, result.message));
});

export const handleUnsubscribe = asyncHandler(async (req, res) => {
  const token = req.query.token || req.body.token;
  const result = await NewsletterService.unsubscribeByToken(token);
  
  // If request accepts HTML, render a simple confirmation HTML page
  if (req.headers.accept && req.headers.accept.includes('text/html')) {
    return res.status(200).send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Unsubscribed - EaseMyWeb</title>
          <style>
            body { font-family: system-ui, sans-serif; background: #020617; color: #f8fafc; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
            .card { background: #0f172a; border: 1px solid #1e293b; padding: 40px; border-radius: 16px; text-align: center; max-width: 400px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
            h1 { color: #22c55e; font-size: 24px; margin-bottom: 12px; }
            p { color: #94a3b8; font-size: 14px; line-height: 1.5; margin-bottom: 24px; }
            a { display: inline-block; padding: 10px 20px; background: #22c55e; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>Unsubscribed</h1>
            <p>${result.message}</p>
            <a href="${process.env.FRONTEND_URL || 'https://easemyweb.in'}">Return to EaseMyWeb</a>
          </div>
        </body>
      </html>
    `);
  }

  res.status(200).json(new ApiResponse(200, result, result.message));
});

export const handleGetSubscribers = asyncHandler(async (req, res) => {
  const { page, limit, search, status } = req.query;
  const result = await NewsletterService.getAdminSubscribers({ page, limit, search, status });
  res.status(200).json(new ApiResponse(200, result, 'Subscribers fetched successfully'));
});

export const handleGetSubscriberStats = asyncHandler(async (req, res) => {
  const stats = await NewsletterService.getSubscriberStats();
  res.status(200).json(new ApiResponse(200, stats, 'Subscriber stats fetched successfully'));
});

export const handleUpdateSubscriberStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const updated = await NewsletterService.updateSubscriberStatus(id, status);
  res.status(200).json(new ApiResponse(200, updated, 'Subscriber status updated successfully'));
});

export const handleDeleteSubscriber = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const deleted = await NewsletterService.deleteSubscriber(id);
  res.status(200).json(new ApiResponse(200, deleted, 'Subscriber deleted successfully'));
});

export const handleGetBlogNotificationStats = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const stats = await BlogEmailNotificationService.getBlogNotificationStats(id);
  res.status(200).json(new ApiResponse(200, stats, 'Blog notification stats fetched successfully'));
});

export const handleRetryBlogNotifications = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await BlogEmailNotificationService.retryFailedDeliveries(id);
  res.status(200).json(new ApiResponse(200, result, result.message));
});

export const handleSendTestEmail = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { email } = req.body;
  if (!email) {
    return res.status(400).json(new ApiResponse(400, null, 'Target email is required'));
  }
  const result = await BlogEmailNotificationService.sendTestEmail(id, email);
  res.status(200).json(new ApiResponse(200, result, `Test preview email sent successfully to ${email}`));
});
