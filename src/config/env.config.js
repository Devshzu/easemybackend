import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: process.env.PORT || 8080,
  publicBaseUrl: process.env.PUBLIC_BASE_URL || `http://localhost:${process.env.PORT || 8080}`,
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
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

