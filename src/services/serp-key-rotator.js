/**
 * 🔄 SERP API KEY ROTATOR
 * Multi-key manager with automatic failover for SerpApi searches.
 * When one key reaches its search limit (429 or quota exhausted),
 * it seamlessly switches to the next configured key.
 */

import axios from 'axios';
import { config } from '../config/env.config.js';

export class SerpApiKeyRotator {
  /**
   * @param {Object} [options]
   * @param {string[]} [options.keys] - Optional explicit keys (useful for testing)
   * @param {number} [options.cooldownMs] - Cooldown before retrying an exhausted key (default: 1 hour)
   */
  constructor(options = {}) {
    this.cooldownMs = options.cooldownMs || 60 * 60 * 1000; // 1 hour default
    this.customKeys = options.keys || null;
    this.keys = [];
    this.currentIndex = 0;
    this.exhaustedKeys = new Set();
    this.exhaustionTimestamps = new Map();
    this.keyUsageCount = new Map();
    this.keyErrorCount = new Map();

    this.reloadKeys();
  }

  /**
   * Mask API key for secure logging (e.g., "bdd5d2...2a85")
   * @param {string} key
   * @returns {string}
   */
  maskKey(key) {
    if (!key || typeof key !== 'string') return 'UNKNOWN';
    if (key.length <= 10) return `${key.slice(0, 3)}***`;
    return `${key.slice(0, 6)}...${key.slice(-4)}`;
  }

  /**
   * Reload all configured SerpApi keys from environment and config
   */
  reloadKeys() {
    const placeholderPattern = /^(your_.*|optional_.*|<.*>|null|undefined)$/i;

    const rawKeySources = (this.customKeys && Array.isArray(this.customKeys))
      ? this.customKeys
      : [
          process.env.SERP_API_KEY_1,
          process.env.SERP_API_KEY_2,
          process.env.SERP_API_KEY_3,
          process.env.SERP_API_KEY_4,
          process.env.SERP_API_KEY_5,
          process.env.SERP_API_KEY_6,
          process.env.SERP_API_KEY,
          process.env.SERP_KEY,
          process.env.SERP_API_KEYS, // Comma-separated list support
          process.env.SERP_KEYS,
          ...(config.serpApiKeys || [])
        ];

    const parsedKeys = rawKeySources
      .filter(Boolean)
      .flatMap(val => (typeof val === 'string' ? val.split(',') : [val]))
      .map(val => (typeof val === 'string' ? val.trim() : ''))
      .filter(val => val.length > 0 && !placeholderPattern.test(val));

    // Deduplicate while preserving priority order
    this.keys = [...new Set(parsedKeys)];

    // Initialize tracking maps for any new keys
    for (const key of this.keys) {
      if (!this.keyUsageCount.has(key)) {
        this.keyUsageCount.set(key, 0);
      }
      if (!this.keyErrorCount.has(key)) {
        this.keyErrorCount.set(key, 0);
      }
    }

    // Adjust currentIndex bounds
    if (this.currentIndex >= this.keys.length) {
      this.currentIndex = 0;
    }
  }

  /**
   * Re-enable exhausted keys whose cooldown window has elapsed
   */
  refreshExhaustedKeys() {
    const now = Date.now();
    for (const [key, timestamp] of this.exhaustionTimestamps.entries()) {
      if (now - timestamp > this.cooldownMs) {
        this.exhaustedKeys.delete(key);
        this.exhaustionTimestamps.delete(key);
        console.log(`🔄 [SerpApiRotator] Cooldown expired for key ${this.maskKey(key)}. Re-enabled for requests.`);
      }
    }
  }

  /**
   * Get list of currently active, non-exhausted keys
   * @returns {string[]}
   */
  getAvailableKeys() {
    this.refreshExhaustedKeys();
    return this.keys.filter(key => !this.exhaustedKeys.has(key));
  }

  /**
   * Get the current active API key.
   * If the current key is exhausted, automatically finds the next available key.
   * @returns {string}
   */
  getKey() {
    this.refreshExhaustedKeys();
    const availableKeys = this.getAvailableKeys();

    if (availableKeys.length === 0) {
      if (this.keys.length > 0) {
        console.warn('⚠️ [SerpApiRotator] All configured SerpApi keys are currently exhausted. Returning primary key as fallback.');
        return this.keys[0];
      }
      return '';
    }

    // Check if the key at currentIndex is still available
    const currentKey = this.keys[this.currentIndex];
    if (currentKey && availableKeys.includes(currentKey)) {
      return currentKey;
    }

    // Otherwise, select the first available key
    const nextKey = availableKeys[0];
    this.currentIndex = this.keys.indexOf(nextKey);
    return nextKey;
  }

  /**
   * Advance to the next available API key
   * @returns {string}
   */
  getNextKey() {
    const availableKeys = this.getAvailableKeys();
    if (availableKeys.length === 0) {
      return this.getKey();
    }

    // Rotate currentIndex forward
    this.currentIndex = (this.currentIndex + 1) % this.keys.length;
    return this.getKey();
  }

  /**
   * Mark a key as exhausted (reached quota / search limit / rate limit)
   * and auto-rotate to the next available key.
   * @param {string} key
   * @param {string} [reason]
   */
  markKeyExhausted(key, reason = 'Search limit reached') {
    if (!key) return;

    this.exhaustedKeys.add(key);
    this.exhaustionTimestamps.set(key, Date.now());
    this.keyErrorCount.set(key, (this.keyErrorCount.get(key) || 0) + 1);

    const available = this.getAvailableKeys();
    console.warn(`⚠️ [SerpApiRotator] Key ${this.maskKey(key)} reached limit or failed (${reason}). Available keys remaining: ${available.length}/${this.keys.length}`);

    if (available.length > 0) {
      const nextKey = available[0];
      this.currentIndex = this.keys.indexOf(nextKey);
      console.log(`🔀 [SerpApiRotator] Switched active key to: ${this.maskKey(nextKey)}`);
    } else {
      console.error(`🚨 [SerpApiRotator] All ${this.keys.length} SerpApi keys have reached their limit!`);
    }
  }

  /**
   * Determine if an error or response indicates that a key reached its search/rate limit
   * @param {*} errorOrData
   * @returns {boolean}
   */
  isLimitOrKeyError(errorOrData) {
    if (!errorOrData) return false;

    // Check HTTP Status
    const status = errorOrData.response?.status || errorOrData.status;
    if (status === 429 || status === 401 || status === 403 || status === 402) {
      return true;
    }

    // Extract error string
    const rawError = (
      errorOrData.response?.data?.error ||
      errorOrData.data?.error ||
      errorOrData.error ||
      errorOrData.message ||
      ''
    );

    const errorStr = (typeof rawError === 'string' ? rawError : JSON.stringify(rawError)).toLowerCase();

    const limitPhrases = [
      'run out of searches',
      'out of searches',
      'search limit',
      'rate limit',
      'limit reached',
      'too many requests',
      'quota exceeded',
      'quota reached',
      'invalid api key',
      'api key is not valid',
      'unauthorized',
      'payment required',
      'account is not active',
      'plan limit',
      'monthly limit',
      'has no searches left'
    ];

    return limitPhrases.some(phrase => errorStr.includes(phrase));
  }

  /**
   * Execute a search request via SerpApi with automatic multi-key retry & failover.
   * If key 1 hits limit, key 2 is tried immediately, then key 3, etc.
   *
   * @param {Object} params - Query params (e.g., { engine: 'google', q: '...', num: 10 })
   * @param {Object} [options] - Additional Axios options (timeout, headers, etc.)
   * @returns {Promise<Object>} Search response data
   */
  async executeSearch(params = {}, options = {}) {
    this.reloadKeys();

    if (this.keys.length === 0) {
      throw new Error('No SerpApi keys configured. Please add SERP_API_KEY_1, SERP_API_KEY_2... in .env');
    }

    let attempts = 0;
    const maxAttempts = this.keys.length;
    let lastError = null;

    while (attempts < maxAttempts) {
      attempts++;
      const key = this.getKey();

      if (!key) {
        break;
      }

      this.keyUsageCount.set(key, (this.keyUsageCount.get(key) || 0) + 1);

      try {
        const queryParams = {
          ...params,
          api_key: key
        };

        const response = await axios.get('https://serpapi.com/search.json', {
          ...options,
          params: queryParams,
          timeout: options.timeout || 25000
        });

        // Some SerpApi responses return HTTP 200 with error property
        if (response.data && response.data.error) {
          if (this.isLimitOrKeyError(response.data.error)) {
            this.markKeyExhausted(key, response.data.error);
            continue; // Retry with next key
          }
        }

        // Successfully completed! Reset error count for this key
        this.keyErrorCount.set(key, 0);

        // Return combined object supporting both response.data and direct property access
        return {
          ...response.data,
          data: response.data
        };
      } catch (err) {
        lastError = err;
        const errorDetail = err.response?.data?.error || err.message;

        if (this.isLimitOrKeyError(err)) {
          this.markKeyExhausted(key, errorDetail);
          // Auto-retry on next iteration with next key
          continue;
        }

        // Non-limit error: if another key is available, rotate and try next
        const available = this.getAvailableKeys();
        if (available.length > 1) {
          console.warn(`⚠️ [SerpApiRotator] Request with key ${this.maskKey(key)} failed (${err.message}). Trying next key...`);
          this.markKeyExhausted(key, `Request failed: ${err.message}`);
          continue;
        }

        // If no alternative keys available, throw the error
        throw err;
      }
    }

    // All keys exhausted
    const errorMsg = `All configured SerpApi keys (${this.keys.length}) reached their limit or failed.`;
    console.error(`🚨 [SerpApiRotator] ${errorMsg}`, lastError?.message);
    throw lastError || new Error(errorMsg);
  }

  /**
   * Reset all exhausted keys manually
   */
  resetExhaustedKeys() {
    this.exhaustedKeys.clear();
    this.exhaustionTimestamps.clear();
    console.log('🔄 [SerpApiRotator] All SerpApi keys reset and available.');
  }

  /**
   * Get stats for diagnostics and dashboard reporting
   * @returns {Object}
   */
  getStats() {
    this.refreshExhaustedKeys();
    return {
      total_keys: this.keys.length,
      available_keys: this.getAvailableKeys().length,
      exhausted_keys: this.exhaustedKeys.size,
      active_key: this.keys[this.currentIndex] ? this.maskKey(this.keys[this.currentIndex]) : 'NONE',
      usage_distribution: Object.fromEntries(
        this.keys.map((k, i) => [`key_${i + 1}`, this.keyUsageCount.get(k) || 0])
      ),
      exhausted_list: Array.from(this.exhaustedKeys).map(k => this.maskKey(k))
    };
  }
}

// Global Singleton Instance
let serpRotatorInstance = null;

export function getSerpApiKeyRotator() {
  if (!serpRotatorInstance) {
    serpRotatorInstance = new SerpApiKeyRotator();
  }
  return serpRotatorInstance;
}

export default SerpApiKeyRotator;
