import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Parser from 'rss-parser';
import sharp from 'sharp';
import { Blog } from './blog.model.js';
import { BlogService } from './blog.service.js';
import { config } from '../../config/env.config.js';
import { logger } from '../../config/logger.js';

const parser = new Parser();
const moduleDir = path.dirname(fileURLToPath(import.meta.url));
const publicBlogDir = path.resolve(moduleDir, '../../../public/blog');
const trendsUrl = 'https://news.google.com/rss/search?q=technology+OR+AI+OR+software&hl=en-IN&gl=IN&ceid=IN:en';

async function getTrendingStory() {
  const feed = await parser.parseURL(trendsUrl);
  const story = feed.items.find((item) => item.title && item.link);
  if (!story) throw new Error('No technology trend was found in the news feed');
  return { title: story.title, link: story.link };
}

async function generateArticle(story) {
  if (!config.blogAutomation.geminiKey) throw new Error('GEMINI_KEY is not configured');
  const prompt = `You are EaseMyWeb's tech editor. Turn this current technology headline into a genuinely fun, useful blog post for curious Gen Z readers. Be accurate: label confirmed versus speculation, never invent quotes or facts, and cite the source URL naturally. Avoid cringe slang and filler. Return ONLY valid JSON with keys title, excerpt, content, category, readTime, imagePrompt. Use markdown in content, 700-1000 words, a strong opening hook, short sections, practical takeaways, and a closing question. The imagePrompt must describe a clean editorial illustration with no text, logos, or real people's faces.\n\nHeadline: ${story.title}\nSource: ${story.link}`;
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${config.blogAutomation.geminiModel}:generateContent?key=${config.blogAutomation.geminiKey}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.8, responseMimeType: 'application/json' }
    })
  });
  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Gemini returned ${response.status}: ${errorBody}`);
  }
  const payload = await response.json();
  const text = payload.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Gemini returned no article content');
  return JSON.parse(text.replace(/^```json\s*|\s*```$/g, '').trim());
}

async function saveImage(prompt) {
  const imageUrl = `${config.blogAutomation.imageBaseUrl}${encodeURIComponent(`${prompt}, high quality technology editorial illustration`)}`;
  const response = await fetch(imageUrl);
  if (!response.ok) throw new Error(`Image provider returned ${response.status}`);
  const imageBuffer = Buffer.from(await response.arrayBuffer());
  await fs.mkdir(publicBlogDir, { recursive: true });
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.webp`;
  await sharp(imageBuffer).resize(1600, 900, { fit: 'cover' }).webp({ quality: 82 }).toFile(path.join(publicBlogDir, filename));
  return `${config.publicBaseUrl}/blog/${filename}`;
}

export async function generateAndPublishBlog() {
  const story = await getTrendingStory();
  const article = await generateArticle(story);
  const existing = await Blog.findOne({ title: article.title }).select('_id').lean();
  if (existing) {
    logger.info(`Skipping duplicate automated blog: ${article.title}`);
    return existing;
  }
  const image = await saveImage(article.imagePrompt);
  const blog = await BlogService.createBlog({
    title: article.title,
    excerpt: article.excerpt,
    content: article.content,
    category: article.category || 'Technology',
    readTime: article.readTime || '6 min read',
    image,
    author: 'EaseMyWeb Editorial AI',
    published: true
  });
  logger.info(`Published automated blog: ${blog.slug}`);
  return blog;
}

if (process.argv[1] === fileURLToPath(import.meta.url) && !process.argv.includes('--help')) {
  const { connectDB, disconnectDB } = await import('../../config/db.js');
  await connectDB();
  try {
    await generateAndPublishBlog();
  } finally {
    await disconnectDB();
  }
}