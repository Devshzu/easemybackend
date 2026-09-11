import { NewsletterService } from './newsletter.service.js';
import { ApiResponse } from '../../utils/apiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

export const handleSubscribe = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const result = await NewsletterService.subscribe(email);
  res
    .status(200)
    .json(new ApiResponse(200, result, 'Successfully subscribed to EaseMyWeb newsletter!'));
});
