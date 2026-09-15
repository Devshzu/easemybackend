import { randomUUID } from 'node:crypto';
import { BlogGenerationLock } from './blog.generation-lock.model.js';
import { config } from '../../config/env.config.js';

const LOCK_NAME = 'automated-blog-generation';

export async function acquireBlogGenerationLock() {
  const owner = randomUUID();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + config.blogAutomation.generationLockTtlMs);

  try {
    const lock = await BlogGenerationLock.findOneAndUpdate(
      {
        name: LOCK_NAME,
        $or: [{ expiresAt: { $lte: now } }, { expiresAt: { $exists: false } }]
      },
      { $set: { name: LOCK_NAME, owner, expiresAt } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean();

    return lock?.owner === owner ? owner : null;
  } catch (error) {
    if (error?.code === 11000) return null;
    throw error;
  }
}

export async function releaseBlogGenerationLock(owner) {
  if (!owner) return;
  await BlogGenerationLock.deleteOne({ name: LOCK_NAME, owner });
}
