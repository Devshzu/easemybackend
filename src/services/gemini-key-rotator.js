/**
 * 🔄 GEMINI KEY ROTATOR
 * Rotates between multiple Gemini API keys to avoid rate limits
 * 4x faster content generation with zero downtime
 */

class GeminiKeyRotator {
  constructor() {
    // Load all available Gemini keys
    this.keys = [
      process.env.GEMINI_KEY_1,
      process.env.GEMINI_KEY_2,
      process.env.GEMINI_KEY_3,
      process.env.GEMINI_KEY_4,
      process.env.GOOGLE_GEMINI_API_KEY
    ].filter(key => key && key.trim() !== '');

    this.currentIndex = 0;
    this.keyUsageCount = new Map();
    this.keyErrorCount = new Map();
    
    // Initialize counters
    this.keys.forEach(key => {
      this.keyUsageCount.set(key, 0);
      this.keyErrorCount.set(key, 0);
    });

    console.log(`🔑 Gemini Key Rotator initialized with ${this.keys.length} keys`);
  }

  /**
   * Get next available API key using round-robin
   */
  getNextKey() {
    if (this.keys.length === 0) {
      throw new Error('No Gemini API keys available!');
    }

    // Get current key
    const key = this.keys[this.currentIndex];
    
    // Increment usage counter
    this.keyUsageCount.set(key, this.keyUsageCount.get(key) + 1);
    
    // Move to next key for next request
    this.currentIndex = (this.currentIndex + 1) % this.keys.length;
    
    return key;
  }

  /**
   * Get key with least usage (load balancing)
   */
  getLeastUsedKey() {
    if (this.keys.length === 0) {
      throw new Error('No Gemini API keys available!');
    }

    let minUsage = Infinity;
    let bestKey = this.keys[0];

    for (const key of this.keys) {
      const usage = this.keyUsageCount.get(key);
      const errors = this.keyErrorCount.get(key);
      
      // Skip keys with too many errors
      if (errors > 10) continue;
      
      if (usage < minUsage) {
        minUsage = usage;
        bestKey = key;
      }
    }

    this.keyUsageCount.set(bestKey, this.keyUsageCount.get(bestKey) + 1);
    return bestKey;
  }

  /**
   * Report error for a key
   */
  reportError(key) {
    if (this.keyErrorCount.has(key)) {
      this.keyErrorCount.set(key, this.keyErrorCount.get(key) + 1);
      
      const errorCount = this.keyErrorCount.get(key);
      if (errorCount > 10) {
        console.warn(`⚠️ Key ${key.substring(0, 10)}... has ${errorCount} errors`);
      }
    }
  }

  /**
   * Reset error count for a key (when it works again)
   */
  resetErrors(key) {
    if (this.keyErrorCount.has(key)) {
      this.keyErrorCount.set(key, 0);
    }
  }

  /**
   * Get all keys for parallel processing
   */
  getAllKeys() {
    return [...this.keys];
  }

  /**
   * Get statistics
   */
  getStats() {
    const stats = {
      total_keys: this.keys.length,
      current_index: this.currentIndex,
      usage_distribution: {},
      error_distribution: {}
    };

    this.keys.forEach((key, index) => {
      const shortKey = `key_${index + 1}`;
      stats.usage_distribution[shortKey] = this.keyUsageCount.get(key);
      stats.error_distribution[shortKey] = this.keyErrorCount.get(key);
    });

    return stats;
  }

  /**
   * Get random key (for randomization)
   */
  getRandomKey() {
    const randomIndex = Math.floor(Math.random() * this.keys.length);
    const key = this.keys[randomIndex];
    this.keyUsageCount.set(key, this.keyUsageCount.get(key) + 1);
    return key;
  }
}

// Singleton instance
let rotatorInstance = null;

export function getGeminiKeyRotator() {
  if (!rotatorInstance) {
    rotatorInstance = new GeminiKeyRotator();
  }
  return rotatorInstance;
}

export default GeminiKeyRotator;
