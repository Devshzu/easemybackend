import { Router } from 'express';
import { submitContact, getContacts, updateStatus, deleteContact } from './contact.controller.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { contactSchema } from './contact.validation.js';

const router = Router();

// Public contact submission
router.post('/', validate(contactSchema), submitContact);

// Admin contact management
router.get('/', getContacts);
router.patch('/:id/status', updateStatus);
router.delete('/:id', deleteContact);

export default router;
