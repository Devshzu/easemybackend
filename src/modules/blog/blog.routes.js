import { Router } from 'express';
import { createBlog, getBlogs, getBlog, updateBlog, deleteBlog, addComment } from './blog.controller.js';

const router = Router();

// Public / Admin blog listing & single post
router.get('/', getBlogs);
router.get('/:idOrSlug', getBlog);

// Public blog comment submission
router.post('/:idOrSlug/comments', addComment);

// Admin blog management
router.post('/', createBlog);
router.put('/:id', updateBlog);
router.delete('/:id', deleteBlog);

export default router;
