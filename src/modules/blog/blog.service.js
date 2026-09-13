import { Blog } from './blog.model.js';
import { logger } from '../../config/logger.js';

export class BlogService {
  /**
   * Helper function to generate URL slug from title
   */
  static generateSlug(title) {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-');
  }

  /**
   * Create new blog post
   */
  static async createBlog(data) {
    logger.info('Creating new blog post:', data.title);
    const slug = data.slug || this.generateSlug(data.title);

    const blog = await Blog.create({
      title: data.title,
      slug,
      category: data.category || 'Technology',
      excerpt: data.excerpt,
      metaTitle: data.metaTitle,
      content: data.content,
      metaDescription: data.metaDescription,
      keywords: data.keywords,
      tableOfContents: data.tableOfContents,
      references: data.references,
      author: data.author || 'EaseMyWeb Team',
      readTime: data.readTime || '5 min read',
      image: data.image || 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800&auto=format&fit=crop&q=80',
      published: data.published !== undefined ? data.published : true,
    });

    return blog;
  }

  /**
   * Get all blog posts (optionally filter by published state for public view)
   */
  static async getAllBlogs(onlyPublished = false) {
    const filter = onlyPublished ? { published: true } : {};
    return await Blog.find(filter).sort({ createdAt: -1 });
  }

  /**
   * Get single blog post by ID or Slug
   */
  static async getBlogByIdOrSlug(idOrSlug) {
    let blog = null;
    if (idOrSlug.match(/^[0-9a-fA-F]{24}$/)) {
      blog = await Blog.findById(idOrSlug);
    }
    if (!blog) {
      blog = await Blog.findOne({ slug: idOrSlug });
    }
    if (!blog) {
      throw new Error('Blog post not found');
    }
    return blog;
  }

  /**
   * Update existing blog post
   */
  static async updateBlog(id, data) {
    if (data.title && !data.slug) {
      data.slug = this.generateSlug(data.title);
    }

    const updatedBlog = await Blog.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });

    if (!updatedBlog) {
      throw new Error('Blog post not found');
    }

    return updatedBlog;
  }

  /**
   * Delete blog post
   */
  static async deleteBlog(id) {
    const deletedBlog = await Blog.findByIdAndDelete(id);
    if (!deletedBlog) {
      throw new Error('Blog post not found');
    }
    return { deleted: true, id };
  }

  /**
   * Add comment to blog post
   */
  static async addComment(idOrSlug, { name, message, parentId }) {
    if (!message || message.trim().length === 0) {
      throw new Error('Comment message is required');
    }

    const blog = await this.getBlogByIdOrSlug(idOrSlug);
    if (!blog.comments) {
      blog.comments = [];
    }

    if (parentId && !blog.comments.some((comment) => String(comment._id) === String(parentId))) {
      throw new Error('Parent comment not found');
    }

    blog.comments.push({
      name: name && name.trim() ? name.trim() : 'Anonymous Reader',
      message: message.trim(),
      parentId: parentId || null,
    });

    await blog.save();
    return blog;
  }

  static async getCommentPage(idOrSlug, page = 1, limit = 8) {
    const blog = await this.getBlogByIdOrSlug(idOrSlug);
    const comments = blog.comments || [];
    const repliesByParent = new Map();

    comments.forEach((comment) => {
      const parentId = comment.parentId ? String(comment.parentId) : null;
      if (parentId) {
        const replies = repliesByParent.get(parentId) || [];
        replies.push(comment);
        repliesByParent.set(parentId, replies);
      }
    });

    const roots = comments
      .filter((comment) => !comment.parentId)
      .sort((first, second) => second.createdAt - first.createdAt);
    const start = (page - 1) * limit;
    const pageRoots = roots.slice(start, start + limit);
    const pageComments = [];
    const appendThread = (comment) => {
      pageComments.push(comment);
      (repliesByParent.get(String(comment._id)) || [])
        .sort((first, second) => first.createdAt - second.createdAt)
        .forEach(appendThread);
    };
    pageRoots.forEach(appendThread);

    return {
      comments: pageComments,
      page,
      limit,
      total: roots.length,
      hasMore: start + pageRoots.length < roots.length,
    };
  }

  static async toggleLike(idOrSlug, visitorId) {
    if (!visitorId || typeof visitorId !== 'string' || visitorId.length < 16 || visitorId.length > 128) {
      throw new Error('A valid visitor ID is required');
    }

    const blog = await this.getBlogByIdOrSlug(idOrSlug);
    const likedBy = blog.likedBy || [];
    const alreadyLiked = likedBy.includes(visitorId);
    blog.likedBy = alreadyLiked
      ? likedBy.filter((id) => id !== visitorId)
      : [...likedBy, visitorId];
    await blog.save();

    return { likesCount: blog.likedBy.length, liked: !alreadyLiked };
  }

  static async getLikeStatus(idOrSlug, visitorId) {
    const blog = await this.getBlogByIdOrSlug(idOrSlug);
    return {
      likesCount: blog.likedBy?.length || 0,
      liked: Boolean(visitorId && blog.likedBy?.includes(visitorId)),
    };
  }
}
