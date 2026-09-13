import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      default: 'Anonymous Reader',
    },
    message: {
      type: String,
      required: [true, 'Comment message is required'],
      trim: true,
    },
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const blogSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Blog title is required'],
      trim: true,
    },
    slug: {
      type: String,
      required: [true, 'Blog slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      default: 'Technology',
    },
    excerpt: {
      type: String,
      required: [true, 'Excerpt summary is required'],
      trim: true,
    },
    metaTitle: {
      type: String,
      trim: true,
    },
    content: {
      type: String,
      required: [true, 'Blog content is required'],
    },
    metaDescription: {
      type: String,
      trim: true,
    },
    keywords: [{
      type: String,
      trim: true,
    }],
    tableOfContents: [{
      title: String,
      id: String,
    }],
    references: [{
      title: String,
      source: String,
      url: String,
    }],
    author: {
      type: String,
      default: 'EaseMyWeb Team',
    },
    readTime: {
      type: String,
      default: '5 min read',
    },
    image: {
      type: String,
      default: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800&auto=format&fit=crop&q=80',
    },
    published: {
      type: Boolean,
      default: true,
    },
    likedBy: {
      type: [String],
      default: [],
    },
    comments: [commentSchema],
  },
  {
    timestamps: true,
  }
);

export const Blog = mongoose.model('Blog', blogSchema);
export default Blog;
