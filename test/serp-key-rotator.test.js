import test from 'node:test';
import assert from 'node:assert/strict';
import axios from 'axios';
import { SerpApiKeyRotator } from '../src/services/serp-key-rotator.js';

test('SerpApiKeyRotator: initializes with configured keys and filters placeholders', () => {
  const rotator = new SerpApiKeyRotator({
    keys: ['key_one', 'key_two', 'your_serp_api_key_here', '', 'key_one', 'key_three']
  });

  const available = rotator.getAvailableKeys();
  assert.equal(available.length, 3);
  assert.deepEqual(available, ['key_one', 'key_two', 'key_three']);
  assert.equal(rotator.getKey(), 'key_one');
});

test('SerpApiKeyRotator: rotates through keys sequentially', () => {
  const rotator = new SerpApiKeyRotator({
    keys: ['serp_key_alpha', 'serp_key_beta', 'serp_key_gamma']
  });

  assert.equal(rotator.getKey(), 'serp_key_alpha');
  assert.equal(rotator.getNextKey(), 'serp_key_beta');
  assert.equal(rotator.getNextKey(), 'serp_key_gamma');
  assert.equal(rotator.getNextKey(), 'serp_key_alpha');
});

test('SerpApiKeyRotator: identifies limit and rate-limit errors correctly', () => {
  const rotator = new SerpApiKeyRotator({ keys: ['test_key'] });

  assert.equal(rotator.isLimitOrKeyError({ response: { status: 429 } }), true);
  assert.equal(rotator.isLimitOrKeyError({ response: { status: 401 } }), true);
  assert.equal(rotator.isLimitOrKeyError({ response: { status: 403 } }), true);
  assert.equal(rotator.isLimitOrKeyError({ response: { data: { error: 'Your account has run out of searches.' } } }), true);
  assert.equal(rotator.isLimitOrKeyError({ response: { data: { error: 'Monthly search limit reached' } } }), true);
  assert.equal(rotator.isLimitOrKeyError({ response: { data: { error: 'Invalid API key' } } }), true);
  assert.equal(rotator.isLimitOrKeyError({ message: 'Rate limit exceeded' }), true);

  // Normal / non-limit errors
  assert.equal(rotator.isLimitOrKeyError({ message: 'Network connection timeout' }), false);
  assert.equal(rotator.isLimitOrKeyError({ response: { status: 500, data: { error: 'Internal Server Error' } } }), false);
});

test('SerpApiKeyRotator: automatically switches to next key when a key is exhausted', () => {
  const rotator = new SerpApiKeyRotator({
    keys: ['key_1', 'key_2', 'key_3']
  });

  assert.equal(rotator.getKey(), 'key_1');

  // Mark key_1 as exhausted (limit reached)
  rotator.markKeyExhausted('key_1', 'Your account has run out of searches');

  // Should immediately switch to key_2
  assert.equal(rotator.getKey(), 'key_2');
  assert.equal(rotator.getAvailableKeys().length, 2);
  assert.deepEqual(rotator.getAvailableKeys(), ['key_2', 'key_3']);

  // Mark key_2 as exhausted
  rotator.markKeyExhausted('key_2', 'Rate limit exceeded');

  // Should immediately switch to key_3
  assert.equal(rotator.getKey(), 'key_3');
  assert.equal(rotator.getAvailableKeys().length, 1);
});

test('SerpApiKeyRotator: executeSearch auto-retries with next key on 429 / limit error', async () => {
  const originalGet = axios.get;
  const calls = [];

  const rotator = new SerpApiKeyRotator({
    keys: ['limited_key_1', 'limited_key_2', 'working_key_3']
  });

  // Mock axios.get
  axios.get = async (url, options) => {
    const keyUsed = options.params.api_key;
    calls.push(keyUsed);

    if (keyUsed === 'limited_key_1') {
      const err = new Error('Request failed with status code 429');
      err.response = { status: 429, data: { error: 'Your account has run out of searches.' } };
      throw err;
    }

    if (keyUsed === 'limited_key_2') {
      const err = new Error('Request failed with status code 429');
      err.response = { status: 429, data: { error: 'Search limit reached' } };
      throw err;
    }

    if (keyUsed === 'working_key_3') {
      return {
        data: {
          organic_results: [
            { title: 'Result 1', link: 'https://example.com/1' }
          ]
        }
      };
    }

    throw new Error('Unexpected key');
  };

  try {
    const result = await rotator.executeSearch({
      engine: 'google',
      q: 'web development services'
    });

    // Verify it attempted limited_key_1, then limited_key_2, then succeeded on working_key_3
    assert.deepEqual(calls, ['limited_key_1', 'limited_key_2', 'working_key_3']);
    assert.equal(result.organic_results.length, 1);
    assert.equal(result.organic_results[0].title, 'Result 1');

    // Stats should show working_key_3 is the active key, and 1 & 2 are exhausted
    const stats = rotator.getStats();
    assert.equal(stats.available_keys, 1);
    assert.equal(stats.exhausted_keys, 2);
  } finally {
    axios.get = originalGet;
  }
});

test('SerpApiKeyRotator: masks API keys properly in stats and logs', () => {
  const rotator = new SerpApiKeyRotator({
    keys: ['bdd5d2250bc948fe1b8a9a6d90f0a0e401137c7e2aca2eff89460f777ac42a85']
  });

  const stats = rotator.getStats();
  assert.equal(stats.active_key, 'bdd5d2...2a85');
  assert.match(stats.active_key, /^[a-z0-9]{6}\.\.\.[a-z0-9]{4}$/);
});
