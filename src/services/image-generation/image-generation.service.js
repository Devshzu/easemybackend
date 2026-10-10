import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { config } from '../../config/env.config.js';
import { logger } from '../../config/logger.js';
import { cloudflareProvider } from './cloudflare.provider.js';
import { optimizePromptForFlux, optimizeSocialPromptForFlux } from './prompt-optimizer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendRoot = path.resolve(__dirname, '../../../');
const publicBlogDir = path.resolve(backendRoot, 'public/blog');
const logoPath = path.resolve(backendRoot, 'public/newlogo.png');

/**
 * Extract and sanitize keywords for image generation
 */
export function extractAndVerifyKeywords(title = '', rawKeywords = []) {
  let list = [];
  if (Array.isArray(rawKeywords)) {
    list = rawKeywords;
  } else if (typeof rawKeywords === 'string') {
    list = rawKeywords.split(/[,|]/);
  }

  const cleaned = list
    .map((k) => String(k).trim())
    .filter((k) => k.length >= 2 && k.length <= 40 && !k.startsWith('http'));

  if (cleaned.length >= 2) {
    return cleaned.slice(0, 4);
  }

  const stopWords = new Set([
    'the', 'is', 'at', 'which', 'on', 'and', 'a', 'to', 'in', 'for', 'of',
    'with', 'about', 'by', 'as', 'an', 'why', 'how', 'what', 'when', 'from',
    'this', 'that', 'into', 'top', 'best', 'guide', 'mastering', 'ultimate'
  ]);

  const words = (title || '')
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .split(/\s+/)
    .map((w) => w.trim())
    .filter((w) => w.length > 2 && !stopWords.has(w.toLowerCase()));

  const fallback = words.slice(0, 4);
  return fallback.length >= 2 ? fallback : ['Technology', 'EaseMyWeb Tech'];
}

function escapeXml(unsafe) {
  if (!unsafe) return '';
  return String(unsafe).replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}

/**
 * Local offline vector canvas fallback when AI credentials are unconfigured in development
 */
export function buildFallbackSvgGraphic(title = '', keywords = [], options = {}) {
  const badgeText = escapeXml(options.badge || (keywords[0] || 'TECH 2026').toUpperCase());
  const badgeWidth = Math.max(badgeText.length * 11 + 42, 140);
  const color1 = '#06b6d4';
  const color2 = '#8b5cf6';
  const color3 = '#38bdf8';

  const clean = (title || 'Technology Innovation').replace(/\s+/g, ' ').trim();
  const words = clean.split(' ');
  const lines = [];
  let cur = '';
  for (const w of words) {
    if ((cur + ' ' + w).trim().length <= 34) {
      cur = (cur + ' ' + w).trim();
    } else {
      if (cur) lines.push(cur);
      cur = w;
      if (lines.length >= 3) break;
    }
  }
  if (cur && lines.length < 4) lines.push(cur);

  const pills = (keywords.length ? keywords : ['Cloudflare AI', 'FLUX.1', 'EaseMyWeb']).slice(0, 3).map((kw, idx) => {
    const x = 125 + (idx * 235);
    const pillColor = idx === 0 ? color1 : (idx === 1 ? color2 : color3);
    return `
      <g transform="translate(${x}, 725)">
        <rect width="215" height="44" rx="22" fill="#0f172a" fill-opacity="0.9" stroke="${pillColor}" stroke-opacity="0.4" stroke-width="1.5" />
        <circle cx="22" cy="22" r="5" fill="${pillColor}" />
        <text x="38" y="27" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="600" fill="#e2e8f0">${escapeXml(String(kw).slice(0, 19))}</text>
      </g>
    `;
  }).join('');

  return `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900" width="1600" height="900">
    <defs>
      <radialGradient id="bg-spot-primary" cx="82%" cy="32%" r="65%">
        <stop offset="0%" stop-color="${color1}" stop-opacity="0.3" />
        <stop offset="60%" stop-color="#020617" stop-opacity="0" />
      </radialGradient>
      <radialGradient id="bg-spot-secondary" cx="25%" cy="85%" r="55%">
        <stop offset="0%" stop-color="${color2}" stop-opacity="0.25" />
        <stop offset="65%" stop-color="#020617" stop-opacity="0" />
      </radialGradient>
      <linearGradient id="card-border-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${color1}" stop-opacity="0.85" />
        <stop offset="45%" stop-color="${color2}" stop-opacity="0.4" />
        <stop offset="100%" stop-color="#1e293b" stop-opacity="0.2" />
      </linearGradient>
      <linearGradient id="title-glow-text" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#ffffff" />
        <stop offset="100%" stop-color="#e0e7ff" />
      </linearGradient>
    </defs>
    <rect width="1600" height="900" fill="#030712" />
    <rect width="1600" height="900" fill="url(#bg-spot-primary)" />
    <rect width="1600" height="900" fill="url(#bg-spot-secondary)" />
    <rect x="75" y="75" width="890" height="750" rx="30" fill="#090d1a" fill-opacity="0.82" stroke="url(#card-border-grad)" stroke-width="1.75" />
    <g transform="translate(125, 135)">
      <rect width="${badgeWidth}" height="40" rx="20" fill="${color1}" fill-opacity="0.18" stroke="${color1}" stroke-opacity="0.75" stroke-width="1.5" />
      <text x="${badgeWidth / 2}" y="25" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="800" letter-spacing="1.5" fill="${color1}">${badgeText}</text>
    </g>
    <g transform="translate(125, 250)">
      ${lines.map((l, i) => `
        <text x="0" y="${i * 70}" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="52" font-weight="800" fill="url(#title-glow-text)" letter-spacing="-1">${escapeXml(l)}</text>
      `).join('')}
    </g>
    <g transform="translate(125, ${250 + (lines.length * 70) + 15})">
      <text x="0" y="22" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="22" font-weight="500" fill="#cbd5e1">Editorial Publication Guide</text>
    </g>
    <g>${pills}</g>
  </svg>
  `;
}

/**
 * Overlay the EaseMyWeb brand logo badge onto an image buffer
 */
export async function overlayLogoOnBuffer(imageBuffer, width = 1600, height = 900) {
  try {
    const logoBuffer = await fs.readFile(logoPath);
    const logoWidth = Math.round(width * 0.16);
    const resizedLogo = await sharp(logoBuffer)
      .resize({ width: logoWidth, fit: 'contain' })
      .toBuffer();

    return await sharp(imageBuffer)
      .resize(width, height, { fit: 'cover' })
      .composite([
        {
          input: resizedLogo,
          top: 40,
          left: width - logoWidth - 50,
        },
      ])
      .webp({ quality: 92 })
      .toBuffer();
  } catch (err) {
    logger.warn(`Could not composite EaseMyWeb logo onto image buffer: ${err.message}`);
    return await sharp(imageBuffer)
      .resize(width, height, { fit: 'cover' })
      .webp({ quality: 90 })
      .toBuffer();
  }
}

/**
 * Core image buffer generator using Cloudflare Workers AI FLUX.1 [schnell]
 * Replaces previous Gemini Flash image generation with superior FLUX visual fidelity.
 *
 * @param {string|Object} optionsOrPrompt - Title/keywords object or string prompt
 * @param {string} [aspectRatio='16:9']
 * @returns {Promise<Buffer>} WebP image buffer
 */
export async function generateImageBuffer(optionsOrPrompt, aspectRatio = '16:9') {
  let title = '';
  let rawKeywords = [];
  let category = 'Technology';
  let promptText = '';

  if (typeof optionsOrPrompt === 'object' && optionsOrPrompt !== null) {
    title = optionsOrPrompt.title || '';
    rawKeywords = optionsOrPrompt.keywords || [];
    category = optionsOrPrompt.category || 'Technology';
    promptText = optionsOrPrompt.promptText || optionsOrPrompt.prompt || optionsOrPrompt.imagePrompt || '';
  } else {
    promptText = String(optionsOrPrompt || '');
    title = promptText.split('.')[0] || '';
  }

  const keywords = extractAndVerifyKeywords(title, rawKeywords);
  logger.info(`Initiating image generation for: "${title.slice(0, 60)}" | Provider: [${config.imageGeneration?.provider || 'cloudflare'}]`);

  // PRIMARY: Cloudflare Workers AI FLUX-1-schnell
  if (cloudflareProvider.isConfigured()) {
    try {
      const fluxPrompt = optimizePromptForFlux({
        title,
        keywords,
        category,
        promptText,
      });

      logger.info(`Generating image with Cloudflare Workers AI FLUX model...`);
      const rawBuffer = await cloudflareProvider.generateImage({
        prompt: fluxPrompt,
        steps: 4,
      });

      // Convert and normalize to target aspect ratio (16:9 = 1600x900)
      return await sharp(rawBuffer)
        .resize(1600, 900, { fit: 'cover' })
        .webp({ quality: 92 })
        .toBuffer();
    } catch (cfErr) {
      logger.error(`Cloudflare Workers AI generation encountered an error: ${cfErr.message}`, cfErr);
      // In production or when credentials exist, re-throw if it was an explicit auth/validation error
      if (cfErr.message.includes('authentication failed') || cfErr.message.includes('bad request')) {
        throw cfErr;
      }
      logger.warn('Falling back to local high-fidelity vector canvas...');
    }
  } else {
    logger.warn('Cloudflare Workers AI credentials not configured in environment. Using local high-fidelity canvas fallback.');
  }

  // FALLBACK: Deterministic local vector canvas (zero external dependencies)
  const fallbackSvg = buildFallbackSvgGraphic(title, keywords, { badge: category.toUpperCase() });
  return await sharp(Buffer.from(fallbackSvg))
    .resize(1600, 900)
    .webp({ quality: 92 })
    .toBuffer();
}

/**
 * Generate, composite with logo, and save image to public storage directory
 *
 * @param {Object|string} imagePromptOrOptions - Article options or prompt
 * @param {Object} [extraOptions]
 * @param {number} [extraOptions.width=1600]
 * @param {number} [extraOptions.height=900]
 * @param {string} [extraOptions.prefix='']
 * @returns {Promise<string>} Public URL of saved image
 */
export async function saveGeneratedImage(imagePromptOrOptions, { width = 1600, height = 900, prefix = '' } = {}) {
  await fs.mkdir(publicBlogDir, { recursive: true });

  const filename = `${prefix ? `${prefix}-` : ''}${Date.now()}-${Math.random().toString(36).slice(2, 8)}.webp`;
  const targetPath = path.join(publicBlogDir, filename);

  const rawBuffer = await generateImageBuffer(imagePromptOrOptions, `${width}:${height}`);
  const finalBuffer = await overlayLogoOnBuffer(rawBuffer, width, height);
  await fs.writeFile(targetPath, finalBuffer);

  logger.info(`Image successfully saved to storage: ${filename} (${finalBuffer.length} bytes)`);
  return `${config.publicBaseUrl}/blog/${filename}`;
}

export default {
  generateImageBuffer,
  saveGeneratedImage,
  overlayLogoOnBuffer,
  extractAndVerifyKeywords,
  buildFallbackSvgGraphic,
};
