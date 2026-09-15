import test from 'node:test';
import assert from 'node:assert/strict';
import { buildBlogPrompt, getNextGeminiKey, selectTrendingStory } from '../src/modules/blog/blog.generator.js';

const now = new Date('2026-09-15T12:00:00.000Z');

test('getNextGeminiKey rotates through configured keys', () => {
  const keys = ['key-a', 'key-b', 'key-c'];
  assert.equal(getNextGeminiKey(keys), 'key-a');
  assert.equal(getNextGeminiKey(keys), 'key-b');
  assert.equal(getNextGeminiKey(keys), 'key-c');
  assert.equal(getNextGeminiKey(keys), 'key-a');
});

test('buildBlogPrompt includes the reader-demand trend gate', () => {
  const prompt = buildBlogPrompt({
    title: 'New AI product update',
    link: 'https://example.com/story',
    pubDate: now.toISOString(),
    contentSnippet: 'A current update with practical impact.'
  }, 'AI & Machine Learning');

  assert.match(prompt, /actively searching for, discussing, and sharing RIGHT NOW/);
  assert.match(prompt, /Do not use a fixed list of products/);
  assert.doesNotMatch(prompt, /ChatGPT\/OpenAI|Gemini\/Google|Claude\/Anthropic/);
  assert.match(prompt, /Do not manufacture popularity/);
  assert.match(prompt, /EaseMyWeb can help readers turn the opportunity/);
  assert.match(prompt, /no fake discounts/);
});

test('selectTrendingStory chooses the highest-ranked recent story', () => {
  const selected = selectTrendingStory([
    {
      title: 'Older top result',
      link: 'https://example.com/older',
      pubDate: '2026-09-10T12:00:00.000Z'
    },
    {
      title: 'Current top trend',
      link: 'https://example.com/current',
      pubDate: '2026-09-15T10:00:00.000Z'
    }
  ], [], now, 7);

  assert.equal(selected.title, 'Current top trend');
});

test('selectTrendingStory preserves feed ranking for equally fresh stories', () => {
  const selected = selectTrendingStory([
    {
      title: 'Top ranked trend',
      link: 'https://example.com/top',
      pubDate: '2026-09-15T10:00:00.000Z'
    },
    {
      title: 'Lower ranked trend',
      link: 'https://example.com/lower',
      pubDate: '2026-09-15T10:00:00.000Z'
    }
  ], [], now, 7);

  assert.equal(selected.title, 'Top ranked trend');
});

test('selectTrendingStory rejects stale and duplicate stories', () => {
  const selected = selectTrendingStory([
    {
      title: 'Already published topic',
      link: 'https://example.com/duplicate',
      pubDate: '2026-09-15T11:00:00.000Z'
    },
    {
      title: 'Stale topic',
      link: 'https://example.com/stale',
      pubDate: '2026-08-01T11:00:00.000Z'
    }
  ], ['Already published topic'], now, 7);

  assert.equal(selected, null);
});