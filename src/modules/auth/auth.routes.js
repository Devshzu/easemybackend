import { Router } from 'express';
import { login } from './auth.controller.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { loginSchema } from './auth.validation.js';

const router = Router();

// Single Admin Authentication Login Endpoint
router.post('/login', validate(loginSchema), login);

export default router;

