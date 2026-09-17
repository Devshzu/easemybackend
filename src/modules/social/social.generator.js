import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { SocialPost } from './social.model.js';
import { config } from '../../config/env.config.js';
import { logger } from '../../config/logger.js';
import { generateGeminiImageBuffer } from '../../utils/geminiImage.js';

const moduleDir = path.dirname(fileURLToPath(import.meta.url));
const publicStorageDir = path.resolve(moduleDir, '../../../public/blog');

export const SOCIAL_CATEGORIES = [
  'technology',
  'ai',
  'software_development',
  'web_development',
  'programming',
  'startup',
  'business',
  'innovation',
  'future_technology',
  'developer_life',
  'career',
  'productivity',
  'corporate',
  'industry_insights',
  'trending',
  'memes',
  'technology_memes',
  'festival',
  'seasonal',
  'company',
  'educational',
  'thought_leadership',
];

/**
 * Detect current festivals / seasonal events based on date context
 */
export function detectCurrentFestival(date = new Date()) {
  const month = date.getMonth() + 1; // 1-indexed
  const day = date.getDate();

  // Known date-specific tech / global awareness days
  if (month === 9 && day >= 10 && day <= 15) {
    return { name: "Programmer's Day", type: 'technology' };
  }
  if (month === 10 && day === 15) {
    return { name: "World Students' Day", type: 'education' };
  }
  if (month === 3 && day === 8) {
    return { name: "International Women's Day in Tech", type: 'diversity' };
  }
  if (month === 6 && day === 5) {
    return { name: 'World Environment Day & Green Tech', type: 'seasonal' };
  }
  if (month === 12 && day >= 20) {
    return { name: 'New Year & Year-End Tech Reflection', type: 'seasonal' };
  }
  if (month === 1 && day === 1) {
    return { name: 'New Year Tech Goals', type: 'seasonal' };
  }
  if (month === 10 || month === 11) {
    // Festive season (Diwali / Autumn celebrations)
    return { name: 'Festival of Innovation & Lights', type: 'festival' };
  }
  return null;
}

/**
 * Intelligent category selection & rotation
 */
export async function getNextSocialCategory(blogCategory = 'Technology') {
  const categoryMap = {
    'Technology': 'technology',
    'AI & Machine Learning': 'ai',
    'Career & Education': 'career',
    'Business & Digital Growth': 'business',
    'Programming & Web Development': 'web_development',
    'General': 'trending',
  };

  const festival = detectCurrentFestival();
  if (festival && Math.random() < 0.3) {
    return 'festival';
  }

  // 15% probability of meme content
  if (Math.random() < 0.15) {
    return 'memes';
  }

  return categoryMap[blogCategory] || 'technology';
}

/**
 * Gemini API Key Rotator & Request Handler
 */
let nextGeminiKeyIndex = 0;

async function requestGeminiSocialGeneration(promptText, retries = 3) {
  const keys = config.blogAutomation.geminiKeys.length
    ? config.blogAutomation.geminiKeys
    : (config.blogAutomation.geminiKey ? [config.blogAutomation.geminiKey] : []);
  if (!keys.length) throw new Error('GEMINI_KEY or GEMINI_KEYS is not configured');

  const firstKeyIndex = nextGeminiKeyIndex % keys.length;
  const orderedKeyIndexes = keys.map((_, offset) => (firstKeyIndex + offset) % keys.length);
  nextGeminiKeyIndex = (firstKeyIndex + 1) % keys.length;

  for (const keyIndex of orderedKeyIndexes) {
    const geminiKey = keys[keyIndex];

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${config.blogAutomation.geminiModel}:generateContent?key=${geminiKey}`,
          {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            signal: AbortSignal.timeout(config.blogAutomation.geminiRequestTimeoutMs),
            body: JSON.stringify({
              contents: [{ role: 'user', parts: [{ text: promptText }] }],
              generationConfig: {
                temperature: 0.75,
                responseMimeType: 'application/json',
              },
            }),
          }
        );

        if (!response.ok) {
          const errorBody = await response.text();
          const isQuotaExceeded =
            response.status === 429 &&
            /GenerateRequestsPerDayPerProject|daily quota|quota exceeded/i.test(errorBody);

          if (isQuotaExceeded) {
            const quotaErr = new Error(`Gemini API quota exhausted for key ${keyIndex + 1}/${keys.length}`);
            quotaErr.rotateKey = true;
            throw quotaErr;
          }

          if ((response.status === 503 || response.status >= 500 || response.status === 429) && attempt < retries) {
            await new Promise((res) => setTimeout(res, attempt * 2000));
            continue;
          }
          throw new Error(`Gemini API returned ${response.status}: ${errorBody}`);
        }

        const payload = await response.json();
        const rawText = payload.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!rawText) throw new Error('Gemini returned empty text candidate for LinkedIn post');

        const cleanedText = rawText.replace(/^```json\s*|\s*```$/g, '').trim();
        return JSON.parse(cleanedText);
      } catch (err) {
        if (err.rotateKey) {
          logger.warn(`Gemini key ${keyIndex + 1}/${keys.length} quota exhausted. Trying next key.`);
          break;
        }
        if (attempt === retries) throw err;
        await new Promise((res) => setTimeout(res, attempt * 2000));
      }
    }
  }

  throw new Error(`All ${keys.length} Gemini API keys failed or exhausted quota.`);
}

/**
 * System Prompt Builder for LinkedIn Post
 */
export function buildLinkedInPrompt({ blog, topic, category, generationType, festivalInfo }) {
  const storyTitle = blog?.title || topic || 'Modern Web Development and AI';
  const storyExcerpt = blog?.excerpt || 'Insights on tech innovation and software engineering.';
  const storyReferences = blog?.references || [];

  return `You are the chief social media strategist and tech brand voice for EaseMyWeb.
Your mission is to generate a high-performing, original, human-like LinkedIn post inspired by current tech trends and the provided topic.

==================================================
INPUT CONTEXT
==================================================
Topic / Headline: ${storyTitle}
Summary / Excerpt: ${storyExcerpt}
Category: ${category || 'technology'}
Generation Type: ${generationType || 'BLOG_RELATED'}
${festivalInfo ? `Current Festival / Occasion: ${festivalInfo.name}` : ''}
${storyReferences.length ? `Reference Sources: ${JSON.stringify(storyReferences)}` : ''}

==================================================
AUDIENCE & BRAND VOICE
==================================================
Audience: Developers, software engineers, tech students, startup founders, digital marketers, product managers, and tech-curious professionals.
Brand Tone: Human, modern, engaging, intelligent, conversational, Gen-Z friendly where appropriate, zero corporate jargon ("synergy", "paradigm shift").

==================================================
LINKEDIN POST FORMATTING RULES (CRITICAL)
==================================================
1. PLAIN TEXT ONLY: Do NOT use markdown bold (**word** or __word__), markdown italics (*word*), HTML tags, or markdown headers (# Heading).
2. STRUCTURE & SCANNABILITY: Use short paragraphs (1-3 sentences max), plenty of line breaks, whitespace, clear bullet points (using standard unicode bullets like "•" or "-"), and numbered lists.
3. LENGTH: Total post content MUST be between 500 and 1,300 characters. Concise, impactful, and easy to skim.
4. HOOK: Open with a powerful 1-2 line hook that peaks curiosity immediately without cheap clickbait.
5. HASHTAGS: Provide 3 to 7 highly relevant hashtags in the "hashtags" array (e.g., ["#AI", "#SoftwareDevelopment", "#WebDevelopment", "#TechTrends"]). Do NOT overload the post with 20 hashtags.
6. NO FAKE CLAIMS: Never manufacture fake news, fake statistics, fake quotes, or fake URLs.
7. EASEMYWEB CONNECTION: When natural, frame the practical insight around modern web apps, automation, or custom software development.

==================================================
IMAGE PROMPT SPECIFICATION (FOR LINKEDIN POST GRAPHIC)
==================================================
Create a detailed visual prompt for a 1200x627 landscape professional LinkedIn infographic & feature banner.
- Visual Format: High-impact corporate LinkedIn feature graphic, modern 3D animated tech illustration style with clean infographic card layout.
- Subject: Modern developer or tech creator character alongside sleek laptops, 3D cloud nodes, AI model badges, and growth charts inspired by "${storyTitle}".
- Typography & Badges: Clean visual space for headline overlay, key takeaways callout cards, and top-left corner area reserved for the EaseMyWeb.in logo emblem.
- Visual Quality: Razor sharp 8k resolution, volumetric lighting, rich vibrant brand colors (cyan, deep blue, crisp white), 3D glossy textures, zero distorted features, highly professional LinkedIn post visual aesthetic.

==================================================
OUTPUT JSON STRUCTURE
==================================================
Return ONLY valid JSON matching this exact structure:
{
  "category": "${category || 'technology'}",
  "generationType": "${generationType || 'BLOG_RELATED'}",
  "topic": "${storyTitle.replace(/"/g, '\\"')}",
  "hook": "Strong opening hook...",
  "content": "Full plain-text LinkedIn post content here without any markdown bold or italic syntax...",
  "hashtags": ["#AI", "#Tech", "#WebDev", "#EaseMyWeb"],
  "imagePrompt": "Professional LinkedIn infographic banner prompt for ${storyTitle.replace(/"/g, '\\"')}, 3D animated tech illustration with key takeaway callouts and EaseMyWeb brand aesthetics...",
  "sources": ${JSON.stringify(storyReferences.length ? storyReferences.map(r => ({ title: r.title, url: r.url })) : [])}
}`;
}

/**
 * Validation for generated LinkedIn post object
 */
export function validateGeneratedSocialPost(post, expectedCategory) {
  if (!post || typeof post !== 'object') {
    throw new Error('Generated social post output is not a valid object');
  }

  if (!post.content || typeof post.content !== 'string') {
    throw new Error('Generated social post content is missing');
  }

  // Check for forbidden markdown formatting
  if (/\*\*[^*]+\*\*/.test(post.content) || /__[^_]+__/.test(post.content)) {
    throw new Error('Generated LinkedIn post contains raw markdown bold formatting (**bold** or __bold__)');
  }

  if (/^\s*#{1,6}\s+/m.test(post.content)) {
    throw new Error('Generated LinkedIn post contains raw markdown headings (# Heading)');
  }

  const charCount = post.content.length;
  if (charCount < 250) {
    throw new Error(`Generated LinkedIn post is too short (${charCount} chars). Min 300 chars required.`);
  }

  if (!Array.isArray(post.hashtags) || post.hashtags.length === 0) {
    post.hashtags = ['#Tech', '#Innovation', '#SoftwareDevelopment', '#EaseMyWeb'];
  }

  // Ensure category assignment
  post.category = post.category || expectedCategory || 'technology';
  post.hook = post.hook || post.content.split('\n')[0] || '';

  return post;
}

const logoPath = path.resolve(moduleDir, '../../../public/newlogo.png');

async function overlayLogoOnBuffer(imageBuffer, width = 1200, height = 627) {
  try {
    const logoBuffer = await fs.readFile(logoPath);
    const logoWidth = Math.round(width * 0.20);
    const resizedLogo = await sharp(logoBuffer)
      .resize({ width: logoWidth, fit: 'contain' })
      .toBuffer();

    return await sharp(imageBuffer)
      .resize(width, height, { fit: 'cover' })
      .composite([
        {
          input: resizedLogo,
          top: 24,
          left: 28,
        },
      ])
      .webp({ quality: 92 })
      .toBuffer();
  } catch (err) {
    logger.warn(`Could not composite EaseMyWeb logo onto social image: ${err.message}`);
    return await sharp(imageBuffer)
      .resize(width, height, { fit: 'cover' })
      .webp({ quality: 90 })
      .toBuffer();
  }
}

export async function saveSocialImage(imagePrompt, retries = 3) {
  const enhancedPrompt = `${imagePrompt}, professional LinkedIn corporate infographic banner, modern tech 3D vector illustration, clean corporate typography layout, high impact visual structure, 1200x627 landscape ratio, ultra sharp focus, 8k resolution, volumetric studio lighting, rich vivid colors, glossy 3D render, pristine clean corporate quality`;

  logger.info(`Generating LinkedIn social image with Gemini AI Imagen API prompt: "${enhancedPrompt.slice(0, 100)}..."`);

  await fs.mkdir(publicStorageDir, { recursive: true });
  const filename = `social-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.webp`;
  const targetPath = path.join(publicStorageDir, filename);

  // 1. Try Gemini AI Imagen API first (using Gemini API Key)
  try {
    const rawBuffer = await generateGeminiImageBuffer(enhancedPrompt, '16:9');
    const finalBuffer = await overlayLogoOnBuffer(rawBuffer, 1200, 627);
    await fs.writeFile(targetPath, finalBuffer);

    logger.info(`LinkedIn image generated with Gemini AI & EaseMyWeb logo composite: ${filename}`);
    return `${config.publicBaseUrl}/blog/${filename}`;
  } catch (geminiImgErr) {
    logger.warn(`Gemini AI social image generation failed (${geminiImgErr.message}). Falling back to primary provider...`);
  }

  // 2. Fallback provider
  const baseUrl = config.blogAutomation.imageBaseUrl.replace(/\/+$/, '');
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const modelParam = attempt === 1 ? '&model=flux' : '&model=turbo';
      const imageUrl = `${baseUrl}/${encodeURIComponent(enhancedPrompt)}?width=1200&height=627&nologo=true${modelParam}`;

      const response = await fetch(imageUrl, {
        signal: AbortSignal.timeout(config.blogAutomation.imageRequestTimeoutMs),
      });

      if (!response.ok) {
        throw new Error(`Image provider returned HTTP ${response.status}`);
      }

      const imageBuffer = Buffer.from(await response.arrayBuffer());
      const finalBuffer = await overlayLogoOnBuffer(imageBuffer, 1200, 627);
      await fs.writeFile(targetPath, finalBuffer);

      return `${config.publicBaseUrl}/blog/${filename}`;
    } catch (err) {
      if (attempt === retries) throw err;
      logger.warn(`Fallback social image generation attempt ${attempt}/${retries} failed: ${err.message}. Retrying...`);
      await new Promise((res) => setTimeout(res, 2000));
    }
  }
}

/**
 * AUTOMATED INTEGRATION: Generate LinkedIn Post right after Daily Blog is created
 * IMPORTANT: Failures during LinkedIn post generation MUST NEVER throw or fail the blog!
 */
export async function generateLinkedInPostFromBlog(blog) {
  if (!blog || !blog._id) {
    logger.warn('Cannot generate LinkedIn post: invalid blog object supplied');
    return null;
  }

  // Idempotency check: Don't create duplicate social posts for the same blog
  try {
    const existingPost = await SocialPost.findOne({ blogId: blog._id });
    if (existingPost) {
      logger.info(`LinkedIn post already exists for blog ID ${blog._id} (ID: ${existingPost._id})`);
      return existingPost;
    }
  } catch (err) {
    logger.warn(`Error checking existing social post for blog ${blog._id}: ${err.message}`);
  }

  try {
    const category = await getNextSocialCategory(blog.category);
    const festivalInfo = detectCurrentFestival();
    let generationType = 'BLOG_RELATED';
    if (category === 'memes') generationType = 'MEME';
    else if (category === 'festival') generationType = 'FESTIVAL';

    logger.info(`Generating LinkedIn post for blog "${blog.title}" [Category: ${category}]`);

    const promptText = buildLinkedInPrompt({
      blog,
      topic: blog.title,
      category,
      generationType,
      festivalInfo,
    });

    const rawGenerated = await requestGeminiSocialGeneration(promptText);
    const validatedPost = validateGeneratedSocialPost(rawGenerated, category);

    let imageUrl = null;
    try {
      imageUrl = await saveSocialImage(validatedPost.imagePrompt || blog.title);
    } catch (imgErr) {
      logger.warn(`LinkedIn image generation failed for blog "${blog.title}": ${imgErr.message}. Falling back to blog image.`);
      imageUrl = blog.image || null;
    }

    const socialPost = await SocialPost.create({
      platform: 'LINKEDIN',
      category: validatedPost.category || category,
      generationType,
      topic: validatedPost.topic || blog.title,
      hook: validatedPost.hook || '',
      content: validatedPost.content,
      hashtags: validatedPost.hashtags || [],
      imageUrl,
      imagePrompt: validatedPost.imagePrompt || '',
      sources: validatedPost.sources || (blog.references ? blog.references.map(r => ({ title: r.title, url: r.url })) : []),
      status: 'DRAFT',
      blogId: blog._id,
    });

    logger.info(`Successfully created LinkedIn post ID ${socialPost._id} for blog "${blog.title}"`);
    return socialPost;
  } catch (error) {
    logger.error(`Automated LinkedIn post generation failed for blog "${blog.title}"`, error);

    // Save failure record so admin can retry without failing blog generation
    try {
      await SocialPost.create({
        platform: 'LINKEDIN',
        category: 'technology',
        generationType: 'BLOG_RELATED',
        topic: blog.title || 'Automated Blog',
        content: `Generation failed for blog: ${blog.title}`,
        status: 'FAILED',
        blogId: blog._id,
        errorMessage: error.message || 'AI Generation Error',
      });
    } catch (saveErr) {
      logger.error('Failed to create error status record for social post', saveErr);
    }

    // Do NOT throw error! Blog remains successfully generated.
    return null;
  }
}

/**
 * Manual AI Generation by Admin
 */
export async function generateManualSocialPost({ topic, category = 'technology', generationType = 'TRENDING', platform = 'LINKEDIN' }) {
  const festivalInfo = detectCurrentFestival();
  const promptText = buildLinkedInPrompt({
    topic,
    category,
    generationType,
    festivalInfo,
  });

  const rawGenerated = await requestGeminiSocialGeneration(promptText);
  const validatedPost = validateGeneratedSocialPost(rawGenerated, category);

  let imageUrl = null;
  try {
    imageUrl = await saveSocialImage(validatedPost.imagePrompt || topic);
  } catch (imgErr) {
    logger.warn(`Manual image generation failed for topic "${topic}": ${imgErr.message}`);
  }

  const socialPost = await SocialPost.create({
    platform,
    category: validatedPost.category || category,
    generationType,
    topic: validatedPost.topic || topic,
    hook: validatedPost.hook || '',
    content: validatedPost.content,
    hashtags: validatedPost.hashtags || [],
    imageUrl,
    imagePrompt: validatedPost.imagePrompt || '',
    sources: validatedPost.sources || [],
    status: 'DRAFT',
  });

  return socialPost;
}

/**
 * Regenerate Post Text, Image, or Both
 */
export async function regenerateSocialPost(postId, mode = 'both') {
  const post = await SocialPost.findById(postId);
  if (!post) throw new Error('Social post not found');

  if (mode === 'image' || mode === 'both') {
    const prompt = post.imagePrompt || post.topic || post.hook || 'Modern web development illustration';
    post.imageUrl = await saveSocialImage(prompt);
  }

  if (mode === 'text' || mode === 'both') {
    const promptText = buildLinkedInPrompt({
      topic: post.topic,
      category: post.category,
      generationType: post.generationType,
    });
    const rawGenerated = await requestGeminiSocialGeneration(promptText);
    const validated = validateGeneratedSocialPost(rawGenerated, post.category);

    post.content = validated.content;
    post.hook = validated.hook;
    post.hashtags = validated.hashtags;
    if (validated.imagePrompt) post.imagePrompt = validated.imagePrompt;
    if (validated.sources?.length) post.sources = validated.sources;
  }

  post.status = 'DRAFT';
  post.errorMessage = null;
  await post.save();

  return post;
}
