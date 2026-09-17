import { config } from '../config/env.config.js';
import { logger } from '../config/logger.js';

let nextKeyIndex = 0;

/**
 * Generate image Buffer using Google Gemini AI API Keys
 */
export async function generateGeminiImageBuffer(promptText, aspectRatio = '16:9') {
  const keys = config.blogAutomation.geminiKeys.length
    ? config.blogAutomation.geminiKeys
    : (config.blogAutomation.geminiKey ? [config.blogAutomation.geminiKey] : []);

  if (!keys.length) {
    throw new Error('No GEMINI_KEY is configured for image generation');
  }

  const startIndex = nextKeyIndex % keys.length;
  const orderedKeys = keys.map((_, i) => keys[(startIndex + i) % keys.length]);
  nextKeyIndex = (startIndex + 1) % keys.length;

  for (const geminiKey of orderedKeys) {
    // Strategy A: Gemini Multimodal Content Generation with IMAGE response modality
    const multimodalModels = [
      config.blogAutomation.geminiModel || 'gemini-3.6-flash',
      'gemini-3.0-flash',
      'gemini-2.0-flash',
    ];

    for (const model of multimodalModels) {
      try {
        logger.info(`Sending image generation request to Gemini API [Model: ${model}]...`);
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`;

        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: AbortSignal.timeout(config.blogAutomation.imageRequestTimeoutMs),
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: `Generate a high resolution visual graphic / image for: ${promptText.slice(0, 1000)}` },
                ],
              },
            ],
            generationConfig: {
              responseModalities: ['TEXT', 'IMAGE'],
            },
          }),
        });

        if (!response.ok) {
          const errText = await response.text();
          logger.warn(`Gemini API (${model}) returned HTTP ${response.status}: ${errText.slice(0, 180)}`);
          continue;
        }

        const payload = await response.json();
        const parts = payload.candidates?.[0]?.content?.parts || [];
        for (const part of parts) {
          if (part.inlineData?.data) {
            logger.info(`Successfully generated image using Gemini API [Model: ${model}]`);
            return Buffer.from(part.inlineData.data, 'base64');
          }
        }
      } catch (err) {
        logger.warn(`Gemini model "${model}" image attempt failed: ${err.message}`);
      }
    }

    // Strategy B: Imagen 3 REST API via :generateImages
    const imagenModels = [
      'imagen-3.0-generate-002',
      'imagen-3.0-fast-generate-001',
    ];

    for (const model of imagenModels) {
      try {
        logger.info(`Sending image request to Gemini Imagen API [Model: ${model}]...`);
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateImages?key=${geminiKey}`;

        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: AbortSignal.timeout(config.blogAutomation.imageRequestTimeoutMs),
          body: JSON.stringify({
            prompt: promptText.slice(0, 1000),
            numberOfImages: 1,
            outputMimeType: 'image/jpeg',
            aspectRatio,
          }),
        });

        if (!response.ok) {
          const errText = await response.text();
          logger.warn(`Gemini Imagen API (${model}) returned HTTP ${response.status}: ${errText.slice(0, 180)}`);
          continue;
        }

        const payload = await response.json();
        const b64Data = payload.generatedImages?.[0]?.image?.imageBytes;
        if (b64Data) {
          logger.info(`Successfully generated image with Gemini Imagen API [Model: ${model}]`);
          return Buffer.from(b64Data, 'base64');
        }
      } catch (err) {
        logger.warn(`Gemini Imagen API model "${model}" failed: ${err.message}`);
      }
    }
  }

  throw new Error('All configured Gemini AI image generation endpoints failed or returned no image predictions.');
}

export default generateGeminiImageBuffer;
