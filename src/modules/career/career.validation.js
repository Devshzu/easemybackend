import { z } from 'zod';

export const createJobSchema = z.object({
  title: z.string().min(2, 'Job title must be at least 2 characters'),
  slug: z.string().optional(),
  department: z.string().min(2, 'Department is required'),
  location: z.string().min(2, 'Location is required'),
  employmentType: z.string().default('Full-time'),
  experience: z.string().min(1, 'Experience requirement is required'),
  salary: z.string().optional(),
  shortDescription: z.string().optional(),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  responsibilities: z.array(z.string()).optional().default([]),
  requirements: z.array(z.string()).optional().default([]),
  qualifications: z.array(z.string()).optional().default([]),
  skills: z.array(z.string()).optional().default([]),
  benefits: z.array(z.string()).optional().default([]),
  openings: z.number().int().min(1).optional().default(1),
  applicationDeadline: z.string().nullable().optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'CLOSED', 'ARCHIVED']).optional().default('PUBLISHED'),
  isFeatured: z.boolean().optional().default(false),
  sortOrder: z.number().optional().default(0),
  icon: z.string().optional().default('Briefcase'),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
});

export const updateJobSchema = createJobSchema.partial();

export const applyJobSchema = z.object({
  applicantName: z.string().min(2, 'Full legal name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().min(7, 'Please enter a valid phone number'),
  experience: z.string().min(1, 'Seniority level is required'),
  portfolioUrl: z.string().optional().default(''),
  coverLetter: z.string().min(20, 'Cover letter must be at least 20 characters'),
  currentCompany: z.string().optional().default(''),
  currentPosition: z.string().optional().default(''),
  noticePeriod: z.string().optional().default(''),
  expectedSalary: z.string().optional().default(''),
  linkedinUrl: z.string().optional().default(''),
  githubUrl: z.string().optional().default(''),
});

export const updateApplicationStatusSchema = z.object({
  status: z.enum(['NEW', 'REVIEWING', 'SHORTLISTED', 'INTERVIEW', 'SELECTED', 'REJECTED', 'WITHDRAWN']),
  adminNotes: z.string().optional(),
});

export const updateCareerCMSSchema = z.object({
  heroTag: z.string().optional(),
  heroTitle: z.string().optional(),
  heroDescription: z.string().optional(),
  cultureTitle: z.string().optional(),
  cultureDescription: z.string().optional(),
  culturePerks: z
    .array(
      z.object({
        title: z.string(),
        description: z.string(),
        icon: z.string().optional(),
      })
    )
    .optional(),
  hiringProcessTitle: z.string().optional(),
  hiringProcessSteps: z
    .array(
      z.object({
        stepNumber: z.number(),
        title: z.string(),
        description: z.string(),
      })
    )
    .optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
});
