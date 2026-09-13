import dotenv from 'dotenv';

dotenv.config();

const nodeEnv = process.env.NODE_ENV || 'development';
const configuredPublicBaseUrl = process.env.PUBLIC_BASE_URL;
const defaultPublicBaseUrl = nodeEnv === 'production'
  ? 'https://api.easemyweb.in'
  : `http://localhost:${process.env.PORT || 8080}`;
const publicBaseUrl = configuredPublicBaseUrl || defaultPublicBaseUrl;

export const config = {
  port: process.env.PORT || 8080,
  publicBaseUrl: nodeEnv === 'production' && /localhost|127\.0\.0\.1/i.test(publicBaseUrl)
    ? defaultPublicBaseUrl
    : publicBaseUrl.replace(/\/+$/, ''),
  nodeEnv,
  corsOrigin: "https://easemyweb.in" || "http://easemyweb.in",
  db: {
    uri: process.env.DATABASE_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/easemyweb'
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 mins default
    max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10)
  },
  blogAutomation: {
    enabled: process.env.BLOG_AUTOMATION_ENABLED === 'true',
    cron: process.env.BLOG_AUTOMATION_CRON || '0 0,4,8,12,16,20 * * *',
    geminiKey: process.env.GEMINI_API_KEY || process.env.GEMINI_KEY || '',
    geminiModel: process.env.GEMINI_MODEL || 'gemini-3.6-flash',
    imageBaseUrl: process.env.IMAGE_GENERATION_URL || 'https://image.pollinations.ai/prompt/'
  }
};

