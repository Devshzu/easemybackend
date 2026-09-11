import { AuthService } from './auth.service.js';
import { ApiResponse } from '../../utils/apiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const result = await AuthService.loginAdmin(email, password);
  res.status(200).json(new ApiResponse(200, result, 'Admin authenticated successfully'));
});

