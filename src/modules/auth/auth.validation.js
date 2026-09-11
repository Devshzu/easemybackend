import { z } from 'zod';

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid admin email address'),
    password: z.string().min(6, 'Admin password must be at least 6 characters')
  })
});

