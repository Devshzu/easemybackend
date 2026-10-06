import KeywordTrendsService from './keyword-trends.js';

class AutoSEOOptimizer {
  constructor() {
    this.keywordService = new KeywordTrendsService();
    this.geminiApiKey = process.env.GOOGLE_GEMINI_API_KEY;
    this.huggingfaceApiKey = process.env.HUGGINGFACE_API_KEY;
    this.useFreeLLM = process.env.USE_FREE_LLM === 'true';
  }

  /**
   * Automatically optimize blog content for trending keywords
   */
  async optimizeBlogContent(content, targetIndustry = 'technology') {
    try {
      // 1. Extract current keywords from content
      const currentKeywords = this.extractKeywords(content);
      
      // 2. Get trending keywords for the industry
      const trendingKeywords = await this.keywordService.getTrendingKeywords();
      
      // 3. Find relevant trending keywords
      const relevantTrends = this.findRelevantTrends(trendingKeywords, targetIndustry);
      
      // 4. Optimize content with trending keywords
      const optimizedContent = await this.injectTrendingKeywords(content, relevantTrends);
      
      // 5. Generate SEO metadata
      const seoMetadata = await this.generateSEOMetadata(optimizedContent, relevantTrends);
      
      return {
        originalContent: content,
        optimizedContent: optimizedContent,
        addedKeywords: relevantTrends,
        seoMetadata: seoMetadata,
        optimization_score: this.calculateOptimizationScore(content, optimizedContent)
      };
      
    } catch (error) {
      console.error('Auto SEO optimization error:', error);
      return { error: 'Failed to optimize content' };
    }
  }

  /**
   * Extract keywords from existing content
   */
  extractKeywords(content) {
    // Simple keyword extraction - you can enhance this with NLP libraries
    const words = content.toLowerCase().match(/\b\w+\b/g) || [];
    const wordFreq = {};
    
    words.forEach(word => {
      if (word.length > 3) { // Filter short words
        wordFreq[word] = (wordFreq[word] || 0) + 1;
      }
    });
    
    // Return top keywords
    return Object.entries(wordFreq)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([word]) => word);
  }

  /**
   * Find trending keywords relevant to your industry
   */
  findRelevantTrends(trendingKeywords, industry) {
    const industryTerms = {
      technology: ['tech', 'ai', 'software', 'digital', 'web', 'app', 'development', 'programming'],
      business: ['business', 'startup', 'growth', 'marketing', 'strategy', 'revenue', 'sales'],
      ecommerce: ['ecommerce', 'online', 'shopping', 'retail', 'store', 'commerce', 'selling']
    };
    
    const relevantTerms = industryTerms[industry.toLowerCase()] || industryTerms.technology;
    
    return trendingKeywords.filter(trend => {
      const trendText = trend.title.toLowerCase();
      return relevantTerms.some(term => trendText.includes(term));
    }).slice(0, 3); // Top 3 relevant trends
  }

  /**
   * Inject trending keywords naturally into content using FREE AI
   */
  async injectTrendingKeywords(content, trendingKeywords) {
    if (trendingKeywords.length === 0) return content;
    
    try {
      const prompt = `
        Optimize this content by naturally incorporating these trending keywords: ${trendingKeywords.map(k => k.title).join(', ')}
        
        Original content:
        ${content}
        
        Instructions:
        1. Keep the original meaning and structure
        2. Add trending keywords naturally where they fit
        3. Don't force keywords - only add where relevant
        4. Maintain readability and flow
        5. Add a trending keyword section if appropriate
        
        Return only the optimized content:
      `;

      // Try different free AI services in order of preference
      let optimizedContent = content;

      // 1. Try Google Gemini (FREE and excellent)
      if (this.geminiApiKey) {
        optimizedContent = await this.useGeminiAI(prompt);
      }
      // 2. Try Hugging Face (FREE)
      else if (this.huggingfaceApiKey) {
        optimizedContent = await this.useHuggingFace(prompt);
      }
      // 3. Use local/rule-based optimization (100% FREE)
      else {
        optimizedContent = await this.useRuleBasedOptimization(content, trendingKeywords);
      }

      return optimizedContent;
      
    } catch (error) {
      console.error('Error injecting keywords:', error);
      // Fallback to rule-based optimization
      return await this.useRuleBasedOptimization(content, trendingKeywords);
    }
  }

  /**
   * Use Google Gemini AI (FREE)
   */
  async useGeminiAI(prompt) {
    try {
      const model = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=` + this.geminiApiKey, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2048,
          }
        })
      });

      const result = await response.json();
      return result.candidates[0].content.parts[0].text;
      
    } catch (error) {
      console.error('Gemini AI error:', error);
      throw error;
    }
  }

  /**
   * Use Hugging Face (FREE)
   */
  async useHuggingFace(prompt) {
    try {
      const response = await fetch('https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.huggingfaceApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            max_length: 2000,
            temperature: 0.7
          }
        })
      });

      const result = await response.json();
      return result[0].generated_text;
      
    } catch (error) {
      console.error('Hugging Face error:', error);
      throw error;
    }
  }

  /**
   * Rule-based optimization (100% FREE - no API needed)
   */
  async useRuleBasedOptimization(content, trendingKeywords) {
    let optimizedContent = content;
    
    // Extract sentences from content
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    // Find good insertion points for keywords
    trendingKeywords.forEach((keyword, index) => {
      const keywordText = keyword.title;
      
      // Skip if keyword already exists
      if (optimizedContent.toLowerCase().includes(keywordText.toLowerCase())) {
        return;
      }
      
      // Strategy 1: Add to introduction
      if (index === 0 && sentences.length > 0) {
        const intro = sentences[0].trim();
        const optimizedIntro = intro + ` In today's digital landscape, ${keywordText} has become increasingly important.`;
        optimizedContent = optimizedContent.replace(intro, optimizedIntro);
      }
      
      // Strategy 2: Add as subheading
      else if (index === 1) {
        optimizedContent += `\n\n## ${keywordText}: Key Insights\n\nThe impact of ${keywordText} on modern businesses cannot be ignored. This trend is reshaping how companies approach their digital strategies.`;
      }
      
      // Strategy 3: Add to conclusion
      else if (index === 2) {
        optimizedContent += `\n\nAs we move forward, staying updated with trends like ${keywordText} will be crucial for business success.`;
      }
    });
    
    // Add trending keywords section
    if (trendingKeywords.length > 0) {
      const trendingSection = `\n\n## Current Trending Topics\n\nToday's most relevant trends include: ${trendingKeywords.map(k => k.title).join(', ')}. These topics are gaining significant traction and represent opportunities for businesses to connect with their audience.`;
      optimizedContent += trendingSection;
    }
    
    return optimizedContent;
  }

  /**
   * Generate SEO metadata based on optimized content
   */
  async generateSEOMetadata(content, trendingKeywords) {
    const mainKeywords = trendingKeywords.slice(0, 2).map(k => k.title);
    
    // Extract title from content (first heading or first sentence)
    const titleMatch = content.match(/<h1[^>]*>(.*?)<\/h1>/i) || content.match(/^(.{1,60})/);
    const baseTitle = titleMatch ? titleMatch[1].replace(/<[^>]*>/g, '') : 'New Article';
    
    return {
      title: `${baseTitle} | ${mainKeywords[0]} Guide 2026`,
      metaDescription: `${content.substring(0, 140).replace(/<[^>]*>/g, '')}... Learn about ${mainKeywords.join(', ')}.`,
      keywords: mainKeywords.concat(['web development', 'digital marketing', 'technology']),
      canonicalUrl: this.generateSlug(baseTitle),
      structuredData: {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": baseTitle,
        "keywords": mainKeywords.join(', '),
        "author": {
          "@type": "Organization",
          "name": "EaseMyWeb"
        }
      }
    };
  }

  /**
   * Generate URL slug from title
   */
  generateSlug(title) {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 50);
  }

  /**
   * Calculate optimization score
   */
  calculateOptimizationScore(original, optimized) {
    const originalWords = original.split(' ').length;
    const optimizedWords = optimized.split(' ').length;
    const improvementRatio = optimizedWords / originalWords;
    
    // Simple scoring based on length improvement and keyword density
    let score = 70; // Base score
    
    if (improvementRatio > 1.1) score += 15; // Content expanded
    if (optimized.includes('2026') || optimized.includes('trending')) score += 10;
    if (optimized.length > original.length * 1.2) score += 5;
    
    return Math.min(score, 100);
  }

  /**
   * Auto-generate trending blog post ideas
   */
  async generateTrendingBlogIdeas(industry = 'technology', count = 5) {
    const trending = await this.keywordService.getTrendingKeywords();
    const relevant = this.findRelevantTrends(trending, industry);
    
    const ideas = relevant.map(trend => ({
      title: `How ${trend.title} is Changing ${industry.charAt(0).toUpperCase() + industry.slice(1)} in 2026`,
      keyword: trend.title,
      estimated_traffic: trend.traffic || 'High',
      difficulty: 'Medium',
      content_outline: [
        `Introduction to ${trend.title}`,
        `Current state of ${trend.title} in ${industry}`,
        `Impact on businesses and consumers`,
        `Future predictions and opportunities`,
        `How to leverage ${trend.title} for growth`,
        `Conclusion and next steps`
      ]
    }));
    
    return ideas.slice(0, count);
  }
}

export default AutoSEOOptimizer;