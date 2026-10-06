# LinkedIn API Integration Setup

This guide will help you set up LinkedIn API integration for automated social media posting.

## Prerequisites

1. LinkedIn account (personal or company page)
2. LinkedIn Developer Account
3. LinkedIn App with proper permissions

## Step 1: Create LinkedIn App

1. Go to [LinkedIn Developer Portal](https://developer.linkedin.com/)
2. Sign in with your LinkedIn account
3. Click "Create App"
4. Fill in the required information:
   - App Name: Your app name (e.g., "EaseMyWeb Social Publisher")
   - LinkedIn Page: Associate with your company page (optional)
   - App Logo: Upload a logo (optional)
   - Legal Agreement: Accept the terms

## Step 2: Configure App Permissions

1. In your app dashboard, go to the "Products" tab
2. Request access to the following products:
   - **Sign In with LinkedIn using OpenID Connect** (for authentication)
   - **Share on LinkedIn** (for posting content)

3. Wait for approval (usually instant for most products)

## Step 3: Get API Credentials

1. Go to the "Auth" tab in your app dashboard
2. Copy the following credentials:
   - **Client ID**
   - **Client Secret**

## Step 4: Configure Redirect URIs

1. In the "Auth" tab, find "Authorized redirect URLs"
2. Add your callback URL:
   ```
   http://localhost:8080/api/social/accounts/linkedin/callback
   ```
   For production, use your actual domain:
   ```
   https://yourdomain.com/api/social/accounts/linkedin/callback
   ```

## Step 5: Update Environment Variables

Update your `.env` file with the LinkedIn credentials:

```env
# LinkedIn API Configuration
LINKEDIN_CLIENT_ID=your_client_id_here
LINKEDIN_CLIENT_SECRET=your_client_secret_here
LINKEDIN_REDIRECT_URI=http://localhost:8080/api/social/accounts/linkedin/callback
LINKEDIN_SCOPE=openid,profile,email,w_member_social

# Social Media Publishing
SOCIAL_PUBLISHING_ENABLED=true
SOCIAL_PUBLISHING_CRON=*/5 * * * *
```

## Step 6: Connect Your LinkedIn Account

1. Restart your backend server to load the new environment variables
2. Go to `/admin/social` in your frontend
3. Click the "Accounts" tab
4. Click "Connect LinkedIn" button
5. Authorize the application on LinkedIn
6. You'll be redirected back to your admin panel

## Step 7: Test Publishing

1. Create a social post or approve an existing draft
2. Click "Publish Now" or schedule it for later
3. The scheduler will automatically publish scheduled posts every 5 minutes

## Troubleshooting

### Common Issues

1. **"LinkedIn API is not configured" error**
   - Make sure LINKEDIN_CLIENT_ID and LINKEDIN_CLIENT_SECRET are set in your .env file
   - Restart the server after updating environment variables

2. **OAuth callback errors**
   - Verify the redirect URI matches exactly in both LinkedIn app settings and your .env file
   - Make sure the URL is accessible (use ngrok for local development if needed)

3. **Permission denied errors**
   - Ensure your LinkedIn app has "Share on LinkedIn" product access
   - Check that the connected account has posting permissions

4. **Token expired errors**
   - The system will automatically refresh tokens
   - If refresh fails, disconnect and reconnect the account

### LinkedIn API Limits

- **Rate Limits**: 500 requests per user per day for Share API
- **Post Limits**: No specific limit, but follow LinkedIn's best practices
- **Content Guidelines**: Follow LinkedIn's community guidelines

### Production Considerations

1. **Domain Verification**: For production, you may need to verify your domain with LinkedIn
2. **App Review**: Some advanced features may require LinkedIn app review
3. **SSL Required**: HTTPS is required for production redirect URIs
4. **Rate Limiting**: Implement proper rate limiting to stay within LinkedIn's limits

## Support

If you encounter issues:
1. Check LinkedIn's [API documentation](https://docs.microsoft.com/en-us/linkedin/)
2. Review the application logs for detailed error messages
3. Ensure your LinkedIn app has the correct permissions and products enabled

## Security Notes

- Keep your CLIENT_SECRET secure and never expose it in frontend code
- Use HTTPS in production
- Regularly rotate access tokens if possible
- Monitor API usage to stay within limits