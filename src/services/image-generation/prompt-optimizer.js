/**
 * Prompt Optimizer for FLUX.1 [schnell] on Cloudflare Workers AI
 *
 * FLUX.1 [schnell] is a 12B parameter rectified flow transformer.
 * It excels with clear, descriptive natural language prompts detailing:
 * - Specific subject matter and thematic metaphor
 * - Composition and framing (e.g. 16:9 widescreen or 1200x627)
 * - Lighting, color palette, and textures
 * - High-end editorial / 3D artistic style
 */

const CATEGORY_STYLES = {
  'Technology': {
    theme: 'cutting-edge digital technology innovation and hardware systems',
    elements: 'sleek reflective surfaces, subtle glowing optical data tracks, crystalline structures, translucent glass nodes',
    palette: 'electric cyan, deep navy blue, vibrant cobalt, chrome accents',
  },
  'AI & Machine Learning': {
    theme: 'sophisticated artificial intelligence and neural computing',
    elements: 'luminous interconnected neural network nodes, floating geometric algorithms, volumetric cybernetic energy',
    palette: 'vivid violet, deep indigo, neon cyan, glowing sapphire',
  },
  'Programming & Web Development': {
    theme: 'modern software engineering, web architectures, and cloud ecosystems',
    elements: 'isometric digital infrastructure, sleek floating code matrix panels, holographic data flows, clean developer workspace',
    palette: 'emerald green, dark slate, bright cyan, modern titanium gray',
  },
  'Career & Education': {
    theme: 'professional skills growth, digital leadership, and high-tech career advancement',
    elements: 'inspiring minimalist creative tech studio, sleek glass architecture, ambient volumetric sunlight, upward momentum geometry',
    palette: 'warm amber, deep slate, clean royal blue, metallic bronze',
  },
  'Business & Digital Growth': {
    theme: 'exponential digital business expansion, SaaS scaling, and global market innovation',
    elements: 'dynamic glowing financial trajectories, futuristic boardroom panoramic windows, clean holographic metrics, luxury minimalist aesthetic',
    palette: 'rich gold, obsidian black, emerald highlights, crisp corporate white',
  },
  'General': {
    theme: 'modern digital transformation and forward-looking tech landscape',
    elements: 'abstract volumetric geometric compositions, luminous depth-of-field layers, sleek architectural lighting',
    palette: 'hyper-vivid cyan, purple-magenta gradients, deep midnight navy',
  },
};

/**
 * Optimizes a blog banner prompt specifically for the FLUX model
 *
 * @param {Object} options
 * @param {string} [options.title] - Article title
 * @param {string|string[]} [options.keywords] - Keywords or topic tags
 * @param {string} [options.category] - Article category
 * @param {string} [options.promptText] - Explicit prompt text if already provided
 * @returns {string} Highly descriptive prompt tailored for FLUX.1
 */
export function optimizePromptForFlux({
  title = '',
  keywords = [],
  category = 'Technology',
  promptText = '',
} = {}) {
  // If an explicit detailed prompt was already generated and is detailed enough, use it with FLUX styling
  if (promptText && promptText.length > 50) {
    const cleanPrompt = promptText.replace(/[\r\n]+/g, ' ').trim();
    return `${cleanPrompt}, professional editorial 3D digital illustration, 16:9 widescreen composition, volumetric studio lighting, rich depth of field, 8k resolution, crisp clean textures, pristine corporate publication quality`.slice(0, 2048);
  }

  const categoryConfig = CATEGORY_STYLES[category] || CATEGORY_STYLES['Technology'];

  let kwList = [];
  if (Array.isArray(keywords)) {
    kwList = keywords.filter((k) => k && typeof k === 'string').map((k) => k.trim());
  } else if (typeof keywords === 'string') {
    kwList = keywords.split(/[,|]/).map((k) => k.trim()).filter(Boolean);
  }
  const topKeywords = kwList.slice(0, 3).join(', ') || 'modern digital technology';

  const cleanTitle = (title || 'Future Technology Innovations')
    .replace(/[^\w\s-]/g, '')
    .trim();

  const prompt = [
    `High-end editorial 3D artwork illustrating "${cleanTitle}".`,
    `Concept centered on ${categoryConfig.theme} with themes of ${topKeywords}.`,
    `Visual elements: ${categoryConfig.elements}.`,
    `Atmosphere and lighting: cinematic volumetric rim lighting, subtle ambient glow, rich depth of field, color palette featuring ${categoryConfig.palette}.`,
    `Framing: wide 16:9 landscape banner perspective, sharp focal point on center-right, sleek minimalist negative space on left, photorealistic textures, octane render, pristine digital art, professional tech media publication cover quality.`,
  ].join(' ');

  return prompt.slice(0, 2048);
}

/**
 * Optimizes a LinkedIn / social media banner prompt for FLUX.1
 *
 * @param {string} topicOrPrompt
 * @param {string} [category='technology']
 * @returns {string} Optimized FLUX prompt for social post banner
 */
export function optimizeSocialPromptForFlux(topicOrPrompt, category = 'technology') {
  const cleanTopic = String(topicOrPrompt || 'Tech Innovation')
    .replace(/[\r\n]+/g, ' ')
    .trim()
    .slice(0, 150);

  const prompt = [
    `High-impact LinkedIn corporate 3D graphic banner illustrating "${cleanTopic}".`,
    `Modern tech industry theme (${category}), isometric volumetric composition, glossy 3D renders, clean executive layout.`,
    `Lighting: studio product lighting, soft raytraced reflections, deep navy blue and vibrant cyan illumination.`,
    `Framing: 1200x627 landscape ratio, sharp focus, 8k resolution, clean minimalist corporate publication aesthetics.`,
  ].join(' ');

  return prompt.slice(0, 2048);
}
