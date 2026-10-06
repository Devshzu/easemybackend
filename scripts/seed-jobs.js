/**
 * Re-seed script for Career job postings.
 *
 * The automatic seeder in src/utils/seed.js only inserts jobs when the
 * collection is EMPTY. If your database already has the old job records
 * (e.g. the previous Remote / salary listings), run this script once to
 * replace them with the current Noida-based roles:
 *
 *   npm run seed:jobs
 *
 * WARNING: this deletes ALL existing Job documents and re-inserts the
 * seed set. Job applications are NOT touched.
 */

import mongoose from 'mongoose';
import { config } from '../src/config/env.config.js';
import { logger } from '../src/config/logger.js';
import { Job } from '../src/modules/career/job.model.js';
import { initialJobs } from '../src/utils/careerSeedData.js';

const run = async () => {
  try {
    logger.info('🔌 Connecting to MongoDB for job re-seed...');
    await mongoose.connect(config.db.uri);

    const deleted = await Job.deleteMany({});
    logger.info(`🗑️  Removed ${deleted.deletedCount} existing job posting(s).`);

    const inserted = await Job.insertMany(initialJobs);
    logger.info(`💼 Inserted ${inserted.length} job posting(s) at Noida.`);

    inserted.forEach((job) => logger.info(`   • ${job.title} (${job.location})`));
  } catch (error) {
    logger.error(`❌ Job re-seed failed: ${error.message}`);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    logger.info('🔌 MongoDB disconnected.');
  }
};

run();
