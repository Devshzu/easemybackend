const express = require('express');
const router = express.Router();
const AutoSEOOptimizer = require('../services/auto-seo-optimizer');
const KeywordTrendsService = require('../services/keyword-trends');

const seoOptimizer = new AutoSEOOptimizer();
const keywordService = new KeywordTrendsService();

/**
 * GET /api/trending-keywords
 * Get current trending keywords for content optimization
 */
router.get('/trending-keywords', async (req, res) => {
  try {
    const { category = '', geo = 'IN', industry = 'technology' } = req.query;
    
    const trendingKeywords = await keywordService.getTrendingKeywords(category, geo);
    const contentSuggestions = await keywordService.generateContentSuggestions(
      `${industry} trends`, 
      industry
    );
    
    res.json({
      success: true,
      data: {
        trending: trendingKeywords.slice(0, 10),
        suggestions: contentSuggestions,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/optimize-content
 * Automatically optimize content with trending keywords
 */
router.post('/optimize-content', async (req, res) => {
  try {
    const { content, industry = 'technology', target_keywords = [] } = req.body;
    
    if (!content) {
      return res.status(400).json({ success: false, error: 'Content is required' });
    }
    
    const optimization = await seoOptimizer.optimizeBlogContent(content, industry);
    
    res.json({
      success: true,
      data: optimization
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/blog-ideas
 * Generate trending blog post ideas automatically
 */
router.get('/blog-ideas', async (req, res) => {
  try {
    const { industry = 'technology', count = 5 } = req.query;
    
    const ideas = await seoOptimizer.generateTrendingBlogIdeas(industry, parseInt(count));
    
    res.json({
      success: true,
      data: {
        ideas: ideas,
        generated_at: new Date().toISOString(),
        industry: industry
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/keyword-analysis
 * Analyze keyword metrics and competition
 */
router.post('/keyword-analysis', async (req, res) => {
  try {
    const { keywords = [] } = req.body;
    
    if (!Array.isArray(keywords) || keywords.length === 0) {
      return res.status(400).json({ success: false, error: 'Keywords array is required' });
    }
    
    const analysis = await Promise.all(
      keywords.map(keyword => keywordService.getKeywordMetrics(keyword))
    );
    
    res.json({
      success: true,
      data: {
        analysis: analysis.filter(Boolean), // Remove null results
        analyzed_at: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/competitor-analysis
 * Analyze competitor keywords and content
 */
router.get('/competitor-analysis', async (req, res) => {
  try {
    const { domain } = req.query;
    
    if (!domain) {
      return res.status(400).json({ success: false, error: 'Domain is required' });
    }
    
    const analysis = await keywordService.analyzeCompetitorKeywords(domain);
    
    res.json({
      success: true,
      data: {
        competitor: domain,
        pages: analysis,
        analyzed_at: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/auto-generate-blog
 * Automatically generate a complete blog post with trending keywords
 */
router.post('/auto-generate-blog', async (req, res) => {
  try {
    const { 
      topic, 
      industry = 'technology', 
      word_count = 1000,
      include_trending = true 
    } = req.body;
    
    if (!topic) {
      return res.status(400).json({ success: false, error: 'Topic is required' });
    }
    
    // Get trending keywords
    const trending = include_trending ? 
      await keywordService.getTrendingKeywords() : [];
    
    // Generate content suggestions
    const suggestions = await keywordService.generateContentSuggestions(topic, industry);
    
    // Create optimized blog structure
    const blogPost = {
      title: `${topic}: Complete Guide for 2026`,
      slug: topic.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      meta_description: `Comprehensive guide on ${topic}. Learn latest trends, strategies and best practices for 2026.`,
      keywords: [topic, ...suggestions.relatedKeywords.slice(0, 3)],
      trending_keywords: trending.slice(0, 2),
      outline: suggestions.contentIdeas,
      seo_tips: suggestions.seoTips,
      estimated_read_time: Math.ceil(word_count / 200) + ' min read'
    };
    
    res.json({
      success: true,
      data: {
        blog_post: blogPost,
        optimization_suggestions: suggestions,
        generated_at: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;