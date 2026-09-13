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
const categoryStateFile = path.resolve(publicBlogDir, 'category-state.json');

// 1. BLOG CATEGORIES
export const BLOG_CATEGORIES = [
  'Technology',
  'AI & Machine Learning',
  'Career & Education',
  'Business & Digital Growth',
  'Programming & Web Development',
  'General'
];

// 3. CATEGORY FEEDS
const CATEGORY_FEEDS = {
  'Technology': 'technology OR gadgets OR software',
  'AI & Machine Learning': 'artificial intelligence OR generative AI OR machine learning',
  'Career & Education': 'technology careers OR developer jobs OR education OR skills',
  'Business & Digital Growth': 'startup OR SaaS OR ecommerce OR digital marketing',
  'Programming & Web Development': 'JavaScript OR React OR Next.js OR Node.js OR web development',
  'General': 'technology OR business OR education OR internet OR digital trends'
};

// 2. CATEGORY ROTATION
export async function getNextCategory() {
  let index = 0;
  try {
    const raw = await fs.readFile(categoryStateFile, 'utf8');
    const state = JSON.parse(raw);
    index = Number.isInteger(state.index) && state.index >= 0 ? state.index : 0;
  } catch (error) {
    index = 0;
  }

  const category = BLOG_CATEGORIES[index % BLOG_CATEGORIES.length];
  const nextIndex = (index + 1) % BLOG_CATEGORIES.length;

  try {
    await fs.mkdir(path.dirname(categoryStateFile), { recursive: true });
    await fs.writeFile(
      categoryStateFile,
      JSON.stringify({
        index: nextIndex,
        lastCategory: category,
        updatedAt: new Date().toISOString()
      }, null, 2)
    );
  } catch (err) {
    logger.warn(`Failed to update blog category state file: ${err.message}`);
  }

  return category;
}

// 3. TRENDING TOPIC SELECTION & DUPLICATE PREVENTION
export async function getTrendingStory(category) {
  const query = CATEGORY_FEEDS[category] || CATEGORY_FEEDS.General;
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-IN&gl=IN&ceid=IN:en`;

  const feed = await parser.parseURL(url);
  const stories = (feed.items || []).filter((item) => item.title && item.link);

  if (!stories.length) {
    throw new Error(`No trending stories found for category: ${category}`);
  }

  // Get existing recent titles to avoid duplicates
  let recentBlogs = [];
  try {
    recentBlogs = await Blog.find().select('title slug').sort({ createdAt: -1 }).limit(50).lean();
  } catch (err) {
    logger.warn(`Could not fetch existing blogs for duplicate check: ${err.message}`);
  }
  const existingTitlesLower = new Set(recentBlogs.map((b) => (b.title || '').toLowerCase()));

  // Filter out recent duplicate topics if possible
  const freshStories = stories.filter((s) => !existingTitlesLower.has(s.title.toLowerCase()));
  const candidatePool = freshStories.length > 0 ? freshStories : stories;

  // Select randomly from top 10 candidates to avoid always selecting item 0
  const poolSlice = candidatePool.slice(0, Math.min(candidatePool.length, 10));
  const selected = poolSlice[Math.floor(Math.random() * poolSlice.length)];

  return {
    title: selected.title,
    link: selected.link,
    pubDate: selected.pubDate || selected.isoDate || new Date().toISOString(),
    contentSnippet: selected.contentSnippet || selected.content || ''
  };
}

// 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 22, 23. MAIN AI BLOG GENERATION
async function requestGeminiGeneration(promptText) {
  if (!config.blogAutomation.geminiKey) throw new Error('GEMINI_KEY is not configured');

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${config.blogAutomation.geminiModel}:generateContent?key=${config.blogAutomation.geminiKey}`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: promptText }] }],
        generationConfig: {
          temperature: 0.7,
          responseMimeType: 'application/json'
        }
      })
    }
  );

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Gemini API returned ${response.status}: ${errorBody}`);
  }

  const payload = await response.json();
  const rawText = payload.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) throw new Error('Gemini returned empty text candidate');

  const cleanedText = rawText.replace(/^```json\s*|\s*```$/g, '').trim();
  return JSON.parse(cleanedText);
}

function buildBlogPrompt(story, category) {
  return `You are the senior editorial content strategist and technology writer for EaseMyWeb.
Your job is to transform a current/trending topic into a high-quality, useful, engaging, and beautifully structured article for a modern digital publication.

==================================================
SOURCE INFORMATION
==================================================
Category: ${category}
Headline: ${story.title}
Source URL: ${story.link}
Published Date: ${story.pubDate || 'Recent'}
Summary/Snippet: ${story.contentSnippet || 'N/A'}

==================================================
EDITORIAL OBJECTIVE & AUDIENCE
==================================================
The article must feel written by an experienced human editor, NOT by an AI content generator.
Audience includes Gen Z readers, students, developers, software engineers, technology professionals, entrepreneurs, business owners, digital creators, and everyday tech users.

VOICE & STYLE:
- Modern, natural, human-like, conversational yet professional.
- Clear, confident, informative, engaging, and highly practical.
- Easy to scan with short paragraphs and clear headings.
- Avoid cringe slang, clickbait, repetitive intros/conclusions, corporate buzzwords, generic AI intros ("In today's rapidly evolving world...", "In the ever-changing landscape...", "As we all know...", "Let's dive in...").

==================================================
CATEGORY GUIDANCE
==================================================
Assigned Category: ${category}
You MUST strictly align the article content with this category:

- Technology: Focus on products, platforms, digital tech, emerging tech developments, consumer & industry impact, practical implications, and what readers should know.
- AI & Machine Learning: Explain AI developments clearly. What changed, why it matters, practical applications, limitations, risks, opportunities, and future outlook. Avoid exaggerated hype.
- Career & Education: Focus on skills, jobs, learning, career growth, edtech, certifications, workplace impact, and actionable advice.
- Business & Digital Growth: Focus on startups, SaaS, ecommerce, digital marketing, business tech, growth strategies, market changes, and customer behavior.
- Programming & Web Development: Focus on code, frameworks (React, Next.js, Node.js, etc.), developer tools, APIs, architecture, best practices, releases, productivity. Use clean code snippets only when genuinely useful.
- General: Broad current/trending stories. Explain what happened, why people should care, who is affected, what it means, and what may happen next.

==================================================
NO INLINE TABLE OF CONTENTS IN CONTENT BODY
==================================================
CRITICAL REQUIREMENT:
Do NOT embed a Table of Contents HTML block (<nav>) inside the "content" string!
The website application automatically renders the Table of Contents in the right-hand sticky sidebar by reading your <h2> and <h3> section headings.
Populate the separate "tableOfContents" JSON array with objects containing "title" and "id" matching your <h2> and <h3> section heading IDs.

==================================================
RICH HTML STRUCTURE & CLASSNAME REQUIREMENTS
==================================================
The "content" field MUST be clean, beautifully structured semantic HTML wrapped in an <article class="blog-article-body"> container.
Every major section inside the article MUST be wrapped in a <section class="blog-section"> tag so custom CSS can be targeted easily.

Required HTML Elements with CSS Classnames:
1. Article Container: <article class="blog-article-body">
2. Section Wrapper: Wrap each section in <section class="blog-section">...</section>
3. Main Heading (H2): <h2 class="blog-heading-2" id="heading-id">Section Title</h2>
4. Sub-Heading (H3): <h3 class="blog-heading-3" id="subheading-id">Sub-Section Title</h3>
5. Paragraphs: <p class="blog-paragraph">Write short, punchy paragraphs (2-4 sentences max). Never create long wall-of-text blocks!</p>
6. Unordered List: <ul class="blog-list">
7. List Item: <li class="blog-list-item"><strong>Label:</strong> Detail text...</li>
8. ALWAYS put a short introductory <p class="blog-paragraph"> before starting a list. NEVER output plain unformatted text lines or pseudo-bullet points inside generic <p> tags.
9. Blockquote: <blockquote class="blog-blockquote">Key takeaway quote or expert tip...</blockquote>
10. Table: <table class="blog-table"><thead class="blog-thead"><tr class="blog-tr"><th class="blog-th">Header</th></tr></thead><tbody class="blog-tbody"><tr class="blog-tr"><td class="blog-td">Data</td></tr></tbody></table>
11. Code Block: <pre class="blog-code-block"><code class="blog-code">...</code></pre>

Word count: 700 to 1200 words.

==================================================
FACTUAL ACCURACY & REFERENCES
==================================================
Do NOT fabricate quotes, statistics, product specs, URLs, or fake facts.
References MUST be returned in the separate JSON array. Use the supplied source URL as a reference. Never invent source URLs.

==================================================
IMAGE GENERATION PROMPT
==================================================
Create a topic-specific, highly detailed image generation prompt.
Describe subject, environment, lighting, visual style (cinematic editorial photography or professional editorial illustration), composition (landscape 16:9), mood.
No text, no logos, no watermarks, no generic blue "AI" backgrounds.

==================================================
OUTPUT JSON FORMAT
==================================================
Return ONLY valid JSON matching this exact structure:
{
  "title": "Specific Editorial Article Title",
  "slug": "url-friendly-slug",
  "excerpt": "Short compelling excerpt summary (2-3 sentences)",
  "metaTitle": "SEO-optimized meta title under 60 characters",
  "metaDescription": "Concise SEO meta description",
  "keywords": ["primary SEO keyword", "secondary SEO keyword", "relevant long-tail keyword", "EaseMyWeb", "EaseMyWeb ${category}"],
  "content": "<article class=\"blog-article-body\"><section class=\"blog-section\"><p class=\"blog-paragraph\">Introduction text...</p></section><section class=\"blog-section\"><h2 class=\"blog-heading-2\" id=\"section-id\">Section Title</h2><p class=\"blog-paragraph\">Section explanation...</p><ul class=\"blog-list\"><li class=\"blog-list-item\"><strong>Key Point:</strong> Description...</li></ul></section></article>",
  "tableOfContents": [
    { "title": "Section Title", "id": "section-id" },
    { "title": "Another Section", "id": "another-section" }
  ],
  "category": "${category}",
  "readTime": "6 min read",
  "references": [
    {
      "title": "${story.title.replace(/"/g, '\\"')}",
      "source": "Google News Source",
      "url": "${story.link}"
    }
  ],
  "imagePrompt": "Detailed topic-specific editorial image prompt..."
}`;
}

export async function generateArticle(story, category) {
  const promptText = buildBlogPrompt(story, category);
  const article = await requestGeminiGeneration(promptText);

  // Force backend-assigned category
  article.category = category;
  return article;
}

// 17 & 18. OUTPUT VALIDATION & MARKDOWN ARTIFACT PROTECTION
export function validateGeneratedArticle(article, expectedCategory) {
  if (!article || typeof article !== 'object') {
    throw new Error('Generated article output is not a valid object');
  }

  if (!article.title || typeof article.title !== 'string') {
    throw new Error('Generated article is missing a valid title');
  }

  if (!article.excerpt || typeof article.excerpt !== 'string') {
    throw new Error('Generated article is missing a valid excerpt');
  }

  if (!article.content || typeof article.content !== 'string') {
    throw new Error('Generated article content is invalid or missing');
  }

  if (!article.metaTitle || typeof article.metaTitle !== 'string') {
    throw new Error('Generated article is missing a valid metaTitle');
  }

  if (!article.metaDescription || typeof article.metaDescription !== 'string') {
    throw new Error('Generated article is missing a valid metaDescription');
  }

  if (!Array.isArray(article.keywords) || article.keywords.length === 0 || article.keywords.some((keyword) => typeof keyword !== 'string' || !keyword.trim())) {
    throw new Error('Generated article is missing a valid keywords array');
  }

  // Keep the brand discoverable in every automated article without relying on model output.
  article.keywords = [...new Set([
    ...article.keywords.map((keyword) => keyword.trim()),
    'EaseMyWeb',
    `EaseMyWeb ${expectedCategory}`
  ])];

  // Ensure assigned category match
  if (article.category !== expectedCategory) {
    article.category = expectedCategory;
  }

  // Markdown syntax detection regex (reject raw markdown bold, italic, headings, or links)
  const markdownPatterns = [
    /\*\*[^*]+\*\*/, // **bold**
    /__[^_]+__/, // __bold__
    /^\s*#{1,6}\s+/m, // # Heading
    /\[[^\]]+\]\([^)]+\)/ // [link](url)
  ];

  for (const pattern of markdownPatterns) {
    if (pattern.test(article.content)) {
      throw new Error(`Generated article content contains illegal Markdown syntax matching: ${pattern}`);
    }
  }

  // Ensure HTML structure
  if (!article.content.includes('<article') && !article.content.includes('<p>') && !article.content.includes('<h2')) {
    throw new Error('Generated content does not appear to be valid HTML');
  }

  // Ensure inline Table of Contents is NOT present inside the content string
  if (article.content.includes('table-of-contents')) {
    throw new Error('Generated content contains an inline Table of Contents block inside content. TOC must only be in tableOfContents array.');
  }

  // Ensure tableOfContents array is valid
  if (!Array.isArray(article.tableOfContents) || article.tableOfContents.length === 0) {
    throw new Error('Generated article is missing tableOfContents array');
  }

  if (!Array.isArray(article.references)) {
    article.references = [];
  }

  if (!article.imagePrompt || typeof article.imagePrompt !== 'string') {
    throw new Error('Generated article is missing a valid image prompt');
  }

  return article;
}

// 19. IMAGE SAVING WITH TOPIC-SPECIFIC PROMPT
export async function saveImage(imagePrompt) {
  // Use AI-generated topic-specific imagePrompt without forcing static "technology editorial illustration"
  const formattedPrompt = `${imagePrompt}, high resolution, editorial quality, landscape composition 16:9`;
  const imageUrl = `${config.blogAutomation.imageBaseUrl}${encodeURIComponent(formattedPrompt)}`;

  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`Image provider returned HTTP ${response.status}`);
  }

  const imageBuffer = Buffer.from(await response.arrayBuffer());
  await fs.mkdir(publicBlogDir, { recursive: true });
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.webp`;
  const targetPath = path.join(publicBlogDir, filename);

  await sharp(imageBuffer)
    .resize(1600, 900, { fit: 'cover' })
    .webp({ quality: 82 })
    .toFile(targetPath);

  return `${config.publicBaseUrl}/blog/${filename}`;
}

// 20 & 21. COMPLETE PUBLISH FLOW & DUPLICATE PROTECTION
export async function generateAndPublishBlog() {
  const category = await getNextCategory();
  logger.info(`Starting automated blog generation for category: ${category}`);

  const story = await getTrendingStory(category);
  logger.info(`Selected trending topic for [${category}]: "${story.title}"`);

  // Check duplicate article based on title or slug
  const normalizedTitle = story.title.trim().toLowerCase();
  const existingBlog = await Blog.findOne({
    $or: [
      { title: story.title },
      { title: { $regex: new RegExp(`^${normalizedTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } }
    ]
  }).select('_id title').lean();

  if (existingBlog) {
    logger.info(`Skipping duplicate automated blog topic: "${story.title}"`);
    return existingBlog;
  }

  let article;
  try {
    article = await generateArticle(story, category);
    article = validateGeneratedArticle(article, category);
  } catch (validationErr) {
    logger.warn(`Article validation failed on first try (${validationErr.message}). Retrying once...`);
    const retryPrompt = `${buildBlogPrompt(story, category)}\n\nCRITICAL FIX: The previous generation failed validation with error: "${validationErr.message}". Fix this error completely. Do NOT include any inline Table of Contents block (<nav>) inside content. Format lists cleanly using <ul><li><strong>Label:</strong> Detail</li></ul>. Return ONLY valid JSON with clean HTML content, non-empty tableOfContents array, matching heading IDs, and ZERO Markdown formatting.`;
    const retryRaw = await requestGeminiGeneration(retryPrompt);
    retryRaw.category = category;
    article = validateGeneratedArticle(retryRaw, category);
  }

  const image = await saveImage(article.imagePrompt);

  const blog = await BlogService.createBlog({
    title: article.title,
    slug: article.slug || BlogService.generateSlug(article.title),
    excerpt: article.excerpt,
    metaTitle: article.metaTitle,
    metaDescription: article.metaDescription,
    keywords: article.keywords,
    content: article.content,
    tableOfContents: article.tableOfContents,
    references: article.references,
    category, // Force application-assigned category
    readTime: article.readTime || '6 min read',
    image,
    author: 'EaseMyWeb Editorial AI',
    published: true
  });

  logger.info(`Successfully published automated blog [${category}]: "${blog.title}" (${blog.slug})`);
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