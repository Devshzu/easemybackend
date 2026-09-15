import { Queue, Worker } from 'bullmq';
import { config } from '../../config/env.config.js';
import { logger } from '../../config/logger.js';
import { generateAndPublishBlog } from './blog.generator.js';

export const BLOG_QUEUE_NAME = 'automated-blog-generation';

function redisConnection() {
  const redisUrl = new URL(config.blogAutomation.redisUrl);
  const connection = {
    host: redisUrl.hostname,
    port: Number(redisUrl.port || 6379),
    maxRetriesPerRequest: null
  };

  if (redisUrl.username) connection.username = decodeURIComponent(redisUrl.username);
  if (redisUrl.password) connection.password = decodeURIComponent(redisUrl.password);
  if (redisUrl.protocol === 'rediss:') connection.tls = {};

  return connection;
}

const connection = redisConnection();

export const blogQueue = new Queue(BLOG_QUEUE_NAME, {
  connection,
  defaultJobOptions: {
    attempts: 4,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: 100,
    removeOnFail: 500
  }
});

let blogWorker;

export async function enqueueBlogGeneration() {
  const scheduledSlot = Math.floor(Date.now() / 60000);
  const job = await blogQueue.add('generate-and-publish', {
    requestedAt: new Date().toISOString()
  }, {
    jobId: `scheduled-blog-${scheduledSlot}`
  });
  logger.info(`Queued automated blog generation job ${job.id}`);
  return job;
}

export function startBlogWorker() {
  if (blogWorker) return blogWorker;

  blogWorker = new Worker(
    BLOG_QUEUE_NAME,
    async (job) => {
      logger.info(`Processing automated blog generation job ${job.id}`);
      const blog = await generateAndPublishBlog();
      return blog ? { blogId: blog._id?.toString() || null } : { skipped: true };
    },
    { connection, concurrency: 1 }
  );

  blogWorker.on('completed', (job) => {
    logger.info(`Completed automated blog generation job ${job.id}`);
  });
  blogWorker.on('failed', (job, error) => {
    logger.error(`Automated blog generation job ${job?.id || 'unknown'} failed`, error);
  });
  blogWorker.on('error', (error) => {
    logger.error('Automated blog worker error', error);
  });

  logger.info(`BullMQ blog worker started using Redis queue: ${BLOG_QUEUE_NAME}`);
  return blogWorker;
}

export async function stopBlogQueue() {
  await blogWorker?.close();
  await blogQueue.close();
  blogWorker = undefined;
}
