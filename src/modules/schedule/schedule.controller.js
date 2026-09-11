import { ScheduleService } from './schedule.service.js';
import { ApiResponse } from '../../utils/apiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

export const handleScheduleBooking = asyncHandler(async (req, res) => {
  const booking = await ScheduleService.bookConsultation(req.body);
  res
    .status(201)
    .json(new ApiResponse(201, booking, 'Consultation booked successfully! We look forward to speaking with you.'));
});
