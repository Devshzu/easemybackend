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
async function requestGeminiGeneration(promptText, retries = 4) {
  if (!config.blogAutomation.geminiKey) throw new Error('GEMINI_KEY is not configured');

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
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
        if ((response.status === 503 || response.status === 429 || response.status >= 500) && attempt < retries) {
          const delayMs = attempt * 3000;
          logger.warn(`Gemini API returned ${response.status} (High demand/service busy). Retrying attempt ${attempt}/${retries} in ${delayMs / 1000}s...`);
          await new Promise((res) => setTimeout(res, delayMs));
          continue;
        }
        throw new Error(`Gemini API returned ${response.status}: ${errorBody}`);
      }

      const payload = await response.json();
      const rawText = payload.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) throw new Error('Gemini returned empty text candidate');

      const cleanedText = rawText.replace(/^```json\s*|\s*```$/g, '').trim();
      return JSON.parse(cleanedText);
    } catch (err) {
      if (attempt === retries) throw err;
      logger.warn(`Gemini generation request error (attempt ${attempt}/${retries}): ${err.message}. Retrying...`);
      await new Promise((res) => setTimeout(res, attempt * 3000));
    }
  }
}

function buildBlogPrompt(story, category) {
  return `You are the senior editorial content strategist and technology writer for EaseMyWeb.
Your job is to transform a current/trending topic into a high-quality, useful, engaging, deeply informative, and beautifully structured long-form article for a modern digital publication.

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

HOOK REQUIREMENT (CRITICAL):
- Open the article with a genuine "wait, what?" hook rooted in a real, verifiable fact from the source material — a surprising number, an underappreciated mechanism, or a "here's what's actually happening behind this" angle.
- Examples of the TONE (do not copy literally, generate topic-specific versions): "Here's the part most coverage of this is skipping...", "Do you know what actually happens when...", "This sounds small, but here's why it's a bigger deal than the headline suggests..."
- The hook must be built from real information in the Summary/Snippet or general well-known facts about the topic — NEVER invent a shocking stat or claim just for effect. If you don't have a real surprising fact, use a sharp, clear framing question instead of a fabricated one.
- Use this same "explain it like something's being revealed" energy at 1-2 more points in the article (e.g. before a mechanism explanation or a data table), not just in the intro.

==================================================
STRICT CONTENT LENGTH & DATA DEPTH REQUIREMENTS
==================================================
- MINIMUM WORD COUNT: 1000 WORDS. You MUST write a comprehensive long-form article of AT LEAST 1000 words (aim for 1000 to 2000+ words). NEVER generate short, brief, or shallow content!
- HIGH DATA DENSITY & MULTIPLE POINTS: Each section must contain extensive details, multiple analytical points, technical or business context, step-by-step breakdowns, key takeaways, pros & cons, and real-world implications.
- RELEVANT LISTS & TABLES: Incorporate unordered lists (<ul class="blog-list">) with rich bullet points and structured HTML comparison tables (<table class="blog-table">) where applicable. Do NOT omit data or use placeholder text.

==================================================
VISUAL STRUCTURE ELEMENTS (USE WHERE THEY GENUINELY FIT)
==================================================
Beyond plain paragraphs, lists and tables, you have a set of visual/diagram-style HTML components. Pick 2-4 of these per article based on what the TOPIC actually needs — never force one that doesn't fit the content. Do not use every element in every article.

1. SHOCK / DID-YOU-KNOW CALLOUT — for a surprising fact that deserves visual emphasis:
<div class="blog-callout blog-callout-shock">
  <p class="blog-callout-label">Did you know?</p>
  <p class="blog-callout-text">Surprising, real, fact-based statement...</p>
</div>

2. STAT HIGHLIGHT BOX — for a single striking number/metric from the source or well-known data:
<div class="blog-stat-box">
  <span class="blog-stat-number">73%</span>
  <span class="blog-stat-label">Short explanation of what this number means</span>
</div>
You can place 2-3 of these side by side inside a wrapper:
<div class="blog-stat-grid">
  <div class="blog-stat-box">...</div>
  <div class="blog-stat-box">...</div>
</div>

3. PROCESS / FLOW DIAGRAM — for "how X actually works" or step-by-step mechanisms:
<div class="blog-flow">
  <div class="blog-flow-step">
    <span class="blog-flow-number">1</span>
    <div class="blog-flow-content">
      <h4 class="blog-flow-title">Step title</h4>
      <p class="blog-flow-desc">Short explanation</p>
    </div>
  </div>
  <div class="blog-flow-step">
    <span class="blog-flow-number">2</span>
    <div class="blog-flow-content">
      <h4 class="blog-flow-title">Step title</h4>
      <p class="blog-flow-desc">Short explanation</p>
    </div>
  </div>
</div>

4. TIMELINE — for how something evolved over time / a sequence of events:
<div class="blog-timeline">
  <div class="blog-timeline-item">
    <span class="blog-timeline-date">2023</span>
    <div class="blog-timeline-content">
      <h4 class="blog-timeline-title">Event title</h4>
      <p class="blog-timeline-desc">Short explanation</p>
    </div>
  </div>
</div>

5. COMPARISON GRID — for pros/cons, before/after, this-vs-that:
<div class="blog-compare-grid">
  <div class="blog-compare-col blog-compare-pros">
    <h4 class="blog-compare-title">Pros</h4>
    <ul class="blog-list">
      <li class="blog-list-item">Point...</li>
    </ul>
  </div>
  <div class="blog-compare-col blog-compare-cons">
    <h4 class="blog-compare-title">Cons</h4>
    <ul class="blog-list">
      <li class="blog-list-item">Point...</li>
    </ul>
  </div>
</div>

6. KEY TAKEAWAY BOX — one per article, near the end of a major analytical section:
<div class="blog-key-takeaway">
  <h4 class="blog-key-takeaway-title">Key Takeaway</h4>
  <p class="blog-key-takeaway-text">Concise, high-value summary point...</p>
</div>

7. FAQ BLOCK — only if the topic naturally raises reader questions (place near the end):
<div class="blog-faq">
  <div class="blog-faq-item">
    <h4 class="blog-faq-question">Question?</h4>
    <p class="blog-faq-answer">Answer.</p>
  </div>
</div>

RULES FOR THESE ELEMENTS:
- Choose elements based on the CATEGORY and the actual content — e.g. Programming & Web Development often suits a flow diagram or code block; Business & Digital Growth often suits a stat box or comparison grid; AI & Machine Learning often suits "how it works" flow diagrams and shock callouts; Career & Education often suits comparison grids and key takeaways.
- Never fabricate the numbers used in stat boxes or timelines — only use real data from the snippet/source or clearly well-established public facts.
- These elements go INSIDE the relevant <section class="blog-section">, alongside paragraphs — they do not replace paragraphs, they punctuate them.
- Do not overload a single section with more than one visual element.

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
TABLE OF CONTENTS & HEADINGS
==================================================
CRITICAL REQUIREMENT:
Do NOT embed an inline Table of Contents HTML block (<nav>) inside the "content" string!
The website application automatically renders the Table of Contents in the right-hand sticky sidebar by reading your <h2> and <h3> section headings.
- Headings: Organise content logically into 4 to 7 major sections using <h2 class="blog-heading-2" id="..."> and subsections using <h3 class="blog-heading-3" id="...">.
- Table of Contents Array: Populate the separate "tableOfContents" JSON array with objects containing "title" and "id" matching EVERY <h2> and <h3> section heading ID created in the content.

==================================================
FACTUAL ACCURACY & REFERENCES
==================================================
- References: Always populate the "references" JSON array. Include at least the source URL provided above and any other official references or documentation links. Format as objects with "title", "source", and "url".
- Do NOT fabricate quotes, statistics, product specs, URLs, or fake facts.

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
7. List Item: <li class="blog-list-item"><strong>Label:</strong> Detailed explanation and points...</li>
8. ALWAYS put a short introductory <p class="blog-paragraph"> before starting a list. NEVER output plain unformatted text lines or pseudo-bullet points inside generic <p> tags.
9. Blockquote: <blockquote class="blog-blockquote">Key takeaway quote or expert tip...</blockquote>
10. Table: <table class="blog-table"><thead class="blog-thead"><tr class="blog-tr"><th class="blog-th">Header</th></tr></thead><tbody class="blog-tbody"><tr class="blog-tr"><td class="blog-td">Data</td></tr></tbody></table>
11. Code Block: <pre class="blog-code-block"><code class="blog-code">...</code></pre>
12. Visual/diagram elements: use the VISUAL STRUCTURE ELEMENTS defined above (blog-callout, blog-stat-box, blog-flow, blog-timeline, blog-compare-grid, blog-key-takeaway, blog-faq) where they genuinely fit the topic.

==================================================
IMAGE GENERATION PROMPT (HIGH-DEFINITION, RELATABLE & ULTRA-SHARP REQUIREMENT)
==================================================
Create a highly specific, topic-relevant, and visually captivating image generation prompt for this article.
CRITICAL VISUAL RULES:
1. TOPIC RELEVANCE: The scene MUST directly depict the visual subject of the headline "${story.title}".
   - For Career & Education / AI: depict a modern professional developer or student working in a sleek, bright tech office with crystal clear dual monitors, focused expression, high-tech workspace setting.
   - For Tech / Programming: depict sharp, high-contrast modern developer environment with clean IDE code displayed on high-res monitors, professional lighting.
   - For Business / Growth: depict crisp modern tech team in a bright modern glass room with data visualization screen.
2. ULTRA-SHARP CLARITY & HD 4K-8K: Prompt MUST mandate 8k resolution, razor-sharp focus, crisp fine details, high-definition photorealistic 35mm editorial photography, cinematic studio lighting, vivid natural colors, clean high-contrast composition.
3. ABSOLUTELY NO BLUR OR SILHOUETTES: Zero blur, zero motion blur, no dark silhouettes, no out-of-focus background faces, no low resolution, no dark murky lighting.
4. NO TEXT OR LOGOS: Zero rendered words, letters, text overlays, logos, or watermarks.
5. COMPOSITION: 16:9 landscape aspect ratio with sharp foreground focus and clean, relatable environment.

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
  "content": "<article class=\\"blog-article-body\\"><section class=\\"blog-section\\"><p class=\\"blog-paragraph\\">Hook-driven introduction...</p></section><section class=\\"blog-section\\"><h2 class=\\"blog-heading-2\\" id=\\"section-id\\">Section Title</h2><p class=\\"blog-paragraph\\">Detailed section explanation with high data density...</p><ul class=\\"blog-list\\"><li class=\\"blog-list-item\\"><strong>Point 1:</strong> Detailed explanation...</li><li class=\\"blog-list-item\\"><strong>Point 2:</strong> Detailed explanation...</li></ul></section></article>",
  "tableOfContents": [
    { "title": "Section Title", "id": "section-id" },
    { "title": "Another Section", "id": "another-section" }
  ],
  "category": "${category}",
  "readTime": "8 min read",
  "references": [
    {
      "title": "${story.title.replace(/"/g, '\\\\"')}",
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

  // Ensure minimum word count length (validation threshold min 800 words to ensure >= 1000 word content)
  const plainText = article.content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const wordCount = plainText ? plainText.split(' ').length : 0;
  if (wordCount < 800) {
    throw new Error(`Generated article content is too short (${wordCount} words). Article must be at least 1000 words long.`);
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

// 19. IMAGE SAVING WITH TOPIC-SPECIFIC PROMPT & HD FLUX GENERATION
export async function saveImage(imagePrompt, retries = 3) {
  // Enhance prompt for maximum sharpness, 8k detail, cinematic lighting, and clarity
  const enhancedPrompt = `${imagePrompt}, ultra sharp focus, razor sharp details, 8k resolution, photorealistic, cinematic photography, studio lighting, highly relatable, 4k ultra-high-definition, clear depth of field, sharp foreground features, masterpiece`;
  
  const baseUrl = config.blogAutomation.imageBaseUrl.replace(/\/+$/, '');

  logger.info(`Generating HD blog image with prompt: "${enhancedPrompt.slice(0, 120)}..."`);
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      // Use flux model on attempt 1, fallback to turbo model on retries for maximum reliability
      const modelParam = attempt === 1 ? '&model=flux' : '&model=turbo';
      const imageUrl = `${baseUrl}/${encodeURIComponent(enhancedPrompt)}?width=1600&height=900&nologo=true${modelParam}`;

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
        .webp({ quality: 92 })
        .toFile(targetPath);

      return `${config.publicBaseUrl}/blog/${filename}`;
    } catch (err) {
      if (attempt === retries) throw err;
      logger.warn(`Image generation attempt ${attempt}/${retries} failed: ${err.message}. Retrying...`);
      await new Promise((res) => setTimeout(res, 2000));
    }
  }
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
    const retryPrompt = `${buildBlogPrompt(story, category)}\n\nCRITICAL FIX: The previous generation failed validation with error: "${validationErr.message}". Fix this error completely. Generate a comprehensive long-form article of AT LEAST 1000 words. Do NOT include any inline Table of Contents block (<nav>) inside content. Format lists cleanly using <ul><li><strong>Label:</strong> Detail</li></ul>. Return ONLY valid JSON with clean HTML content, non-empty tableOfContents array, matching heading IDs, and ZERO Markdown formatting.`;
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