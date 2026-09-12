import mongoose from 'mongoose';
import { logger } from './logger.js';
import { config } from './env.config.js';
import { seedDatabase } from '../utils/seed.js';

/**
 * MongoDB connection setup using Mongoose
 */
export const connectDB = async () => {
  try {
    const dbUri = config.db.uri;
    logger.info(`🔌 Connecting to MongoDB Database...`);
    
    const conn = await mongoose.connect(dbUri);

    logger.info(`✅ MongoDB Connected: ${conn.connection.host}`);
    
    // Auto-seed Admin credentials & Initial Static Blogs
    await seedDatabase();
  } catch (error) {
    logger.error('❌ MongoDB Connection Error:', error.message);
    // Non-fatal fallback for development if connection fails
  }
};

/**
 * Disconnect MongoDB cleanly
 */
export const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    logger.info('🔌 MongoDB disconnected cleanly.');
  } catch (error) {
    logger.error('Error disconnecting MongoDB:', error.message);
  }
};
