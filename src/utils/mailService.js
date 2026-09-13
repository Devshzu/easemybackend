import nodemailer from 'nodemailer';
import { config } from '../config/env.config.js';
import { logger } from '../config/logger.js';

class MailService {
  constructor() {
    this.transporter = null;
  }

  getTransporter() {
    if (!this.transporter) {
      this.transporter = nodemailer.createTransport({
        host: config.smtp.host,
        port: config.smtp.port,
        secure: config.smtp.secure, // true for 465, false for other ports
        auth: {
          user: config.smtp.user,
          pass: config.smtp.pass
        },
        tls: {
          rejectUnauthorized: false
        }
      });
    }
    return this.transporter;
  }

  /**
   * Send single HTML email
   */
  async sendMail({ to, subject, html, text }) {
    try {
      const transporter = this.getTransporter();
      const info = await transporter.sendMail({
        from: `"EaseMyWeb" <${config.smtp.user}>`,
        to,
        subject,
        html,
        text: text || 'New article from EaseMyWeb'
      });
      logger.info(`Email sent to ${to}: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      logger.error(`Error sending email to ${to}: ${error.message}`);
      throw error;
    }
  }
}

export const mailService = new MailService();
