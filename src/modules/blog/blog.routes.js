import { Router } from 'express';
import { createBlog, getBlogs, getBlog, updateBlog, deleteBlog } from './blog.controller.js';

const router = Router();

// Public / Admin blog listing & single post
router.get('/', getBlogs);
router.get('/:idOrSlug', getBlog);

// Admin blog management
router.post('/', createBlog);
router.put('/:id', updateBlog);
router.delete('/:id', deleteBlog);

export default router;
