import { Router } from 'express';
import {
  getPosts,
  getPost,
  generatePost,
  updatePost,
  deletePost,
  regeneratePost,
  approvePost,
  schedulePost,
  getAccounts,
  createAccount,
  updateAccount,
  deleteAccount,
} from './social.controller.js';

const router = Router();

// Social Accounts Configuration Routes (Must precede parametric /:id routes)
router.get('/accounts', getAccounts);
router.post('/accounts', createAccount);
router.patch('/accounts/:id', updateAccount);
router.delete('/accounts/:id', deleteAccount);

// Social Posts Listing
router.get('/', getPosts);
router.get('/posts', getPosts);

// Social Post AI Generation (Supports POST /, POST /posts, POST /generate, POST /posts/generate)
router.post('/', generatePost);
router.post('/posts', generatePost);
router.post('/generate', generatePost);
router.post('/posts/generate', generatePost);

// Single Social Post Management Routes
router.get('/:id', getPost);
router.get('/posts/:id', getPost);

router.patch('/:id', updatePost);
router.patch('/posts/:id', updatePost);

router.delete('/:id', deletePost);
router.delete('/posts/:id', deletePost);

router.post('/:id/regenerate', regeneratePost);
router.post('/posts/:id/regenerate', regeneratePost);

router.post('/:id/approve', approvePost);
router.post('/posts/:id/approve', approvePost);

router.post('/:id/schedule', schedulePost);
router.post('/posts/:id/schedule', schedulePost);

export default router;
