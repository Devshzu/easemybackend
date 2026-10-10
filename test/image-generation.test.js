import test from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { CloudflareWorkersAIProvider } from '../src/services/image-generation/cloudflare.provider.js';
import {
  optimizePromptForFlux,
  optimizeSocialPromptForFlux,
} from '../src/services/image-generation/prompt-optimizer.js';
import {
  extractAndVerifyKeywords,
  buildFallbackSvgGraphic,
  overlayLogoOnBuffer,
  generateImageBuffer,
  saveGeneratedImage,
} from '../src/services/image-generation/image-generation.service.js';
import { generateGeminiImageBuffer } from '../src/utils/geminiImage.js';
import { buildBlogPrompt, getNextGeminiKey, selectTrendingStory } from '../src/modules/blog/blog.generator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper: create a valid 1x1 PNG or small image buffer for mock responses
async function createTestImageBuffer(width = 100, height = 100, color = { r: 59, g: 130, b: 246, alpha: 1 }) {
  return await sharp({
    create: {
      width,
      height,
      channels: 4,
      background: color,
    },
  }).png().toBuffer();
}

test('Prompt Optimizer: creates high-fidelity prompts for FLUX.1 [schnell]', () => {
  const prompt = optimizePromptForFlux({
    title: 'Quantum Computing Breakthroughs in 2026',
    keywords: ['Quantum Tech', 'Qubits', 'Supercomputing'],
    category: 'Technology',
  });

  assert.match(prompt, /Quantum Computing Breakthroughs/i);
  assert.match(prompt, /16:9/i);
  assert.match(prompt, /volumetric/i);
  assert.ok(prompt.length <= 2048, 'Prompt must not exceed 2048 characters');
});

test('Prompt Optimizer: generates optimized LinkedIn social banner prompt', () => {
  const prompt = optimizeSocialPromptForFlux('Building Scalable Web Applications', 'technology');
  assert.match(prompt, /LinkedIn corporate 3D graphic banner/i);
  assert.match(prompt, /Building Scalable Web Applications/i);
  assert.match(prompt, /1200x627/i);
  assert.ok(prompt.length <= 2048, 'Social prompt must not exceed 2048 characters');
});

test('extractAndVerifyKeywords: handles raw arrays and strings, extracts stop words', () => {
  const kw1 = extractAndVerifyKeywords('The Ultimate Guide to Modern React and Next.js', []);
  assert.ok(Array.isArray(kw1));
  assert.ok(kw1.length >= 2);
  assert.ok(!kw1.map((k) => k.toLowerCase()).includes('the'));

  const kw2 = extractAndVerifyKeywords('Article Title', ['cloud', 'devops', 'kubernetes']);
  assert.deepEqual(kw2, ['cloud', 'devops', 'kubernetes']);
});

test('CloudflareWorkersAIProvider: rejects missing credentials with clear error', async () => {
  const provider = new CloudflareWorkersAIProvider({
    accountId: '',
    apiToken: '',
  });

  await assert.rejects(
    async () => {
      await provider.generateImage({ prompt: 'A test prompt' });
    },
    /Cloudflare Workers AI credentials missing/i
  );
});

test('CloudflareWorkersAIProvider: validates prompt length and content', () => {
  const provider = new CloudflareWorkersAIProvider({
    accountId: 'test-acc',
    apiToken: 'test-token',
  });

  assert.throws(() => provider.validatePrompt(''), /non-empty string prompt is required/i);
  assert.throws(() => provider.validatePrompt('ab'), /too short/i);

  const longPrompt = 'a'.repeat(3000);
  const validated = provider.validatePrompt(longPrompt);
  assert.equal(validated.length, 2048);
});

test('CloudflareWorkersAIProvider: parses mock Cloudflare base64 response successfully', async () => {
  const sampleBuf = await createTestImageBuffer(200, 200);
  const base64String = sampleBuf.toString('base64');

  const provider = new CloudflareWorkersAIProvider({
    accountId: 'mock-account-id',
    apiToken: 'mock-token',
  });

  const originalFetch = globalThis.fetch;
  let requestedUrl = '';
  let requestedHeaders = {};
  let requestedBody = {};

  globalThis.fetch = async (url, options) => {
    requestedUrl = url;
    requestedHeaders = options.headers;
    requestedBody = JSON.parse(options.body);

    return new Response(
      JSON.stringify({
        success: true,
        result: {
          image: base64String,
        },
        errors: [],
        messages: [],
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  };

  try {
    const resultBuf = await provider.generateImage({
      prompt: 'A futuristic floating city at dusk',
      steps: 4,
    });

    assert.ok(Buffer.isBuffer(resultBuf));
    assert.ok(resultBuf.length > 0);
    assert.equal(requestedUrl, 'https://api.cloudflare.com/client/v4/accounts/mock-account-id/ai/run/@cf/black-forest-labs/flux-1-schnell');
    assert.equal(requestedHeaders['Authorization'], 'Bearer mock-token');
    assert.equal(requestedBody.prompt, 'A futuristic floating city at dusk');
    assert.equal(requestedBody.steps, 4);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('CloudflareWorkersAIProvider: handles Cloudflare authentication failure safely', async () => {
  const provider = new CloudflareWorkersAIProvider({
    accountId: 'mock-account-id',
    apiToken: 'secret-invalid-token',
  });

  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    return new Response(
      JSON.stringify({
        success: false,
        errors: [{ message: 'Authentication error' }],
      }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  };

  try {
    await assert.rejects(
      async () => {
        await provider.generateImage({ prompt: 'Test image prompt' });
      },
      (err) => {
        // Must give clear error without printing the secret token
        assert.match(err.message, /authentication failed/i);
        assert.ok(!err.message.includes('secret-invalid-token'));
        return true;
      }
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('CloudflareWorkersAIProvider: handles Cloudflare rate limit (429) gracefully', async () => {
  const provider = new CloudflareWorkersAIProvider({
    accountId: 'mock-account-id',
    apiToken: 'mock-token',
  });

  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    return new Response(
      JSON.stringify({
        success: false,
        errors: [{ message: 'Rate limit exceeded' }],
      }),
      { status: 429, headers: { 'Content-Type': 'application/json' } }
    );
  };

  try {
    await assert.rejects(
      async () => {
        await provider.generateImage({ prompt: 'Test rate limit prompt' });
      },
      /rate limit exceeded/i
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('Fallback SVG and Sharp processing: renders valid 1600x900 WebP buffer', async () => {
  const svg = buildFallbackSvgGraphic('AI and Cloud Architecture', ['Cloud', 'AI', 'Scale']);
  assert.ok(svg.includes('<svg'));
  assert.ok(svg.includes('1600'));
  assert.ok(svg.includes('900'));

  const webpBuf = await sharp(Buffer.from(svg))
    .resize(1600, 900)
    .webp({ quality: 92 })
    .toBuffer();

  const metadata = await sharp(webpBuf).metadata();
  assert.equal(metadata.format, 'webp');
  assert.equal(metadata.width, 1600);
  assert.equal(metadata.height, 900);
});

test('overlayLogoOnBuffer: composites logo and outputs 1600x900 WebP', async () => {
  const baseImg = await createTestImageBuffer(1600, 900);
  const composited = await overlayLogoOnBuffer(baseImg, 1600, 900);

  const metadata = await sharp(composited).metadata();
  assert.equal(metadata.format, 'webp');
  assert.equal(metadata.width, 1600);
  assert.equal(metadata.height, 900);
});

test('generateGeminiImageBuffer: delegates to image-generation provider seamlessly', async () => {
  const buffer = await generateGeminiImageBuffer({
    title: 'Testing Provider Delegation in Node',
    category: 'Technology',
  });

  assert.ok(Buffer.isBuffer(buffer));
  const metadata = await sharp(buffer).metadata();
  assert.equal(metadata.format, 'webp');
  assert.equal(metadata.width, 1600);
  assert.equal(metadata.height, 900);
});

test('saveGeneratedImage: creates a persisted WebP file and returns valid URL', async () => {
  const url = await saveGeneratedImage({
    title: 'Automated Test Article Image',
    category: 'Technology',
    keywords: ['Testing', 'Automation'],
  }, { width: 1600, height: 900, prefix: 'test-gen' });

  assert.ok(url.startsWith('http'));
  assert.ok(url.includes('/blog/test-gen-'));
  assert.ok(url.endsWith('.webp'));

  // Extract filename and check on disk
  const filename = path.basename(new URL(url).pathname);
  const filePath = path.resolve(__dirname, '../public/blog', filename);
  const stat = await fs.stat(filePath);
  assert.ok(stat.size > 1000);

  // Clean up test file
  await fs.unlink(filePath).catch(() => {});
});

test('Gemini text-generation functionality remains intact and functional', () => {
  const keys = ['key-1', 'key-2', 'key-3'];
  assert.equal(getNextGeminiKey(keys), 'key-1');
  assert.equal(getNextGeminiKey(keys), 'key-2');
  assert.equal(getNextGeminiKey(keys), 'key-3');
  assert.equal(getNextGeminiKey(keys), 'key-1');

  const prompt = buildBlogPrompt({
    title: 'Next-Gen Neural Networks',
    link: 'https://example.com/nn',
    pubDate: new Date().toISOString(),
    contentSnippet: 'Recent developments in neural systems.'
  }, 'AI & Machine Learning');

  assert.match(prompt, /Assigned Category: AI & Machine Learning/);
  assert.match(prompt, /TABLE OF CONTENTS/);
  assert.match(prompt, /OUTPUT JSON FORMAT/);
});
