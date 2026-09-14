import { Router } from 'express';
import healthRoutes from '../modules/health/health.routes.js';
import contactRoutes from '../modules/contact/contact.routes.js';
import newsletterRoutes from '../modules/newsletter/newsletter.routes.js';
import scheduleRoutes from '../modules/schedule/schedule.routes.js';
import authRoutes from '../modules/auth/auth.routes.js';
import blogRoutes from '../modules/blog/blog.routes.js';
import careerRoutes from '../modules/career/career.routes.js';
import sitemapRoutes from '../modules/sitemap/sitemap.routes.js';

const router = Router();

// Version 1 API Routes
router.use('/api/v1/health', healthRoutes);
router.use('/api/v1/contact', contactRoutes);
router.use('/api/v1/newsletter', newsletterRoutes);
router.use('/api/v1/schedule', scheduleRoutes);
router.use('/api/v1/auth', authRoutes);
router.use('/api/v1/blogs', blogRoutes);
router.use('/api/v1/careers', careerRoutes);
router.use('/api/v1/sitemap', sitemapRoutes);

// Compatibility endpoints (matching frontend API config defaults & BFF proxy)
router.use('/health', healthRoutes);
router.use('/api/contact', contactRoutes);
router.use('/api/blogs', blogRoutes);
router.use('/api/careers', careerRoutes);
router.use('/api/sitemap', sitemapRoutes);
router.use('/api/auth', authRoutes);
router.use('/api/newsletter', newsletterRoutes);
router.use('/api/schedule', scheduleRoutes);
router.use('/auth', authRoutes);

export default router;
