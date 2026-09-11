import { z } from 'zod';

export const contactSchema = z.object({
  body: z.object({
    name: z.string().optional(),
    fullName: z.string().optional(),
    email: z.string().email('Invalid email address'),
    phone: z.string().optional(),
    company: z.string().optional(),
    service: z.string().optional(),
    budget: z.string().optional(),
    subject: z.string().optional(),
    message: z.string().min(5, 'Message must be at least 5 characters'),
  }).refine((data) => data.name || data.fullName, {
    message: 'Either name or fullName is required',
    path: ['fullName'],
  }),
});

export const createContactSchema = contactSchema;
export default contactSchema;
