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
      content: data.content,
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
  static async addComment(idOrSlug, { name, message }) {
    if (!message || message.trim().length === 0) {
      throw new Error('Comment message is required');
    }

    const blog = await this.getBlogByIdOrSlug(idOrSlug);
    if (!blog.comments) {
      blog.comments = [];
    }

    blog.comments.push({
      name: name && name.trim() ? name.trim() : 'Anonymous Reader',
      message: message.trim(),
    });

    await blog.save();
    return blog;
  }
}
