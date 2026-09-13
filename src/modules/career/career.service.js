import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { Job } from './job.model.js';
import { JobApplication } from './jobApplication.model.js';
import { CareerCMS } from './careerCMS.model.js';
import { logger } from '../../config/logger.js';
import { mailService } from '../../utils/mailService.js';
import { getJobApplicationConfirmationEmailHtml } from '../../utils/emailTemplates/jobApplicationConfirmation.template.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const RESUME_UPLOAD_DIR = path.resolve(__dirname, '../../../uploads/resumes');

// Ensure upload directory exists
if (!fs.existsSync(RESUME_UPLOAD_DIR)) {
  fs.mkdirSync(RESUME_UPLOAD_DIR, { recursive: true });
}

export class CareerService {
  /**
   * Helper to generate unique SEO slug
   */
  static async generateUniqueSlug(title, currentJobId = null) {
    let slug = title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/[\s_]+/g, '-')
      .replace(/^-+|-+$/g, '');

    if (!slug) slug = 'job-position';

    let count = 0;
    let uniqueSlug = slug;

    while (true) {
      const existing = await Job.findOne({ slug: uniqueSlug });
      if (!existing || (currentJobId && existing._id.toString() === currentJobId.toString())) {
        break;
      }
      count += 1;
      uniqueSlug = `${slug}-${count}`;
    }

    return uniqueSlug;
  }

  /**
   * PUBLIC: Get list of published jobs with search, filtering, and pagination
   */
  static async getPublishedJobs(queryParams = {}) {
    const {
      page = 1,
      limit = 12,
      search,
      department,
      location,
      employmentType,
    } = queryParams;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(50, parseInt(limit, 10) || 12));
    const skip = (pageNum - 1) * limitNum;

    const query = { status: 'PUBLISHED' };

    if (search) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { title: searchRegex },
        { department: searchRegex },
        { location: searchRegex },
        { description: searchRegex },
        { skills: searchRegex },
      ];
    }

    if (department && department !== 'all') {
      query.department = new RegExp(`^${department.trim()}$`, 'i');
    }

    if (location && location !== 'all') {
      query.location = new RegExp(location.trim(), 'i');
    }

    if (employmentType && employmentType !== 'all') {
      query.employmentType = new RegExp(employmentType.trim(), 'i');
    }

    const [jobs, totalJobs] = await Promise.all([
      Job.find(query)
        .sort({ sortOrder: 1, isFeatured: -1, createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Job.countDocuments(query),
    ]);

    const totalPages = Math.ceil(totalJobs / limitNum) || 1;

    return {
      jobs,
      pagination: {
        total: totalJobs,
        page: pageNum,
        limit: limitNum,
        totalPages,
        hasMore: pageNum < totalPages,
      },
    };
  }

  /**
   * PUBLIC: Get single published job by slug
   */
  static async getJobBySlug(slug) {
    const job = await Job.findOne({ slug: slug.toLowerCase(), status: 'PUBLISHED' }).lean();
    if (!job) {
      throw new Error('Job posting not found or no longer active');
    }
    return job;
  }

  /**
   * PUBLIC: Get Career CMS content
   */
  static async getCareerCMS() {
    let cms = await CareerCMS.findOne().lean();
    if (!cms) {
      cms = await CareerCMS.create({});
      cms = cms.toObject();
    }
    return cms;
  }

  /**
   * PUBLIC: Submit Job Application
   */
  static async submitApplication(jobIdentifier, applicationData, file = null) {
    // Determine job by ID or slug or position string
    let job = null;
    if (jobIdentifier.match(/^[0-9a-fA-F]{24}$/)) {
      job = await Job.findById(jobIdentifier);
    } else {
      job = await Job.findOne({
        $or: [
          { slug: jobIdentifier.toLowerCase() },
          { title: new RegExp(`^${jobIdentifier}$`, 'i') },
        ],
      });
    }

    if (!job) {
      throw new Error('Invalid job position specified');
    }

    if (job.status !== 'PUBLISHED') {
      throw new Error('Applications for this position are currently closed');
    }

    let resumePath = '';
    let resumeOriginalName = '';
    let resumeMimeType = '';

    if (file) {
      const allowedMimes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ];

      const ext = path.extname(file.originalname).toLowerCase();
      const allowedExts = ['.pdf', '.doc', '.docx'];

      if (!allowedMimes.includes(file.mimetype) && !allowedExts.includes(ext)) {
        throw new Error('Invalid resume file type. Allowed formats: PDF, DOC, DOCX');
      }

      if (file.size > 10 * 1024 * 1024) {
        throw new Error('Resume file size must not exceed 10MB');
      }

      const filename = `resume_${Date.now()}_${Math.random().toString(36).substring(2, 8)}${ext}`;
      const destPath = path.join(RESUME_UPLOAD_DIR, filename);

      if (file.buffer) {
        fs.writeFileSync(destPath, file.buffer);
      } else if (file.path) {
        fs.copyFileSync(file.path, destPath);
      }

      resumePath = filename;
      resumeOriginalName = file.originalname;
      resumeMimeType = file.mimetype;
    }

    const application = await JobApplication.create({
      jobId: job._id,
      applicantName: applicationData.applicantName,
      email: applicationData.email.toLowerCase().trim(),
      phone: applicationData.phone.trim(),
      experience: applicationData.experience,
      portfolioUrl: applicationData.portfolioUrl || '',
      coverLetter: applicationData.coverLetter,
      resume: resumePath,
      resumeOriginalName,
      resumeMimeType,
      currentCompany: applicationData.currentCompany || '',
      currentPosition: applicationData.currentPosition || '',
      noticePeriod: applicationData.noticePeriod || '',
      expectedSalary: applicationData.expectedSalary || '',
      linkedinUrl: applicationData.linkedinUrl || '',
      githubUrl: applicationData.githubUrl || '',
      status: 'NEW',
    });

    logger.info(`New application received for position: ${job.title} from ${applicationData.email}`);

    // Send confirmation email to applicant safely
    if (application.email) {
      try {
        const html = getJobApplicationConfirmationEmailHtml({ application, job });
        const subject = `[EaseMyWeb Careers] Application Received - ${job.title}`;
        await mailService.sendMail({ to: application.email, subject, html });
      } catch (mailErr) {
        logger.error(`Failed to send job application email to ${application.email}: ${mailErr.message}`);
      }
    }

    return {
      applicationId: application._id,
      jobTitle: job.title,
      applicantName: application.applicantName,
      submittedAt: application.createdAt,
    };
  }

  /**
   * ADMIN: List all jobs with filters and application counts
   */
  static async getAllJobsAdmin(queryParams = {}) {
    const {
      page = 1,
      limit = 20,
      search,
      status,
      department,
      location,
    } = queryParams;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const query = {};

    if (status && status !== 'all') {
      query.status = status.toUpperCase();
    }

    if (search) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { title: searchRegex },
        { department: searchRegex },
        { location: searchRegex },
        { description: searchRegex },
      ];
    }

    if (department && department !== 'all') {
      query.department = new RegExp(department.trim(), 'i');
    }

    if (location && location !== 'all') {
      query.location = new RegExp(location.trim(), 'i');
    }

    const [jobs, totalJobs] = await Promise.all([
      Job.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Job.countDocuments(query),
    ]);

    // Attach application counts for each job
    const jobIds = jobs.map((j) => j._id);
    const applicationCounts = await JobApplication.aggregate([
      { $match: { jobId: { $in: jobIds } } },
      { $group: { _id: '$jobId', count: { $sum: 1 } } },
    ]);

    const countMap = {};
    applicationCounts.forEach((item) => {
      countMap[item._id.toString()] = item.count;
    });

    const jobsWithCounts = jobs.map((job) => ({
      ...job,
      applicationCount: countMap[job._id.toString()] || 0,
    }));

    const totalPages = Math.ceil(totalJobs / limitNum) || 1;

    return {
      jobs: jobsWithCounts,
      pagination: {
        total: totalJobs,
        page: pageNum,
        limit: limitNum,
        totalPages,
      },
    };
  }

  /**
   * ADMIN: Get complete job data by ID
   */
  static async getJobByIdAdmin(id) {
    const job = await Job.findById(id).lean();
    if (!job) {
      throw new Error('Job posting not found');
    }
    const applicationCount = await JobApplication.countDocuments({ jobId: id });
    return { ...job, applicationCount };
  }

  /**
   * ADMIN: Create job
   */
  static async createJobAdmin(data) {
    const slug = data.slug
      ? await this.generateUniqueSlug(data.slug)
      : await this.generateUniqueSlug(data.title);

    const newJob = await Job.create({
      ...data,
      slug,
    });

    return newJob;
  }

  /**
   * ADMIN: Update job
   */
  static async updateJobAdmin(id, data) {
    const job = await Job.findById(id);
    if (!job) {
      throw new Error('Job posting not found');
    }

    if (data.title && data.title !== job.title && !data.slug) {
      data.slug = await this.generateUniqueSlug(data.title, id);
    } else if (data.slug && data.slug !== job.slug) {
      data.slug = await this.generateUniqueSlug(data.slug, id);
    }

    Object.assign(job, data);
    await job.save();

    return job;
  }

  /**
   * ADMIN: Delete job
   */
  static async deleteJobAdmin(id) {
    const job = await Job.findById(id);
    if (!job) {
      throw new Error('Job posting not found');
    }
    await Job.findByIdAndDelete(id);
    return { message: 'Job deleted successfully' };
  }

  /**
   * ADMIN: Get applications with filters
   */
  static async getAllApplicationsAdmin(queryParams = {}) {
    const {
      page = 1,
      limit = 20,
      search,
      jobId,
      status,
    } = queryParams;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const query = {};

    if (jobId && jobId !== 'all') {
      query.jobId = jobId;
    }

    if (status && status !== 'all') {
      query.status = status.toUpperCase();
    }

    if (search) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { applicantName: searchRegex },
        { email: searchRegex },
        { phone: searchRegex },
        { currentCompany: searchRegex },
      ];
    }

    const [applications, total] = await Promise.all([
      JobApplication.find(query)
        .populate('jobId', 'title department location')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      JobApplication.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / limitNum) || 1;

    return {
      applications,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages,
      },
    };
  }

  /**
   * ADMIN: Update Application Status & Notes
   */
  static async updateApplicationAdmin(id, { status, adminNotes }) {
    const application = await JobApplication.findById(id);
    if (!application) {
      throw new Error('Application not found');
    }

    if (status) application.status = status;
    if (adminNotes !== undefined) application.adminNotes = adminNotes;

    await application.save();
    return application;
  }

  /**
   * ADMIN: Get resume file path for download
   */
  static async getResumeFileAdmin(id) {
    const application = await JobApplication.findById(id);
    if (!application || !application.resume) {
      throw new Error('Resume file not found for this application');
    }

    const filePath = path.join(RESUME_UPLOAD_DIR, application.resume);
    if (!fs.existsSync(filePath)) {
      throw new Error('Resume file on disk not found');
    }

    return {
      filePath,
      originalName: application.resumeOriginalName || application.resume,
      mimeType: application.resumeMimeType || 'application/octet-stream',
    };
  }

  /**
   * ADMIN: Dashboard Career Statistics
   */
  static async getCareerStatsAdmin() {
    const [
      totalJobs,
      publishedJobs,
      closedJobs,
      totalApplications,
      newApplications,
      reviewingApplications,
      shortlistedApplications,
      selectedApplications,
    ] = await Promise.all([
      Job.countDocuments(),
      Job.countDocuments({ status: 'PUBLISHED' }),
      Job.countDocuments({ status: 'CLOSED' }),
      JobApplication.countDocuments(),
      JobApplication.countDocuments({ status: 'NEW' }),
      JobApplication.countDocuments({ status: 'REVIEWING' }),
      JobApplication.countDocuments({ status: 'SHORTLISTED' }),
      JobApplication.countDocuments({ status: 'SELECTED' }),
    ]);

    return {
      totalJobs,
      publishedJobs,
      closedJobs,
      totalApplications,
      newApplications,
      reviewingApplications,
      shortlistedApplications,
      selectedApplications,
    };
  }

  /**
   * ADMIN: Update Career CMS Content
   */
  static async updateCareerCMSAdmin(data) {
    let cms = await CareerCMS.findOne();
    if (!cms) {
      cms = new CareerCMS(data);
    } else {
      Object.assign(cms, data);
    }
    await cms.save();
    return cms;
  }
}
