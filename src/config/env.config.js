import dotenv from 'dotenv';

dotenv.config();

const nodeEnv = process.env.NODE_ENV || 'development';
const configuredPublicBaseUrl = process.env.PUBLIC_BASE_URL;
const defaultPublicBaseUrl = nodeEnv === 'production'
  ? 'https://api.easemyweb.in'
  : `http://localhost:${process.env.PORT || 8080}`;
const publicBaseUrl = configuredPublicBaseUrl || defaultPublicBaseUrl;
const configuredGeminiKeys = [
  process.env.GEMINI_KEYS,
  process.env.GEMINI_API_KEYS,
  ...Array.from({ length: 20 }, (_, index) => process.env[`GEMINI_KEY_${index + 1}`])
].filter(Boolean)
  .flatMap((value) => value.split(','))
  .map((key) => key.trim())
  .filter(Boolean);
const geminiKeys = [...new Set([
  ...configuredGeminiKeys,
  process.env.GEMINI_API_KEY,
  process.env.GEMINI_KEY
].filter(Boolean).map((key) => key.trim()))];

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
  frontendUrl: process.env.FRONTEND_URL || process.env.CORS_ORIGIN || 'http://localhost:3000',
  smtp: {
    host: process.env.SMTP_HOST || 'smtpout.secureserver.net',
    port: parseInt(process.env.SMTP_PORT || '465', 10),
    secure: process.env.SMTP_SECURE === 'true' || process.env.SMTP_PORT === '465',
    user: process.env.SMTP_USER || 'hello@easemyweb.in',
    pass: process.env.SMTP_PASS || ''
  },
  blogAutomation: {
    enabled: process.env.BLOG_AUTOMATION_ENABLED === 'true',
    cron: process.env.BLOG_AUTOMATION_CRON || '0 0,4,8,12,16,20 * * *',
    trendingMaxAgeDays: parseInt(process.env.BLOG_TRENDING_MAX_AGE_DAYS || '7', 10),
    geminiRequestTimeoutMs: parseInt(process.env.GEMINI_REQUEST_TIMEOUT_MS || '120000', 10),
    imageRequestTimeoutMs: parseInt(process.env.IMAGE_REQUEST_TIMEOUT_MS || '120000', 10),
    generationLockTtlMs: parseInt(process.env.BLOG_GENERATION_LOCK_TTL_MS || '1800000', 10),
    queueEnabled: process.env.BLOG_QUEUE_ENABLED === 'true',
    redisUrl: process.env.REDIS_URL || 'redis://127.0.0.1:6379',
    geminiKeys,
    geminiKey: geminiKeys[0] || '',
    geminiModel: process.env.GEMINI_MODEL || 'gemini-3.6-flash',
    imageBaseUrl: process.env.IMAGE_GENERATION_URL || 'https://image.pollinations.ai/prompt/'
  }
};

