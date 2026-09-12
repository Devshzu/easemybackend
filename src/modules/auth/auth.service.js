import { Admin } from './admin.model.js';
import { logger } from '../../config/logger.js';

export class AuthService {
  /**
   * Admin Login Service (Single Admin Authentication System)
   */
  static async loginAdmin(email, password) {
    logger.info('Admin authentication login attempt:', email);

    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    const admin = await Admin.findOne({ email: email.toLowerCase().trim() });

    if (!admin || admin.password !== password) {
      throw new Error('Invalid email or password');
    }

    return {
      role: admin.role || 'admin',
      email: admin.email,
      token: `jwt_admin_token_${Date.now()}_easemyweb`,
      authenticatedAt: new Date().toISOString(),
    };
  }
}

