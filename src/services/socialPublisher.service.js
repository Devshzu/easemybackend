import fs from 'node:fs/promises';
import path from 'node:path';
import axios from 'axios';
import { LinkedInService } from './linkedin.service.js';
import { SocialPost, SocialAccount } from '../modules/social/social.model.js';
import { logger } from '../config/logger.js';

/**
 * Social Publishing Service
 * Handles publishing of social media posts to various platforms
 */
export class SocialPublisherService {
  /**
   * Process and publish a single social post
   */
  static async publishPost(postId) {
    try {
      const post = await SocialPost.findById(postId).populate('accountConfigId');
      
      if (!post) {
        throw new Error(`Social post with ID ${postId} not found`);
      }

      logger.debug(`Processing post ${postId}:`, {
        status: post.status,
        platform: post.platform,
        scheduledAt: post.scheduledAt,
        hasAccount: Boolean(post.accountConfigId)
      });

      if (post.status !== 'APPROVED' && post.status !== 'SCHEDULED') {
        logger.warn(`Skipping post ${postId} with status ${post.status}`);
        return null;
      }

      // Check if scheduled post is ready
      if (post.status === 'SCHEDULED' && post.scheduledAt && new Date(post.scheduledAt) > new Date()) {
        logger.info(`Post ${postId} is scheduled for future: ${post.scheduledAt}`);
        return null;
      }

      // Get account configuration
      let account = post.accountConfigId;
      if (!account) {
        logger.debug(`No account linked to post ${postId}, searching for default LinkedIn account`);
        // Find default account for this platform
        account = await SocialAccount.findOne({
          platform: post.platform,
          isDefault: true,
          status: 'CONNECTED',
        });
        logger.debug(`Default account search result:`, account ? { id: account._id, name: account.accountName } : 'Not found');
      }

      if (!account || account.status !== 'CONNECTED') {
        const errorMsg = `No connected ${post.platform} account found for publishing`;
        logger.error(errorMsg);
        throw new Error(errorMsg);
      }

      let publishResult = null;

      // Platform-specific publishing
      switch (post.platform) {
        case 'LINKEDIN':
          publishResult = await this.publishToLinkedIn(post, account);
          break;
        case 'TWITTER':
          // TODO: Implement Twitter publishing
          throw new Error('Twitter publishing not implemented yet');
        case 'FACEBOOK':
          // TODO: Implement Facebook publishing
          throw new Error('Facebook publishing not implemented yet');
        case 'INSTAGRAM':
          // TODO: Implement Instagram publishing
          throw new Error('Instagram publishing not implemented yet');
        default:
          throw new Error(`Publishing to ${post.platform} is not supported`);
      }

      // Update post status on success
      await SocialPost.findByIdAndUpdate(postId, {
        status: 'PUBLISHED',
        publishedAt: new Date(),
        errorMessage: null,
      });

      logger.info(`Successfully published post ${postId} to ${post.platform}`);
      return publishResult;

    } catch (error) {
      logger.error(`Failed to publish post ${postId}:`, error);
      
      // Update post status with error
      await SocialPost.findByIdAndUpdate(postId, {
        status: 'FAILED',
        errorMessage: error.message,
      });

      throw error;
    }
  }

  /**
   * Publish post to LinkedIn
   */
  static async publishToLinkedIn(post, account) {
    const accessToken = account.credentials?.accessToken;
    const refreshToken = account.credentials?.refreshToken;

    if (!accessToken) {
      throw new Error('LinkedIn access token not found in account credentials');
    }

    // Validate and refresh token if needed
    const isTokenValid = await LinkedInService.validateAccessToken(accessToken);
    let currentAccessToken = accessToken;

    if (!isTokenValid && refreshToken) {
      logger.info(`LinkedIn token expired, refreshing for account ${account._id}`);
      try {
        const tokenData = await LinkedInService.refreshAccessToken(refreshToken);
        currentAccessToken = tokenData.access_token;
        
        // Update account with new token
        await SocialAccount.findByIdAndUpdate(account._id, {
          'credentials.accessToken': tokenData.access_token,
          'credentials.refreshToken': tokenData.refresh_token,
          status: 'CONNECTED',
        });
      } catch (refreshError) {
        logger.error(`Failed to refresh LinkedIn token for account ${account._id}:`, refreshError);
        await SocialAccount.findByIdAndUpdate(account._id, { status: 'EXPIRED' });
        throw new Error('LinkedIn access token expired and refresh failed. Please reconnect your account.');
      }
    }

    // Get user URN
    const userUrn = await LinkedInService.getUserUrn(currentAccessToken);

    // Prepare content
    const content = this.formatLinkedInContent(post);

    let publishResult;

    // Publish with or without image
    if (post.imageUrl) {
      const imageBuffer = await this.downloadImage(post.imageUrl);
      publishResult = await LinkedInService.publishImagePost(
        currentAccessToken,
        userUrn,
        content,
        imageBuffer
      );
    } else {
      publishResult = await LinkedInService.publishTextPost(
        currentAccessToken,
        userUrn,
        content
      );
    }

    return publishResult;
  }

  /**
   * Format post content for LinkedIn
   */
  static formatLinkedInContent(post) {
    let content = post.content;

    // Add hashtags if they exist
    if (post.hashtags && post.hashtags.length > 0) {
      const hashtags = post.hashtags.map(tag => tag.startsWith('#') ? tag : `#${tag}`);
      content += '\n\n' + hashtags.join(' ');
    }

    // Add sources if they exist
    if (post.sources && post.sources.length > 0) {
      content += '\n\nSources:';
      post.sources.forEach(source => {
        if (source.url) {
          content += `\n• ${source.title || 'Source'}: ${source.url}`;
        }
      });
    }

    return content;
  }

  /**
   * Download image from URL and return as buffer
   */
  static async downloadImage(imageUrl) {
    try {
      // If it's a local file path, read from filesystem
      if (imageUrl.startsWith('/') || imageUrl.startsWith('./')) {
        const imagePath = path.resolve(process.cwd(), 'public', imageUrl.replace(/^\//, ''));
        return await fs.readFile(imagePath);
      }

      // If it's a full URL, download it
      if (imageUrl.startsWith('http')) {
        const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
        return Buffer.from(response.data);
      }

      // Assume it's a relative path from public directory
      const imagePath = path.resolve(process.cwd(), 'public', imageUrl);
      return await fs.readFile(imagePath);

    } catch (error) {
      logger.error(`Failed to download image from ${imageUrl}:`, error);
      throw new Error('Failed to download post image');
    }
  }

  /**
   * Get all posts ready for publishing
   */
  static async getPostsReadyForPublishing() {
    const now = new Date();
    
    const query = {
      $or: [
        { status: 'APPROVED' },
        { 
          status: 'SCHEDULED',
          scheduledAt: { $lte: now }
        }
      ],
      platform: { $in: ['LINKEDIN'] } // Only process supported platforms for now
    };

    logger.debug('Searching for posts with query:', JSON.stringify(query));
    
    const posts = await SocialPost.find(query).populate('accountConfigId');
    
    logger.debug(`Found ${posts.length} posts ready for publishing:`, posts.map(p => ({ 
      id: p._id, 
      status: p.status, 
      platform: p.platform, 
      scheduledAt: p.scheduledAt,
      hasAccount: Boolean(p.accountConfigId)
    })));
    
    return posts;
  }

  /**
   * Process all posts ready for publishing
   */
  static async processScheduledPosts() {
    try {
      const posts = await this.getPostsReadyForPublishing();
      
      if (posts.length === 0) {
        logger.debug('No posts ready for publishing');
        return { processed: 0, successful: 0, failed: 0 };
      }

      logger.info(`Processing ${posts.length} posts for publishing`);

      let successful = 0;
      let failed = 0;

      // Process posts in parallel with a limit to avoid rate limiting
      const batchSize = 3;
      for (let i = 0; i < posts.length; i += batchSize) {
        const batch = posts.slice(i, i + batchSize);
        
        const results = await Promise.allSettled(
          batch.map(post => this.publishPost(post._id))
        );

        results.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            successful++;
          } else {
            failed++;
            logger.error(`Failed to publish post ${batch[index]._id}:`, result.reason);
          }
        });

        // Add small delay between batches to respect rate limits
        if (i + batchSize < posts.length) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }

      logger.info(`Publishing completed: ${successful} successful, ${failed} failed`);
      return { processed: posts.length, successful, failed };

    } catch (error) {
      logger.error('Error processing scheduled posts:', error);
      throw error;
    }
  }
}