import { config } from '../../config/env.config.js';

export function getBlogNotificationEmailHtml({ blog, unsubscribeToken }) {
  const frontendUrl = config.frontendUrl.replace(/\/+$/, '');
  const blogUrl = `${frontendUrl}/blog/${blog.slug}`;
  const unsubscribeUrl = `${config.publicBaseUrl}/api/v1/newsletter/unsubscribe?token=${unsubscribeToken}`;
  const logoUrl = 'https://easemyweb.in/logo.png'; // Or website brand banner

  const categoryName = blog.category || 'Tech & Growth';
  const rawExcerpt = blog.excerpt || 'Discover our latest insights, tech trends, and digital growth strategies on EaseMyWeb.';
  const imageTag = blog.image
    ? `<div style="text-align: center; margin-bottom: 24px;">
        <img src="${blog.image}" alt="${blog.title}" style="max-width: 100%; height: auto; border-radius: 12px; border: 1px solid #1e293b; display: block; margin: 0 auto; object-fit: cover; max-height: 320px;" />
       </div>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${blog.title} - EaseMyWeb</title>
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
    .category-badge {
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
    .article-title {
      font-size: 22px;
      font-weight: 700;
      line-height: 1.3;
      color: #ffffff;
      margin: 0 0 16px 0;
    }
    .article-excerpt {
      font-size: 15px;
      line-height: 1.6;
      color: #94a3b8;
      margin: 0 0 26px 0;
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
      transition: background-color 0.2s ease;
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
    .footer-links {
      margin-bottom: 12px;
    }
    .footer-link {
      color: #94a3b8;
      text-decoration: underline;
      margin: 0 8px;
    }
    .unsubscribe-link {
      color: #64748b;
      text-decoration: underline;
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
        <span class="category-badge">${categoryName}</span>
        <h1 class="article-title">${blog.title}</h1>
        ${imageTag}
        <p class="article-excerpt">${rawExcerpt}</p>
        <div class="btn-container">
          <a href="${blogUrl}" class="cta-btn" target="_blank">Read Full Article &rarr;</a>
        </div>
      </div>
      <div class="footer">
        <div class="footer-links">
          <a href="${frontendUrl}" class="footer-link">Visit Website</a> &bull; 
          <a href="${frontendUrl}/blog" class="footer-link">All Articles</a>
        </div>
        <p style="margin: 6px 0;">You received this email because you subscribed to EaseMyWeb Blog Updates.</p>
        <p style="margin: 6px 0;">
          <a href="${unsubscribeUrl}" class="unsubscribe-link" target="_blank">Unsubscribe from these emails</a>
        </p>
      </div>
    </div>
  </div>
</body>
</html>`;
}
