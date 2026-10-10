import { config } from '../config/env.config.js';
import { logger } from '../config/logger.js';
import sharp from 'sharp';

let nextKeyIndex = 0;

/**
 * Extract, sanitize, and verify keywords for the blog image
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

  // Extract relevant keywords from title if missing or too few
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

function getVibrantColor(c1, c2, fallbackColor) {
  const candidates = [c1, c2].filter(Boolean);
  for (const c of candidates) {
    if (/^#[0-9a-f]{6}$/i.test(c)) {
      const r = parseInt(c.slice(1, 3), 16);
      const g = parseInt(c.slice(3, 5), 16);
      const b = parseInt(c.slice(5, 7), 16);
      const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      if (luma > 70 && luma < 235) return c;
    }
  }
  return fallbackColor;
}

function formatTitleLines(title) {
  const clean = (title || 'Technology Innovation').replace(/\s+/g, ' ').trim();
  const words = clean.split(' ');
  const lines = [];
  const maxChars = clean.length > 70 ? 38 : 34;
  let cur = '';

  for (const w of words) {
    if ((cur + ' ' + w).trim().length <= maxChars) {
      cur = (cur + ' ' + w).trim();
    } else {
      if (cur) lines.push(cur);
      cur = w;
      if (lines.length >= 3) break;
    }
  }
  if (cur && lines.length < 4) lines.push(cur);

  const fontSize = lines.length >= 3 || clean.length > 60 ? 46 : 54;
  const lineHeight = lines.length >= 3 || clean.length > 60 ? 62 : 72;
  return { lines, fontSize, lineHeight };
}

function buildSvgGraphic(title, keywords, design = {}) {
  const color1 = getVibrantColor(design.accentColor, design.primaryColor, '#06b6d4');
  const color2 = getVibrantColor(design.secondaryColor, design.accentColor, '#8b5cf6');
  const color3 = getVibrantColor(design.primaryColor, design.secondaryColor, '#38bdf8');

  const badgeText = escapeXml(design.badge || (keywords[0] || 'TECH 2026').toUpperCase());
  const badgeWidth = Math.max(badgeText.length * 11 + 42, 140);
  const subtitleText = escapeXml(design.subtitle || `${keywords.slice(0, 2).join(' & ')} • Editorial Guide`);
  const { lines, fontSize, lineHeight } = formatTitleLines(title);

  const motif = design.motif || 'nodes';
  let artGraphic = '';

  if (motif === 'circuits') {
    artGraphic = `
      <g stroke="${color1}" stroke-opacity="0.45" stroke-width="2.5" fill="none">
        <path d="M 1040 220 L 1260 220 L 1380 340 L 1540 340" />
        <path d="M 1000 380 L 1180 380 L 1280 480 L 1520 480" />
        <path d="M 1060 550 L 1220 550 L 1340 430 L 1550 430" />
        <path d="M 1020 700 L 1200 700 L 1320 580 L 1540 580" />
        <circle cx="1040" cy="220" r="6" fill="${color1}" />
        <circle cx="1380" cy="340" r="7" fill="${color2}" />
        <circle cx="1540" cy="340" r="5" fill="${color3}" />
        <circle cx="1180" cy="380" r="7" fill="${color1}" />
        <circle cx="1520" cy="480" r="6" fill="${color2}" />
        <circle cx="1340" cy="430" r="8" fill="${color3}" />
        <circle cx="1020" cy="700" r="6" fill="${color1}" />
        <circle cx="1320" cy="580" r="7" fill="${color2}" />
      </g>
      <circle cx="1300" cy="450" r="160" stroke="${color2}" stroke-opacity="0.3" stroke-width="2" stroke-dasharray="10 8" fill="none" />
      <circle cx="1300" cy="450" r="100" stroke="${color1}" stroke-opacity="0.4" stroke-width="2" fill="none" />
      <polygon points="1260,400 1340,400 1370,450 1340,500 1260,500 1230,450" fill="${color1}" fill-opacity="0.15" stroke="${color3}" stroke-width="2" />
    `;
  } else if (motif === 'cubes') {
    artGraphic = `
      <g stroke="${color1}" stroke-opacity="0.6" stroke-width="2" fill="none">
        <g transform="translate(1220, 180)">
          <polygon points="120,0 240,60 120,120 0,60" fill="${color1}" fill-opacity="0.25" stroke="${color1}" />
          <polygon points="0,60 120,120 120,240 0,180" fill="${color2}" fill-opacity="0.35" stroke="${color2}" />
          <polygon points="120,120 240,60 240,180 120,240" fill="${color3}" fill-opacity="0.4" stroke="${color3}" />
        </g>
        <g transform="translate(1080, 420)">
          <polygon points="90,0 180,45 90,90 0,45" fill="${color2}" fill-opacity="0.2" stroke="${color2}" />
          <polygon points="0,45 90,90 90,180 0,135" fill="${color3}" fill-opacity="0.3" stroke="${color3}" />
          <polygon points="90,90 180,45 180,135 90,180" fill="${color1}" fill-opacity="0.35" stroke="${color1}" />
        </g>
        <g transform="translate(1320, 480)">
          <polygon points="80,0 160,40 80,80 0,40" fill="${color3}" fill-opacity="0.25" stroke="${color3}" />
          <polygon points="0,40 80,80 80,160 0,120" fill="${color1}" fill-opacity="0.3" stroke="${color1}" />
          <polygon points="80,80 160,40 160,120 80,160" fill="${color2}" fill-opacity="0.4" stroke="${color2}" />
        </g>
      </g>
    `;
  } else {
    // Futuristic interactive node mesh
    artGraphic = `
      <g stroke-width="2" fill="none">
        <polygon points="1160,200 1440,260 1340,540 1080,440" stroke="${color1}" stroke-opacity="0.4" fill="${color1}" fill-opacity="0.08" />
        <polygon points="1340,540 1540,660 1280,780 1140,620" stroke="${color2}" stroke-opacity="0.45" fill="${color2}" fill-opacity="0.1" />
        <polygon points="1160,200 1380,380 1140,620 1080,440" stroke="${color3}" stroke-opacity="0.35" fill="${color3}" fill-opacity="0.05" />
        
        <circle cx="1160" cy="200" r="9" fill="${color1}" />
        <circle cx="1440" cy="260" r="8" fill="${color3}" />
        <circle cx="1340" cy="540" r="11" fill="${color2}" />
        <circle cx="1080" cy="440" r="7" fill="${color1}" />
        <circle cx="1540" cy="660" r="8" fill="${color3}" />
        <circle cx="1280" cy="780" r="10" fill="${color2}" />
        <circle cx="1140" cy="620" r="8" fill="${color1}" />
        <circle cx="1380" cy="380" r="9" fill="${color3}" />

        <circle cx="1340" cy="540" r="45" stroke="${color2}" stroke-opacity="0.4" stroke-width="1.5" stroke-dasharray="6 6" />
        <circle cx="1160" cy="200" r="35" stroke="${color1}" stroke-opacity="0.3" stroke-width="1.5" stroke-dasharray="4 4" />
      </g>
    `;
  }

  const pills = keywords.slice(0, 3).map((kw, idx) => {
    const x = 125 + (idx * 235);
    const pillColor = idx === 0 ? color1 : (idx === 1 ? color2 : color3);
    return `
      <g transform="translate(${x}, 725)">
        <rect width="215" height="44" rx="22" fill="#0f172a" fill-opacity="0.9" stroke="${pillColor}" stroke-opacity="0.4" stroke-width="1.5" />
        <circle cx="22" cy="22" r="5" fill="${pillColor}" />
        <text x="38" y="27" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="600" fill="#e2e8f0">${escapeXml(kw.slice(0, 19))}</text>
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
      <pattern id="bg-cyber-grid" width="60" height="60" patternUnits="userSpaceOnUse">
        <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#1e293b" stroke-width="0.75" stroke-opacity="0.6" />
      </pattern>
    </defs>

    <!-- Canvas Background -->
    <rect width="1600" height="900" fill="#030712" />
    <rect width="1600" height="900" fill="url(#bg-cyber-grid)" opacity="0.75" />
    <rect width="1600" height="900" fill="url(#bg-spot-primary)" />
    <rect width="1600" height="900" fill="url(#bg-spot-secondary)" />

    <!-- Ambient Glowing Spheres -->
    <circle cx="1320" cy="380" r="300" fill="${color1}" opacity="0.15" filter="blur(65px)" />
    <circle cx="1180" cy="620" r="260" fill="${color2}" opacity="0.12" filter="blur(55px)" />

    <!-- Main Card Container -->
    <rect x="75" y="75" width="890" height="750" rx="30" fill="#090d1a" fill-opacity="0.82" stroke="url(#card-border-grad)" stroke-width="1.75" />

    <!-- Category / Topic Badge -->
    <g transform="translate(125, 135)">
      <rect width="${badgeWidth}" height="40" rx="20" fill="${color1}" fill-opacity="0.18" stroke="${color1}" stroke-opacity="0.75" stroke-width="1.5" />
      <text x="${badgeWidth / 2}" y="25" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="800" letter-spacing="1.5" fill="${color1}">${badgeText}</text>
    </g>

    <!-- Title Lines -->
    <g transform="translate(125, 250)">
      ${lines.map((l, i) => `
        <text x="0" y="${i * lineHeight}" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="${fontSize}" font-weight="800" fill="url(#title-glow-text)" letter-spacing="-1">${escapeXml(l)}</text>
      `).join('')}
    </g>

    <!-- Subtitle -->
    <g transform="translate(125, ${250 + (lines.length * lineHeight) + 15})">
      <text x="0" y="22" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="22" font-weight="500" fill="#cbd5e1">${subtitleText}</text>
    </g>

    <!-- Keyword Pills -->
    <g>
      ${pills}
    </g>

    <!-- Right Side Tech Art -->
    <g id="dynamic-motif">
      ${artGraphic}
    </g>
  </svg>
  `;
}

/**
 * Generate Gemini Image Buffer using low-token Gemini calls, checking title & keywords.
 * Completely eliminates any reliance on external websites!
 *
 * @param {string|object} optionsOrPrompt - Title/keywords object or string prompt
 * @param {string} aspectRatio - Default '16:9'
 * @returns {Promise<Buffer>} WebP image buffer
 */
import { generateImageBuffer as generateCfImageBuffer } from '../services/image-generation/index.js';

export async function generateGeminiImageBuffer(optionsOrPrompt, aspectRatio = '16:9') {
  const provider = config.imageGeneration?.provider || 'cloudflare';

  // When Cloudflare is selected as the provider (default), use Cloudflare Workers AI FLUX model
  if (provider === 'cloudflare') {
    try {
      return await generateCfImageBuffer(optionsOrPrompt, aspectRatio);
    } catch (cfErr) {
      logger.warn(`Cloudflare image generation failed (${cfErr.message}). Evaluating Gemini fallback...`);
    }
  }

  let title = '';
  let rawKeywords = [];
  let category = '';
  let promptText = '';

  if (typeof optionsOrPrompt === 'object' && optionsOrPrompt !== null) {
    title = optionsOrPrompt.title || '';
    rawKeywords = optionsOrPrompt.keywords || [];
    category = optionsOrPrompt.category || '';
    promptText = optionsOrPrompt.promptText || optionsOrPrompt.prompt || optionsOrPrompt.imagePrompt || '';
  } else {
    promptText = String(optionsOrPrompt || '');
    title = promptText.split('.')[0] || '';
  }

  const keywords = extractAndVerifyKeywords(title, rawKeywords);
  logger.info(`Generating fallback blog image based on title: "${title.slice(0, 50)}" | Keywords: [${keywords.join(', ')}]`);

  const keys = config.blogAutomation.geminiKeys.length
    ? config.blogAutomation.geminiKeys
    : (config.blogAutomation.geminiKey ? [config.blogAutomation.geminiKey] : []);

  if (!keys.length) {
    logger.warn('No GEMINI_KEY configured. Generating local vector graphic fallback...');
    const fallbackSvg = buildSvgGraphic(title, keywords, { badge: category.toUpperCase() });
    return await sharp(Buffer.from(fallbackSvg)).resize(1600, 900).webp({ quality: 92 }).toBuffer();
  }

  const startIndex = nextKeyIndex % keys.length;
  const orderedKeys = keys.map((_, i) => keys[(startIndex + i) % keys.length]);
  nextKeyIndex = (startIndex + 1) % keys.length;

  // STRATEGY 1: Gemini Native Multimodal Image Models (Low-token prompt)
  const imageModels = [
    'gemini-3.1-flash-lite-image',
    'gemini-2.5-flash-image',
  ];

  const concisePrompt = title
    ? `Editorial 3D tech graphic for blog "${title.slice(0, 80)}" with themes: ${keywords.slice(0, 3).join(', ')}. Clean 16:9 lighting.`
    : promptText.slice(0, 150);

  let nativeQuotaExceeded = false;
  for (const geminiKey of orderedKeys) {
    if (nativeQuotaExceeded) break;
    for (const model of imageModels) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`;
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: AbortSignal.timeout(4000),
          body: JSON.stringify({
            contents: [{ parts: [{ text: concisePrompt }] }],
            generationConfig: {
              responseModalities: ['IMAGE'],
            },
          }),
        });

        if (response.ok) {
          const payload = await response.json();
          const parts = payload.candidates?.[0]?.content?.parts || [];
          for (const part of parts) {
            if (part.inlineData?.data) {
              logger.info(`Successfully generated native blog image using Gemini model [${model}]`);
              const rawBuf = Buffer.from(part.inlineData.data, 'base64');
              return await sharp(rawBuf).resize(1600, 900, { fit: 'cover' }).webp({ quality: 92 }).toBuffer();
            }
          }
        } else if (response.status === 429) {
          nativeQuotaExceeded = true;
          break;
        }
      } catch (err) {
        // Try next
      }
    }
  }

  // STRATEGY 2: Gemini AI Creative Design Engine (< 200 tokens)
  // If native pixel models are quota-limited (free-tier limit: 0), ask Gemini's fast flash-lite
  // model to design custom visual tokens for the blog's title & keywords.
  logger.info('Using Gemini AI Design Engine for low-token blog image generation...');
  const designPrompt = `Analyze this blog title and keywords, return JSON design tokens for a 1600x900 tech blog banner:
Title: "${title.slice(0, 90)}"
Keywords: ${keywords.slice(0, 3).join(', ')}

Return ONLY JSON:
{
  "badge": "TOPIC BADGE (1-3 words)",
  "subtitle": "Short tagline under 6 words",
  "primaryColor": "#hex (vibrant tech color)",
  "secondaryColor": "#hex (contrasting vibrant color)",
  "accentColor": "#hex (bright accent)",
  "motif": "circuits" | "nodes" | "cubes" | "mesh"
}`;

  for (const geminiKey of orderedKeys) {
    try {
      const textModel = config.blogAutomation.geminiModel || 'gemini-3.5-flash-lite';
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${textModel}:generateContent?key=${geminiKey}`;

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(15000),
        body: JSON.stringify({
          contents: [{ parts: [{ text: designPrompt }] }],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 180,
            responseMimeType: 'application/json',
          },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const rawJson = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
        const design = JSON.parse(rawJson);

        logger.info(`Gemini AI designed banner tokens for "${title.slice(0, 40)}" (Total tokens: ${data.usageMetadata?.totalTokenCount || 'minimal'})`);

        const svgCode = buildSvgGraphic(title, keywords, design);
        const webpBuf = await sharp(Buffer.from(svgCode))
          .resize(1600, 900)
          .webp({ quality: 92 })
          .toBuffer();

        return webpBuf;
      }
    } catch (err) {
      logger.warn(`Gemini AI design attempt failed: ${err.message}. Trying next key...`);
    }
  }

  // STRATEGY 3: Deterministic Local Vector Graphic Canvas (Zero External Websites!)
  logger.info('Rendering deterministic local vector canvas for blog image...');
  const localSvg = buildSvgGraphic(title, keywords, {
    badge: (category || keywords[0] || 'TECH').toUpperCase(),
    subtitle: 'Comprehensive Guide & Editorial Analysis',
    accentColor: '#06b6d4',
    secondaryColor: '#8b5cf6',
    primaryColor: '#3b82f6',
    motif: 'nodes',
  });

  return await sharp(Buffer.from(localSvg))
    .resize(1600, 900)
    .webp({ quality: 92 })
    .toBuffer();
}

export default generateGeminiImageBuffer;
