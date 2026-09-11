import { logger } from '../../config/logger.js';

export class ScheduleService {
  static async bookConsultation(scheduleData) {
    logger.info('Booking consultation request:', scheduleData);
    return {
      bookingId: `BK-${Math.floor(100000 + Math.random() * 900000)}`,
      status: 'CONFIRMED',
      ...scheduleData,
      createdAt: new Date().toISOString()
    };
  }
}
