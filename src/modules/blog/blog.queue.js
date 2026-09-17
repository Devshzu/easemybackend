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
    maxRetriesPerRequest: null,
    enableOfflineQueue: false,
  };

  if (redisUrl.username) connection.username = decodeURIComponent(redisUrl.username);
  if (redisUrl.password) connection.password = decodeURIComponent(redisUrl.password);
  if (redisUrl.protocol === 'rediss:') connection.tls = {};

  return connection;
}

let blogQueue;
let blogWorker;

export function getBlogQueue() {
  if (blogQueue) return blogQueue;

  try {
    const connection = redisConnection();
    blogQueue = new Queue(BLOG_QUEUE_NAME, {
      connection,
      defaultJobOptions: {
        attempts: 4,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: 100,
        removeOnFail: 500,
      },
    });

    blogQueue.on('error', (err) => {
      logger.warn(`BullMQ Queue Redis connection note: ${err.message}`);
    });
  } catch (err) {
    logger.warn(`Failed to initialize BullMQ Redis queue: ${err.message}`);
  }

  return blogQueue;
}

export async function enqueueBlogGeneration() {
  const queue = getBlogQueue();
  if (!queue) {
    logger.warn('Redis queue is unavailable. Falling back to direct blog generation.');
    return generateAndPublishBlog();
  }
  const scheduledSlot = Math.floor(Date.now() / 60000);
  const job = await queue.add(
    'generate-and-publish',
    {
      requestedAt: new Date().toISOString(),
    },
    {
      jobId: `scheduled-blog-${scheduledSlot}`,
    }
  );
  logger.info(`Queued automated blog generation job ${job.id}`);
  return job;
}

export function startBlogWorker() {
  if (blogWorker) return blogWorker;

  try {
    const connection = redisConnection();
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
      logger.warn(`BullMQ Redis worker connection note: ${error.message}`);
    });

    logger.info(`BullMQ blog worker started using Redis queue: ${BLOG_QUEUE_NAME}`);
  } catch (err) {
    logger.warn(`Could not start BullMQ worker: ${err.message}`);
  }

  return blogWorker;
}

export async function stopBlogQueue() {
  await blogWorker?.close();
  await blogQueue?.close();
  blogWorker = undefined;
  blogQueue = undefined;
}
