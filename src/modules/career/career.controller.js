import { CareerService } from './career.service.js';
import {
  createJobSchema,
  updateJobSchema,
  applyJobSchema,
  updateApplicationStatusSchema,
  updateCareerCMSSchema,
} from './career.validation.js';

/**
 * PUBLIC: GET /api/v1/careers/jobs
 */
export const getPublishedJobs = async (req, res, next) => {
  try {
    const result = await CareerService.getPublishedJobs(req.query);
    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Published jobs retrieved successfully',
      data: result.jobs,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUBLIC: GET /api/v1/careers/jobs/:slug
 */
export const getJobBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const job = await CareerService.getJobBySlug(slug);
    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Job details retrieved successfully',
      data: job,
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      statusCode: 404,
      message: error.message || 'Job posting not found',
    });
  }
};

/**
 * PUBLIC: GET /api/v1/careers/cms
 */
export const getCareerCMS = async (req, res, next) => {
  try {
    const cms = await CareerService.getCareerCMS();
    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Career page CMS content retrieved successfully',
      data: cms,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUBLIC: POST /api/v1/careers/jobs/:jobId/apply
 */
export const submitApplication = async (req, res, next) => {
  try {
    const { jobId } = req.params;
    const validatedData = applyJobSchema.parse(req.body);

    const result = await CareerService.submitApplication(
      jobId,
      validatedData,
      req.file
    );

    return res.status(201).json({
      success: true,
      statusCode: 201,
      message: 'Application submitted successfully! Our team will review your application.',
      data: result,
    });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: 'Validation failed',
        errors: error.errors,
      });
    }
    return res.status(400).json({
      success: false,
      statusCode: 400,
      message: error.message || 'Failed to submit application',
    });
  }
};

/**
 * ADMIN: GET /api/v1/careers/admin/jobs
 */
export const getAllJobsAdmin = async (req, res, next) => {
  try {
    const result = await CareerService.getAllJobsAdmin(req.query);
    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'All admin jobs retrieved successfully',
      data: result.jobs,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * ADMIN: GET /api/v1/careers/admin/jobs/:id
 */
export const getJobByIdAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;
    const job = await CareerService.getJobByIdAdmin(id);
    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Job details retrieved successfully',
      data: job,
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      statusCode: 404,
      message: error.message || 'Job not found',
    });
  }
};

/**
 * ADMIN: POST /api/v1/careers/admin/jobs
 */
export const createJobAdmin = async (req, res, next) => {
  try {
    const validatedData = createJobSchema.parse(req.body);
    const newJob = await CareerService.createJobAdmin(validatedData);
    return res.status(201).json({
      success: true,
      statusCode: 201,
      message: 'Job created successfully',
      data: newJob,
    });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: 'Validation error',
        errors: error.errors,
      });
    }
    next(error);
  }
};

/**
 * ADMIN: PUT /api/v1/careers/admin/jobs/:id
 */
export const updateJobAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;
    const validatedData = updateJobSchema.parse(req.body);
    const updatedJob = await CareerService.updateJobAdmin(id, validatedData);
    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Job updated successfully',
      data: updatedJob,
    });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: 'Validation error',
        errors: error.errors,
      });
    }
    next(error);
  }
};

/**
 * ADMIN: DELETE /api/v1/careers/admin/jobs/:id
 */
export const deleteJobAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;
    await CareerService.deleteJobAdmin(id);
    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Job deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * ADMIN: GET /api/v1/careers/admin/applications
 */
export const getAllApplicationsAdmin = async (req, res, next) => {
  try {
    const result = await CareerService.getAllApplicationsAdmin(req.query);
    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Applications retrieved successfully',
      data: result.applications,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * ADMIN: PUT /api/v1/careers/admin/applications/:id
 */
export const updateApplicationAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;
    const validatedData = updateApplicationStatusSchema.parse(req.body);
    const updated = await CareerService.updateApplicationAdmin(id, validatedData);
    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Application updated successfully',
      data: updated,
    });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: 'Validation error',
        errors: error.errors,
      });
    }
    next(error);
  }
};

/**
 * ADMIN: GET /api/v1/careers/admin/applications/:id/resume
 */
export const downloadResumeAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;
    const fileInfo = await CareerService.getResumeFileAdmin(id);

    res.setHeader('Content-Type', fileInfo.mimeType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${encodeURIComponent(fileInfo.originalName)}"`
    );
    return res.sendFile(fileInfo.filePath);
  } catch (error) {
    return res.status(404).json({
      success: false,
      statusCode: 404,
      message: error.message || 'Resume file not found',
    });
  }
};

/**
 * ADMIN: GET /api/v1/careers/admin/stats
 */
export const getCareerStatsAdmin = async (req, res, next) => {
  try {
    const stats = await CareerService.getCareerStatsAdmin();
    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Career stats retrieved successfully',
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * ADMIN: PUT /api/v1/careers/admin/cms
 */
export const updateCareerCMSAdmin = async (req, res, next) => {
  try {
    const validatedData = updateCareerCMSSchema.parse(req.body);
    const cms = await CareerService.updateCareerCMSAdmin(validatedData);
    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Career page CMS content updated successfully',
      data: cms,
    });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: 'Validation error',
        errors: error.errors,
      });
    }
    next(error);
  }
};
