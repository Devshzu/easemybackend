import { Router } from 'express';
import { handleScheduleBooking } from './schedule.controller.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { createScheduleSchema } from './schedule.validation.js';

const router = Router();

router.post('/', validate(createScheduleSchema), handleScheduleBooking);

export default router;
