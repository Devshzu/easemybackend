import { Router } from 'express';
import healthRoutes from '../modules/health/health.routes.js';
import contactRoutes from '../modules/contact/contact.routes.js';
import newsletterRoutes from '../modules/newsletter/newsletter.routes.js';
import scheduleRoutes from '../modules/schedule/schedule.routes.js';
import authRoutes from '../modules/auth/auth.routes.js';
import blogRoutes from '../modules/blog/blog.routes.js';

const router = Router();

// Version 1 API Routes
router.use('/api/v1/health', healthRoutes);
router.use('/api/v1/contact', contactRoutes);
router.use('/api/v1/newsletter', newsletterRoutes);
router.use('/api/v1/schedule', scheduleRoutes);
router.use('/api/v1/auth', authRoutes);
router.use('/api/v1/blogs', blogRoutes);

// Compatibility endpoints (matching frontend API config defaults)
router.use('/health', healthRoutes);
router.use('/api/contact', contactRoutes);
router.use('/api/blogs', blogRoutes);

export default router;

