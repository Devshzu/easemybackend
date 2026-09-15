import mongoose from 'mongoose';

const blogGenerationLockSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  owner: {
    type: String,
    required: true
  },
  expiresAt: {
    type: Date,
    required: true,
    index: true
  }
});

export const BlogGenerationLock = mongoose.model('BlogGenerationLock', blogGenerationLockSchema);
