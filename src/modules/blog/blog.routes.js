import { Router } from 'express';
import { createBlog, getBlogs, getBlog, getComments, getLikeStatus, toggleLike, updateBlog, deleteBlog, addComment, addReply } from './blog.controller.js';

const router = Router();

// Public / Admin blog listing & single post
router.get('/', getBlogs);
router.get('/:idOrSlug', getBlog);
router.get('/:idOrSlug/comments', getComments);
router.get('/:idOrSlug/likes', getLikeStatus);

// Public blog comment submission
router.post('/:idOrSlug/comments', addComment);
router.post('/:idOrSlug/comments/:parentId/replies', addReply);
router.post('/:idOrSlug/likes', toggleLike);

// Admin blog management
router.post('/', createBlog);
router.put('/:id', updateBlog);
router.delete('/:id', deleteBlog);

export default router;
