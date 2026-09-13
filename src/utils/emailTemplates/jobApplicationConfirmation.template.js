import { config } from '../../config/env.config.js';

export function getJobApplicationConfirmationEmailHtml({ application, job }) {
  const frontendUrl = config.frontendUrl.replace(/\/+$/, '');
  const applicantName = application.applicantName || 'Applicant';
  const jobTitle = job?.title || 'Open Position';
  const department = job?.department || 'Engineering & Growth';
  const location = job?.location || 'Remote / Hybrid';
  const dateFormatted = new Date(application.createdAt || Date.now()).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Application Received - ${jobTitle}</title>
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
      background-color: rgba(34, 197, 94, 0.15);
      border: 1px solid rgba(34, 197, 94, 0.3);
      color: #4ade80;
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
    .details-box {
      background-color: #020617;
      border: 1px solid #1e293b;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 24px;
    }
    .detail-row {
      display: flex;
      justify-content: space-between;
      font-size: 13px;
      padding: 6px 0;
      border-bottom: 1px solid #1e293b;
    }
    .detail-row:last-child {
      border-bottom: none;
      padding-bottom: 0;
    }
    .detail-row:first-child {
      padding-top: 0;
    }
    .detail-label {
      color: #64748b;
      font-weight: 600;
    }
    .detail-value {
      color: #f8fafc;
      font-weight: 500;
      text-align: right;
    }
    .steps-container {
      margin-top: 20px;
      margin-bottom: 24px;
    }
    .step-item {
      font-size: 14px;
      color: #cbd5e1;
      margin-bottom: 10px;
      line-height: 1.5;
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
        <span class="badge">Application Confirmed</span>
        <h1 class="title">We Received Your Application!</h1>
        <p class="paragraph">Dear <strong>${applicantName}</strong>,</p>
        <p class="paragraph">
          Thank you for applying for a career opportunity with <strong>EaseMyWeb</strong>. We have successfully received your job application and candidate profile.
        </p>

        <div class="details-box">
          <div class="detail-row">
            <span class="detail-label">Position Applied:</span>
            <span class="detail-value" style="color: #22d3ee; font-weight: 700;">${jobTitle}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Department:</span>
            <span class="detail-value">${department}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Location:</span>
            <span class="detail-value">${location}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Date Submitted:</span>
            <span class="detail-value">${dateFormatted}</span>
          </div>
        </div>

        <h3 style="font-size: 15px; color: #ffffff; margin-bottom: 10px;">What Happens Next?</h3>
        <div class="steps-container">
          <div class="step-item">&bull; <strong>Resume Review:</strong> Our talent acquisition team will carefully review your qualifications and experience.</div>
          <div class="step-item">&bull; <strong>Interview Screening:</strong> If your background matches the requirements for ${jobTitle}, we will reach out via email or phone to schedule an initial discussion.</div>
        </div>

        <div class="btn-container">
          <a href="${frontendUrl}/career" class="cta-btn" target="_blank">View Career Portal &rarr;</a>
        </div>
      </div>
      <div class="footer">
        <p style="margin: 0 0 8px 0;">
          <a href="${frontendUrl}" class="footer-link">EaseMyWeb Home</a> &bull; 
          <a href="${frontendUrl}/career" class="footer-link">All Open Roles</a>
        </p>
        <p style="margin: 0;">&copy; ${new Date().getFullYear()} EaseMyWeb Careers. All rights reserved.</p>
      </div>
    </div>
  </div>
</body>
</html>`;
}
