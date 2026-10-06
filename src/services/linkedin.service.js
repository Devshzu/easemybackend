import axios from 'axios';
import { config } from '../config/env.config.js';
import { logger } from '../config/logger.js';

/**
 * LinkedIn API Service for OAuth and Post Publishing
 */
export class LinkedInService {
  static LINKEDIN_API_BASE = 'https://api.linkedin.com/v2';
  static LINKEDIN_AUTH_BASE = 'https://www.linkedin.com/oauth/v2';

  /**
   * Generate LinkedIn OAuth authorization URL
   */
  static getAuthUrl(state = null) {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: config.linkedin.clientId,
      redirect_uri: config.linkedin.redirectUri,
      scope: config.linkedin.scope,
    });

    if (state) {
      params.append('state', state);
    }

    return `${this.LINKEDIN_AUTH_BASE}/authorization?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
  static async getAccessToken(authCode) {
    try {
      const response = await axios.post(`${this.LINKEDIN_AUTH_BASE}/accessToken`, {
        grant_type: 'authorization_code',
        code: authCode,
        redirect_uri: config.linkedin.redirectUri,
        client_id: config.linkedin.clientId,
        client_secret: config.linkedin.clientSecret,
      }, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      return {
        access_token: response.data.access_token,
        expires_in: response.data.expires_in,
        refresh_token: response.data.refresh_token,
        scope: response.data.scope,
      };
    } catch (error) {
      logger.error('LinkedIn access token exchange failed:', error.response?.data || error.message);
      throw new Error('Failed to exchange authorization code for access token');
    }
  }

  /**
   * Get LinkedIn user profile information
   */
  static async getUserProfile(accessToken) {
    try {
      const response = await axios.get(`${this.LINKEDIN_API_BASE}/people/~:(id,firstName,lastName,profilePicture(displayImage~:playableStreams))`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      const profile = response.data;
      return {
        id: profile.id,
        firstName: profile.firstName?.localized?.en_US || '',
        lastName: profile.lastName?.localized?.en_US || '',
        displayName: `${profile.firstName?.localized?.en_US || ''} ${profile.lastName?.localized?.en_US || ''}`.trim(),
        profilePicture: profile.profilePicture?.displayImage?.elements?.[0]?.identifiers?.[0]?.identifier || null,
      };
    } catch (error) {
      logger.error('LinkedIn profile fetch failed:', error.response?.data || error.message);
      throw new Error('Failed to fetch LinkedIn user profile');
    }
  }

  /**
   * Get user's LinkedIn URN (required for posting)
   */
  static async getUserUrn(accessToken) {
    try {
      // Try the standard approach first
      const response = await axios.get(`${this.LINKEDIN_API_BASE}/people/~:(id)`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      return `urn:li:person:${response.data.id}`;
    } catch (error) {
      // If we get 403, try alternative approach
      if (error.response?.status === 403) {
        logger.warn('Standard LinkedIn profile access denied, trying alternative approach');
        
        try {
          // Alternative: Use userinfo endpoint from OpenID Connect
          const userinfoResponse = await axios.get('https://api.linkedin.com/v2/userinfo', {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
            },
          });
          
          if (userinfoResponse.data.sub) {
            return `urn:li:person:${userinfoResponse.data.sub}`;
          }
        } catch (userinfoError) {
          logger.error('LinkedIn userinfo access also failed:', userinfoError.response?.data || userinfoError.message);
        }
        
        throw new Error(`LinkedIn API access denied. Your LinkedIn app needs "Share on LinkedIn" product approval. Please go to https://developer.linkedin.com/ and request access to the "Share on LinkedIn" product for your app.`);
      }
      
      logger.error('LinkedIn URN fetch failed:', error.response?.data || error.message);
      throw new Error('Failed to fetch LinkedIn user URN');
    }
  }

  /**
   * Upload image to LinkedIn for use in posts
   */
  static async uploadImage(accessToken, userUrn, imageBuffer, filename = 'social-image.jpg') {
    try {
      // Step 1: Register upload
      const registerResponse = await axios.post(`${this.LINKEDIN_API_BASE}/assets?action=registerUpload`, {
        registerUploadRequest: {
          recipes: ['urn:li:digitalmediaRecipe:feedshare-image'],
          owner: userUrn,
          serviceRelationships: [{
            relationshipType: 'OWNER',
            identifier: 'urn:li:userGeneratedContent',
          }],
        },
      }, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      const uploadUrl = registerResponse.data.value.uploadMechanism['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest'].uploadUrl;
      const asset = registerResponse.data.value.asset;

      // Step 2: Upload binary data
      await axios.put(uploadUrl, imageBuffer, {
        headers: {
          'Content-Type': 'application/octet-stream',
        },
      });

      // Return the asset URN for use in posts
      return asset;
    } catch (error) {
      logger.error('LinkedIn image upload failed:', error.response?.data || error.message);
      throw new Error('Failed to upload image to LinkedIn');
    }
  }

  /**
   * Publish a text post to LinkedIn
   */
  static async publishTextPost(accessToken, userUrn, content) {
    try {
      const postData = {
        author: userUrn,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: {
              text: content,
            },
            shareMediaCategory: 'NONE',
          },
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
        },
      };

      const response = await axios.post(`${this.LINKEDIN_API_BASE}/ugcPosts`, postData, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0',
        },
      });

      return {
        id: response.data.id,
        created: response.data.created,
        lastModified: response.data.lastModified,
      };
    } catch (error) {
      logger.error('LinkedIn text post publishing failed:', error.response?.data || error.message);
      throw new Error(`Failed to publish text post to LinkedIn: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Publish a post with image to LinkedIn
   */
  static async publishImagePost(accessToken, userUrn, content, imageBuffer, filename = 'social-image.jpg') {
    try {
      // Upload image first
      const assetUrn = await this.uploadImage(accessToken, userUrn, imageBuffer, filename);

      const postData = {
        author: userUrn,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: {
              text: content,
            },
            shareMediaCategory: 'IMAGE',
            media: [{
              status: 'READY',
              description: {
                text: 'Social media post image',
              },
              media: assetUrn,
              title: {
                text: 'Social Post',
              },
            }],
          },
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
        },
      };

      const response = await axios.post(`${this.LINKEDIN_API_BASE}/ugcPosts`, postData, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0',
        },
      });

      return {
        id: response.data.id,
        created: response.data.created,
        lastModified: response.data.lastModified,
      };
    } catch (error) {
      logger.error('LinkedIn image post publishing failed:', error.response?.data || error.message);
      throw new Error(`Failed to publish image post to LinkedIn: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Refresh access token using refresh token
   */
  static async refreshAccessToken(refreshToken) {
    try {
      const response = await axios.post(`${this.LINKEDIN_AUTH_BASE}/accessToken`, {
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: config.linkedin.clientId,
        client_secret: config.linkedin.clientSecret,
      }, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      return {
        access_token: response.data.access_token,
        expires_in: response.data.expires_in,
        refresh_token: response.data.refresh_token || refreshToken, // Some responses don't include new refresh token
      };
    } catch (error) {
      logger.error('LinkedIn token refresh failed:', error.response?.data || error.message);
      throw new Error('Failed to refresh LinkedIn access token');
    }
  }

  /**
   * Validate access token by making a simple API call
   */
  static async validateAccessToken(accessToken) {
    try {
      await axios.get(`${this.LINKEDIN_API_BASE}/people/~:(id)`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      return true;
    } catch (error) {
      logger.warn('LinkedIn access token validation failed:', error.response?.status);
      return false;
    }
  }
}