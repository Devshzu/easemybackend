import { logger } from '../../config/logger.js';

export class AuthService {
  /**
   * Admin Login Service (Single Admin Authentication System)
   */
  static async loginAdmin(email, _password) {
    logger.info('Admin authentication login attempt:', email);
    return {
      role: 'admin',
      email,
      token: 'jwt_admin_token_session',
      authenticatedAt: new Date().toISOString()
    };
  }
}

