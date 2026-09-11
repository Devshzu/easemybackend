import { HealthService } from './health.service.js';
import { ApiResponse } from '../../utils/apiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

export const getHealth = asyncHandler(async (req, res) => {
  const healthInfo = HealthService.getHealthStatus();
  res.status(200).json(new ApiResponse(200, healthInfo, 'System is healthy'));
});
