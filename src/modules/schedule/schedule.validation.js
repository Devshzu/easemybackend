import { z } from 'zod';

export const createScheduleSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    phone: z.string().min(5, 'Phone number must be at least 5 digits'),
    date: z.string().min(1, 'Date is required'),
    timeSlot: z.string().min(1, 'Time slot is required'),
    note: z.string().optional()
  })
});
