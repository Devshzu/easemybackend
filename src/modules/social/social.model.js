import mongoose from 'mongoose';

const sourceSchema = new mongoose.Schema(
  {
    title: { type: String, trim: true },
    url: { type: String, trim: true },
  },
  { _id: false }
);

const socialPostSchema = new mongoose.Schema(
  {
    platform: {
      type: String,
      enum: ['LINKEDIN', 'INSTAGRAM', 'TWITTER', 'FACEBOOK', 'OTHER'],
      default: 'LINKEDIN',
      required: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      default: 'technology',
    },
    generationType: {
      type: String,
      enum: [
        'BLOG_RELATED',
        'TRENDING',
        'MEME',
        'CORPORATE',
        'FESTIVAL',
        'EDUCATIONAL',
        'THOUGHT_LEADERSHIP',
        'COMPANY',
      ],
      default: 'BLOG_RELATED',
    },
    topic: {
      type: String,
      trim: true,
    },
    hook: {
      type: String,
      trim: true,
    },
    content: {
      type: String,
      required: [true, 'Social post content is required'],
    },
    hashtags: [
      {
        type: String,
        trim: true,
      },
    ],
    imageUrl: {
      type: String,
      default: null,
    },
    imagePrompt: {
      type: String,
      default: null,
    },
    sources: [sourceSchema],
    status: {
      type: String,
      enum: ['DRAFT', 'APPROVED', 'SCHEDULED', 'PUBLISHED', 'FAILED'],
      default: 'DRAFT',
    },
    blogId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Blog',
      default: null,
    },
    scheduledAt: {
      type: Date,
      default: null,
    },
    publishedAt: {
      type: Date,
      default: null,
    },
    errorMessage: {
      type: String,
      default: null,
    },
    accountConfigId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SocialAccount',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const socialAccountSchema = new mongoose.Schema(
  {
    platform: {
      type: String,
      enum: ['LINKEDIN', 'INSTAGRAM', 'TWITTER', 'FACEBOOK', 'OTHER'],
      default: 'LINKEDIN',
      required: true,
    },
    accountName: {
      type: String,
      required: [true, 'Account name is required'],
      trim: true,
    },
    profileLink: {
      type: String,
      trim: true,
      default: '',
    },
    credentials: {
      accessToken: { type: String, default: '' },
      refreshToken: { type: String, default: '' },
      clientId: { type: String, default: '' },
      clientSecret: { type: String, default: '' },
      apiKey: { type: String, default: '' },
      webhookUrl: { type: String, default: '' },
      linkedinUserId: { type: String, default: '' },
      expiresAt: { type: Date, default: null },
    },
    status: {
      type: String,
      enum: ['CONNECTED', 'DISCONNECTED', 'EXPIRED'],
      default: 'CONNECTED',
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export const SocialPost = mongoose.model('SocialPost', socialPostSchema);
export const SocialAccount = mongoose.model('SocialAccount', socialAccountSchema);

export default SocialPost;
