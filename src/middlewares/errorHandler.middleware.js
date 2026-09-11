import { ApiError } from '../utils/apiError.js';
import { config } from '../config/env.config.js';
import { logger } from '../config/logger.js';

export const errorHandler = (err, req, res, _next) => {
  let error = err;

  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Internal Server Error';
    error = new ApiError(statusCode, message, [], err.stack);
  }

  logger.error(`${req.method} ${req.originalUrl} - ${error.message}`);

  const response = {
    success: false,
    statusCode: error.statusCode,
    message: error.message,
    errors: error.errors || [],
    ...(config.nodeEnv === 'development' && { stack: error.stack })
  };

  return res.status(error.statusCode).json(response);
};
