import { SocialService } from './social.service.js';
import { generateManualSocialPost, regenerateSocialPost } from './social.generator.js';
import { LinkedInService } from '../../services/linkedin.service.js';
import { SocialPublisherService } from '../../services/socialPublisher.service.js';
import { socialScheduler } from './social.scheduler.js';
import { SocialAccount } from './social.model.js';
import { ApiResponse } from '../../utils/apiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { config } from '../../config/env.config.js';
import { logger } from '../../config/logger.js';

export const getPosts = asyncHandler(async (req, res) => {
  const result = await SocialService.getPosts({
    page: req.query.page,
    limit: req.query.limit,
    status: req.query.status,
    category: req.query.category,
    platform: req.query.platform,
    search: req.query.search,
  });
  res.status(200).json(
    new ApiResponse(200, result.posts, 'Social posts retrieved successfully', result.pagination)
  );
});

export const getPost = asyncHandler(async (req, res) => {
  const post = await SocialService.getPostById(req.params.id);
  res.status(200).json(new ApiResponse(200, post, 'Social post retrieved successfully'));
});

export const generatePost = asyncHandler(async (req, res) => {
  const { topic, category, generationType, platform } = req.body;
  if (!topic) {
    return res.status(400).json({
      success: false,
      statusCode: 400,
      message: 'Topic is required to generate a social post',
    });
  }
  const post = await generateManualSocialPost({ topic, category, generationType, platform });
  res.status(201).json(new ApiResponse(201, post, 'Social post generated successfully'));
});

export const updatePost = asyncHandler(async (req, res) => {
  const post = await SocialService.updatePost(req.params.id, req.body);
  res.status(200).json(new ApiResponse(200, post, 'Social post updated successfully'));
});

export const deletePost = asyncHandler(async (req, res) => {
  await SocialService.deletePost(req.params.id);
  res.status(200).json(new ApiResponse(200, null, 'Social post deleted successfully'));
});

export const regeneratePost = asyncHandler(async (req, res) => {
  const { mode = 'both' } = req.body;
  const post = await regenerateSocialPost(req.params.id, mode);
  res.status(200).json(new ApiResponse(200, post, `Social post ${mode} regenerated successfully`));
});

export const approvePost = asyncHandler(async (req, res) => {
  const post = await SocialService.approvePost(req.params.id);
  res.status(200).json(new ApiResponse(200, post, 'Social post approved successfully'));
});

export const schedulePost = asyncHandler(async (req, res) => {
  const { scheduledAt } = req.body;
  const post = await SocialService.schedulePost(req.params.id, scheduledAt);
  res.status(200).json(new ApiResponse(200, post, 'Social post scheduled successfully'));
});

export const getAccounts = asyncHandler(async (req, res) => {
  const accounts = await SocialService.getAccounts();
  res.status(200).json(new ApiResponse(200, accounts, 'Social accounts retrieved successfully'));
});

export const createAccount = asyncHandler(async (req, res) => {
  const account = await SocialService.createAccount(req.body);
  res.status(201).json(new ApiResponse(201, account, 'Social account created successfully'));
});

export const updateAccount = asyncHandler(async (req, res) => {
  const account = await SocialService.updateAccount(req.params.id, req.body);
  res.status(200).json(new ApiResponse(200, account, 'Social account updated successfully'));
});

export const deleteAccount = asyncHandler(async (req, res) => {
  await SocialService.deleteAccount(req.params.id);
  res.status(200).json(new ApiResponse(200, null, 'Social account deleted successfully'));
});

// LinkedIn OAuth endpoints
export const linkedinAuth = asyncHandler(async (req, res) => {
  if (!config.linkedin.clientId) {
    return res.status(400).json({
      success: false,
      statusCode: 400,
      message: 'LinkedIn API is not configured',
    });
  }

  const state = req.query.state || Math.random().toString(36).substring(7);
  const authUrl = LinkedInService.getAuthUrl(state);
  
  res.status(200).json(new ApiResponse(200, { authUrl, state }, 'LinkedIn authorization URL generated'));
});

export const linkedinCallback = asyncHandler(async (req, res) => {
  const { code, state, error } = req.query;

  if (error) {
    return res.status(400).json({
      success: false,
      statusCode: 400,
      message: `LinkedIn OAuth error: ${error}`,
    });
  }

  if (!code) {
    return res.status(400).json({
      success: false,
      statusCode: 400,
      message: 'Authorization code is required',
    });
  }

  try {
    // Exchange code for access token
    const tokenData = await LinkedInService.getAccessToken(code);
    
    // Get user profile
    const profile = await LinkedInService.getUserProfile(tokenData.access_token);
    
    // Create or update social account
    const existingAccount = await SocialAccount.findOne({
      platform: 'LINKEDIN',
      'credentials.linkedinUserId': profile.id,
    });

    let account;
    if (existingAccount) {
      // Update existing account
      account = await SocialAccount.findByIdAndUpdate(existingAccount._id, {
        accountName: profile.displayName,
        credentials: {
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token,
          linkedinUserId: profile.id,
          expiresAt: new Date(Date.now() + (tokenData.expires_in * 1000)),
        },
        status: 'CONNECTED',
      }, { new: true });
    } else {
      // Create new account
      account = await SocialAccount.create({
        platform: 'LINKEDIN',
        accountName: profile.displayName,
        profileLink: `https://linkedin.com/in/${profile.id}`,
        credentials: {
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token,
          linkedinUserId: profile.id,
          expiresAt: new Date(Date.now() + (tokenData.expires_in * 1000)),
        },
        status: 'CONNECTED',
        isDefault: true, // Set as default if it's the first LinkedIn account
      });
    }

    // Redirect to frontend with success message
    const frontendUrl = `${config.frontendUrl}/admin/social?connected=linkedin&account=${account._id}`;
    res.redirect(frontendUrl);

  } catch (error) {
    logger.error('LinkedIn OAuth callback error:', error);
    const frontendUrl = `${config.frontendUrl}/admin/social?error=${encodeURIComponent(error.message)}`;
    res.redirect(frontendUrl);
  }
});

// Publishing endpoints
export const publishPost = asyncHandler(async (req, res) => {
  const result = await SocialPublisherService.publishPost(req.params.id);
  res.status(200).json(new ApiResponse(200, result, 'Post published successfully'));
});

export const getSchedulerStatus = asyncHandler(async (req, res) => {
  const status = socialScheduler.getStatus();
  res.status(200).json(new ApiResponse(200, status, 'Scheduler status retrieved'));
});

export const triggerManualPublishing = asyncHandler(async (req, res) => {
  const result = await socialScheduler.triggerManually();
  res.status(200).json(new ApiResponse(200, result, 'Manual publishing triggered successfully'));
});

export const debugPublishing = asyncHandler(async (req, res) => {
  const { SocialPublisherService } = await import('../../services/socialPublisher.service.js');
  const { SocialPost, SocialAccount } = await import('./social.model.js');
  
  // Get all posts ready for publishing
  const readyPosts = await SocialPublisherService.getPostsReadyForPublishing();
  
  // Get all approved posts regardless of platform
  const approvedPosts = await SocialPost.find({ status: 'APPROVED' });
  
  // Get connected accounts
  const connectedAccounts = await SocialAccount.find({ status: 'CONNECTED' });
  
  const debug = {
    readyForPublishing: readyPosts.length,
    readyPosts: readyPosts.map(p => ({
      id: p._id,
      status: p.status,
      platform: p.platform,
      hasAccount: Boolean(p.accountConfigId),
    })),
    totalApproved: approvedPosts.length,
    approvedPosts: approvedPosts.map(p => ({
      id: p._id,
      platform: p.platform,
      status: p.status,
    })),
    connectedAccounts: connectedAccounts.map(a => ({
      id: a._id,
      platform: a.platform,
      name: a.accountName,
      isDefault: a.isDefault,
    })),
  };
  
  res.status(200).json(new ApiResponse(200, debug, 'Publishing debug information'));
});
