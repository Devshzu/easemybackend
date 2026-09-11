import { ApiError } from '../utils/apiError.js';

/**
 * Validate incoming request schema using Zod
 * @param {import('zod').ZodSchema} schema 
 */
export const validate = (schema) => (req, res, next) => {
  try {
    const parsed = schema.parse({
      body: req.body,
      query: req.query,
      params: req.params
    });

    // Assign sanitized data back to req
    if (parsed.body) req.body = parsed.body;
    if (parsed.query) req.query = parsed.query;
    if (parsed.params) req.params = parsed.params;

    return next();
  } catch (error) {
    if (error.errors) {
      const formattedErrors = error.errors.map((err) => ({
        field: err.path.slice(1).join('.'),
        message: err.message
      }));
      return next(new ApiError(400, 'Validation Error', formattedErrors));
    }
    return next(new ApiError(400, error.message || 'Invalid Request Data'));
  }
};
