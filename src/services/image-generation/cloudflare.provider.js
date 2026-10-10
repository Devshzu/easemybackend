import { config } from '../../config/env.config.js';
import { logger } from '../../config/logger.js';

/**
 * Cloudflare Workers AI Image Generation Provider
 * Implements FLUX.1 [schnell] text-to-image model via Cloudflare REST API.
 * Model Catalog: https://developers.cloudflare.com/workers-ai/models/flux-1-schnell/
 */
export class CloudflareWorkersAIProvider {
  constructor(options = {}) {
    this.accountId = options.accountId;
    this.apiToken = options.apiToken;
    this.model = options.model;
    this.timeoutMs = Number.isFinite(options.timeoutMs) ? options.timeoutMs : (config.cloudflare?.timeoutMs || 60000);
  }

  /**
   * Get current credentials from runtime config/env if not explicitly set at instantiation
   */
  getCredentials() {
    const accountId = typeof this.accountId === 'string'
      ? this.accountId
      : (config.cloudflare?.accountId || config.imageGeneration?.cloudflare?.accountId || process.env.CLOUDFLARE_ACCOUNT_ID || '');
    const apiToken = typeof this.apiToken === 'string'
      ? this.apiToken
      : (config.cloudflare?.apiToken || config.imageGeneration?.cloudflare?.apiToken || process.env.CLOUDFLARE_API_TOKEN || '');
    const model = typeof this.model === 'string'
      ? this.model
      : (config.cloudflare?.model || config.imageGeneration?.cloudflare?.model || process.env.CLOUDFLARE_IMAGE_MODEL || '@cf/black-forest-labs/flux-1-schnell');
    return { accountId, apiToken, model };
  }

  /**
   * Check if credentials are configured
   */
  isConfigured() {
    const { accountId, apiToken } = this.getCredentials();
    return Boolean(accountId && apiToken && accountId !== 'your_cloudflare_account_id' && apiToken !== 'your_cloudflare_api_token');
  }

  /**
   * Validate and sanitize input prompt
   */
  validatePrompt(prompt) {
    if (!prompt || typeof prompt !== 'string') {
      throw new Error('A valid non-empty string prompt is required for image generation.');
    }
    const trimmed = prompt.trim();
    if (trimmed.length < 3) {
      throw new Error('Prompt is too short for image generation (minimum 3 characters).');
    }
    // Cloudflare Workers AI supports up to 2048 characters
    if (trimmed.length > 2048) {
      return trimmed.slice(0, 2048);
    }
    return trimmed;
  }

  /**
   * Execute image generation request against Cloudflare Workers AI with bounded retry
   *
   * @param {Object} options
   * @param {string} options.prompt - Text description for image generation
   * @param {number} [options.steps=4] - Number of inference steps (1-8 for flux-1-schnell, default 4)
   * @param {number} [options.timeoutMs] - Request timeout in milliseconds
   * @returns {Promise<Buffer>} Raw image buffer (JPEG/PNG/WebP)
   */
  async generateImage({ prompt, steps = 4, timeoutMs } = {}) {
    const { accountId, apiToken, model } = this.getCredentials();

    if (!accountId || !apiToken || accountId === 'your_cloudflare_account_id' || apiToken === 'your_cloudflare_api_token') {
      throw new Error('Cloudflare Workers AI credentials missing. Please set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN in your environment.');
    }

    const sanitizedPrompt = this.validatePrompt(prompt);
    const effectiveTimeout = timeoutMs || this.timeoutMs || config.cloudflare?.timeoutMs || 60000;
    const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${model}`;

    const requestBody = {
      prompt: sanitizedPrompt,
      steps: Math.min(Math.max(Number.parseInt(steps, 10) || 4, 1), 8),
    };

    const maxRetries = 2;
    let lastError = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      const isRetry = attempt > 0;
      if (isRetry) {
        const delayMs = attempt * 1000;
        logger.warn(`Retrying Cloudflare image generation (attempt ${attempt + 1}/${maxRetries + 1}) after ${delayMs}ms delay...`);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }

      try {
        logger.info(`Sending image generation request to Cloudflare Workers AI model [${model}] (Prompt length: ${sanitizedPrompt.length} chars)`);

        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiToken}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify(requestBody),
          signal: AbortSignal.timeout(effectiveTimeout),
        });

        // Handle specific HTTP error status codes safely
        if (response.status === 401 || response.status === 403) {
          throw new Error('Cloudflare Workers AI authentication failed. Please verify CLOUDFLARE_API_TOKEN has Workers AI permissions.');
        }

        if (response.status === 404) {
          throw new Error(`Cloudflare Workers AI model [${model}] or account endpoint not found. Verify account ID and model.`);
        }

        if (response.status === 429) {
          throw new Error('Cloudflare Workers AI rate limit exceeded. Please retry after some time.');
        }

        if (response.status === 400) {
          let errDetail = 'Invalid request parameters';
          try {
            const errJson = await response.json();
            const errors = errJson.errors?.map((e) => e.message).join(', ');
            if (errors) errDetail = errors;
          } catch {
            // ignore JSON parse error
          }
          throw new Error(`Cloudflare Workers AI bad request (400): ${errDetail}`);
        }

        // Retryable upstream server errors (502, 503, 504)
        if (!response.ok) {
          const statusText = response.statusText || 'Unknown Error';
          if ([502, 503, 504].includes(response.status) && attempt < maxRetries) {
            lastError = new Error(`Cloudflare Workers AI server error (${response.status}: ${statusText})`);
            continue;
          }
          throw new Error(`Cloudflare Workers AI request failed with status ${response.status}: ${statusText}`);
        }

        // Parse response content
        const contentType = response.headers.get('content-type') || '';

        if (contentType.includes('application/json')) {
          const payload = await response.json();

          if (!payload.success && payload.errors && payload.errors.length > 0) {
            const errorMsg = payload.errors.map((e) => e.message).join('; ');
            throw new Error(`Cloudflare Workers AI API error: ${errorMsg}`);
          }

          // flux-1-schnell returns { result: { image: "<base64>" } } or { image: "<base64>" }
          const base64Data = payload.result?.image || payload.image || (typeof payload.result === 'string' ? payload.result : null);

          if (!base64Data || typeof base64Data !== 'string') {
            throw new Error('Cloudflare Workers AI response did not contain expected Base64 image payload.');
          }

          const imageBuffer = Buffer.from(base64Data, 'base64');
          if (!imageBuffer || imageBuffer.length < 100) {
            throw new Error('Decoded image buffer from Cloudflare Workers AI is empty or corrupted.');
          }

          logger.info(`Successfully received generated image from Cloudflare Workers AI (${imageBuffer.length} bytes decoded)`);
          return imageBuffer;
        }

        // Direct binary stream response (e.g. image/jpeg, image/png)
        const arrayBuf = await response.arrayBuffer();
        const binaryBuffer = Buffer.from(arrayBuf);
        if (!binaryBuffer || binaryBuffer.length < 100) {
          throw new Error('Binary image response from Cloudflare Workers AI is empty.');
        }

        logger.info(`Successfully received binary image from Cloudflare Workers AI (${binaryBuffer.length} bytes)`);
        return binaryBuffer;
      } catch (err) {
        lastError = err;

        // Never retry client/auth errors or prompt validation errors
        if (
          err.name === 'AbortError' ||
          err.message.includes('authentication failed') ||
          err.message.includes('bad request') ||
          err.message.includes('rate limit exceeded') ||
          err.message.includes('credentials missing')
        ) {
          throw err;
        }

        if (attempt === maxRetries) {
          break;
        }
      }
    }

    throw lastError || new Error('Failed to generate image with Cloudflare Workers AI after retries.');
  }
}

export const cloudflareProvider = new CloudflareWorkersAIProvider();
export default cloudflareProvider;
