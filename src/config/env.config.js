import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: process.env.PORT || 8080,
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  db: {
    uri: process.env.DATABASE_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/easemyweb'
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 mins default
    max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10)
  }
};

