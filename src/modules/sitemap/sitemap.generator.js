import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Blog } from '../blog/blog.model.js';
import { logger } from '../../config/logger.js';

const moduleDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(moduleDir, '../../../');
const defaultOutputFile = path.resolve(projectRoot, 'public/sitemap.xml');
const defaultBaseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.PUBLIC_BASE_URL || 'https://easemyweb.in';

export const STATIC_SITEMAP_PATHS = [
  '/',
  '/services',
  '/about',
  '/contact',
  '/pricing',
  '/blog',
  '/career',
  '/privacy-policy',
  '/industry-we-serve',
  '/agriculture',
  '/api-integration',
  '/brand-identity',
  '/ecommerce',
  '/edutech',
  '/events',
  '/finance',
  '/graphic-design',
  '/healthcare',
  '/ios-development',
  '/logistics',
  '/mobile-development',
  '/real-estate',
  '/restaurent',
  '/saas',
  '/social-media',
  '/travel',
  '/ui-ux',
  '/web-design',
  '/web-development',
];

export function normalizeSiteUrl(value = defaultBaseUrl) {
  return String(value || defaultBaseUrl).replace(/\/+$/, '');
}

export function buildSitemapXml(urls = []) {
  const uniqueUrls = [...new Set(urls.filter(Boolean))];
  const xmlItems = uniqueUrls
    .map((url) => {
      const normalizedUrl = String(url).trim();
      const priority = normalizedUrl === `${normalizeSiteUrl()}/` ? '1.0' : '0.7';
      return `  <url><loc>${normalizedUrl}</loc><priority>${priority}</priority></url>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${xmlItems}\n</urlset>\n`;
}

export async function getSitemapUrls(baseUrl = defaultBaseUrl) {
  const siteUrl = normalizeSiteUrl(baseUrl);
  const urls = STATIC_SITEMAP_PATHS.map((pathToPage) => `${siteUrl}${pathToPage}`);

  let blogUrls = [];
  try {
    blogUrls = await Blog.find({ published: true })
      .select('slug')
      .sort({ createdAt: -1 })
      .lean();
  } catch (error) {
    logger.warn(`Sitemap generation could not load articles: ${error.message}`);
  }

  blogUrls.forEach((blog) => {
    if (blog && blog.slug) {
      urls.push(`${siteUrl}/blog/${blog.slug}`);
    }
  });

  return [...new Set(urls)];
}

export async function generateAndWriteSitemap({
  baseUrl = defaultBaseUrl,
  outputFile = defaultOutputFile,
} = {}) {
  const urls = await getSitemapUrls(baseUrl);
  const xml = buildSitemapXml(urls);

  try {
    await fs.mkdir(path.dirname(outputFile), { recursive: true });
    await fs.writeFile(outputFile, xml, 'utf8');
    logger.info(`Sitemap generated at ${outputFile} with ${urls.length} URLs`);
    return {
      generatedAt: new Date().toISOString(),
      urlCount: urls.length,
      outputFile,
      urls,
    };
  } catch (error) {
    logger.error(`Failed to write sitemap: ${error.message}`);
    throw error;
  }
}

export async function runSitemapGenerator() {
  return generateAndWriteSitemap();
}

if (process.argv[1] && process.argv[1].includes('sitemap.generator.js')) {
  runSitemapGenerator()
    .then((result) => {
      console.log(`Sitemap generated successfully: ${result.urlCount} URLs`);
    })
    .catch((error) => {
      console.error('Sitemap generator failed:', error);
      process.exitCode = 1;
    });
}
