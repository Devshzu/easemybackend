import { config } from '../../config/env.config.js';

export function getContactConfirmationEmailHtml(contactData) {
  const frontendUrl = config.frontendUrl.replace(/\/+$/, '');
  const name = contactData.fullName || contactData.name || 'Valued Client';
  const serviceName = contactData.service || 'General Inquiry';
  const subjectText = contactData.subject || 'Website Consultation & Services';
  const messagePreview = contactData.message ? contactData.message.trim() : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Thank You for Contacting EaseMyWeb</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #020617;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #f8fafc;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      background-color: #020617;
      padding: 30px 15px;
      box-sizing: border-box;
    }
    .main-card {
      max-width: 600px;
      margin: 0 auto;
      background-color: #0f172a;
      border: 1px solid #1e293b;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5);
    }
    .header {
      padding: 24px 30px;
      background-color: #020617;
      border-bottom: 1px solid #1e293b;
      text-align: center;
    }
    .brand-title {
      font-size: 22px;
      font-weight: 800;
      color: #ffffff;
      letter-spacing: -0.5px;
      text-decoration: none;
    }
    .brand-accent {
      color: #22c55e;
    }
    .body-content {
      padding: 30px;
    }
    .badge {
      display: inline-block;
      padding: 4px 12px;
      background-color: rgba(6, 182, 212, 0.15);
      border: 1px solid rgba(6, 182, 212, 0.3);
      color: #22d3ee;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      border-radius: 20px;
      margin-bottom: 14px;
    }
    .title {
      font-size: 22px;
      font-weight: 700;
      line-height: 1.3;
      color: #ffffff;
      margin: 0 0 16px 0;
    }
    .paragraph {
      font-size: 15px;
      line-height: 1.6;
      color: #94a3b8;
      margin: 0 0 20px 0;
    }
    .summary-box {
      background-color: #020617;
      border: 1px solid #1e293b;
      border-radius: 12px;
      padding: 18px 20px;
      margin-bottom: 24px;
    }
    .summary-item {
      font-size: 13px;
      color: #cbd5e1;
      margin-bottom: 8px;
    }
    .summary-item:last-child {
      margin-bottom: 0;
    }
    .summary-label {
      color: #64748b;
      font-weight: 600;
    }
    .btn-container {
      text-align: center;
      margin: 28px 0 16px 0;
    }
    .cta-btn {
      display: inline-block;
      padding: 14px 32px;
      background-color: #22c55e;
      color: #ffffff !important;
      font-size: 15px;
      font-weight: 600;
      text-decoration: none;
      border-radius: 10px;
      box-shadow: 0 4px 14px rgba(34, 197, 94, 0.3);
    }
    .footer {
      padding: 24px 30px;
      background-color: #020617;
      border-top: 1px solid #1e293b;
      text-align: center;
      font-size: 12px;
      color: #64748b;
    }
    .footer-link {
      color: #94a3b8;
      text-decoration: underline;
      margin: 0 8px;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="main-card">
      <div class="header">
        <a href="${frontendUrl}" class="brand-title">
          EaseMyWeb<span class="brand-accent">.</span>
        </a>
      </div>
      <div class="body-content">
        <span class="badge">Inquiry Received</span>
        <h1 class="title">We Received Your Message!</h1>
        <p class="paragraph">Hello <strong>${name}</strong>,</p>
        <p class="paragraph">
          Thank you for reaching out to <strong>EaseMyWeb</strong>. We have successfully received your inquiry and our team is already reviewing your details.
        </p>

        <div class="summary-box">
          <div class="summary-item"><span class="summary-label">Service Requested:</span> ${serviceName}</div>
          ${subjectText ? `<div class="summary-item"><span class="summary-label">Subject:</span> ${subjectText}</div>` : ''}
          ${messagePreview ? `<div class="summary-item"><span class="summary-label">Message Preview:</span> "${messagePreview.slice(0, 150)}${messagePreview.length > 150 ? '...' : ''}"</div>` : ''}
        </div>

        <p class="paragraph">
          Our specialist team typically responds within <strong>24 business hours</strong>. If your request requires urgent assistance, feel free to reply directly to this email or visit our website.
        </p>

        <div class="btn-container">
          <a href="${frontendUrl}" class="cta-btn" target="_blank">Explore EaseMyWeb &rarr;</a>
        </div>
      </div>
      <div class="footer">
        <p style="margin: 0 0 8px 0;">
          <a href="${frontendUrl}" class="footer-link">Visit Website</a> &bull; 
          <a href="${frontendUrl}/career" class="footer-link">Careers</a>
        </p>
        <p style="margin: 0;">&copy; ${new Date().getFullYear()} EaseMyWeb. All rights reserved.</p>
      </div>
    </div>
  </div>
</body>
</html>`;
}
