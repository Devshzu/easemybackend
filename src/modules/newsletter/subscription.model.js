import mongoose from 'mongoose';
import crypto from 'node:crypto';

const subscriptionSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'UNSUBSCRIBED'],
      default: 'ACTIVE',
      index: true
    },
    unsubscribeToken: {
      type: String,
      unique: true,
      index: true
    },
    subscribedAt: {
      type: Date,
      default: Date.now
    },
    unsubscribedAt: {
      type: Date
    },
    lastEmailSentAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

// Auto-generate unsubscribeToken before initial creation
subscriptionSchema.pre('save', function () {
  if (!this.unsubscribeToken) {
    this.unsubscribeToken = crypto.randomBytes(24).toString('hex');
  }
});

export const Subscription = mongoose.model('Subscription', subscriptionSchema);
