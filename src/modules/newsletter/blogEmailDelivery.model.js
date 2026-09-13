import mongoose from 'mongoose';

const blogEmailDeliverySchema = new mongoose.Schema(
  {
    blogId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Blog',
      required: true,
      index: true
    },
    subscriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subscription',
      required: true,
      index: true
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },
    status: {
      type: String,
      enum: ['PENDING', 'SENT', 'FAILED'],
      default: 'PENDING',
      index: true
    },
    sentAt: {
      type: Date
    },
    failedAt: {
      type: Date
    },
    errorMessage: {
      type: String
    },
    attempts: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

// Unique compound index so the exact same blog is never sent twice to the same subscriber
blogEmailDeliverySchema.index({ blogId: 1, subscriptionId: 1 }, { unique: true });

export const BlogEmailDelivery = mongoose.model('BlogEmailDelivery', blogEmailDeliverySchema);
