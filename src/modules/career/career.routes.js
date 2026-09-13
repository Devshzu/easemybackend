import { Router } from 'express';
import multer from 'multer';
import { authMiddleware } from '../../middlewares/auth.middleware.js';
import {
  getPublishedJobs,
  getJobBySlug,
  getCareerCMS,
  submitApplication,
  getAllJobsAdmin,
  getJobByIdAdmin,
  createJobAdmin,
  updateJobAdmin,
  deleteJobAdmin,
  getAllApplicationsAdmin,
  updateApplicationAdmin,
  downloadResumeAdmin,
  getCareerStatsAdmin,
  updateCareerCMSAdmin,
} from './career.controller.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

const router = Router();

// PUBLIC ENDPOINTS
router.get('/jobs', getPublishedJobs);
router.get('/jobs/:slug', getJobBySlug);
router.get('/cms', getCareerCMS);
router.post('/jobs/:jobId/apply', upload.single('resume'), submitApplication);

// ADMIN ENDPOINTS (Protected with authMiddleware)
router.get('/admin/stats', authMiddleware, getCareerStatsAdmin);
router.get('/admin/jobs', authMiddleware, getAllJobsAdmin);
router.get('/admin/jobs/:id', authMiddleware, getJobByIdAdmin);
router.post('/admin/jobs', authMiddleware, createJobAdmin);
router.put('/admin/jobs/:id', authMiddleware, updateJobAdmin);
router.delete('/admin/jobs/:id', authMiddleware, deleteJobAdmin);

router.get('/admin/applications', authMiddleware, getAllApplicationsAdmin);
router.put('/admin/applications/:id', authMiddleware, updateApplicationAdmin);
router.get('/admin/applications/:id/resume', authMiddleware, downloadResumeAdmin);

router.put('/admin/cms', authMiddleware, updateCareerCMSAdmin);

export default router;
