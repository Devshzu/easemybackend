import { Router } from 'express';
import { handleSubscribe } from './newsletter.controller.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { subscribeNewsletterSchema } from './newsletter.validation.js';

const router = Router();

router.post('/subscribe', validate(subscribeNewsletterSchema), handleSubscribe);

export default router;
