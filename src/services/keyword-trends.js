import axios from 'axios';
import * as cheerio from 'cheerio';
import { getSerpApiKeyRotator } from './serp-key-rotator.js';

class KeywordTrendsService {
  constructor() {
    this.googleTrendsApi = 'https://trends.google.com/trends/api/explore';
    this.serpRotator = getSerpApiKeyRotator();
  }

  get serpApiKey() {
    return this.serpRotator.getKey();
  }

  /**
   * Get trending keywords from Google Trends
   */
  async getTrendingKeywords(category = '', geo = 'IN') {
    try {
      if (!this.serpApiKey) return [];
      // Use SerpApi with multi-key rotation and auto-failover
      const response = await this.serpRotator.executeSearch({
        engine: 'google_trends_trending_now',
        geo: geo,
        cat: category
      });

      return response.trending_searches || response.data?.trending_searches || [];
    } catch (error) {
      console.error('Error fetching trends:', error);
      return [];
    }
  }

  /**
   * Get keyword search volume and difficulty
   */
  async getKeywordMetrics(keyword) {
    try {
      if (!this.serpApiKey) return null;
      const response = await this.serpRotator.executeSearch({
        engine: 'google_keyword_research',
        q: keyword,
        gl: 'in',
        hl: 'en'
      });

      const resData = response.data || response;
      return {
        keyword: keyword,
        searchVolume: resData.search_volume || 0,
        competition: resData.competition || 'unknown',
        cpc: resData.cpc || 0,
        trend: resData.trend || []
      };
    } catch (error) {
      console.error('Error fetching keyword metrics:', error);
      return null;
    }
  }

  /**
   * Find related keywords for a given topic
   */
  async getRelatedKeywords(seed_keyword, count = 10) {
    try {
      if (!this.serpApiKey) return [];
      const response = await this.serpRotator.executeSearch({
        engine: 'google_autocomplete',
        q: seed_keyword,
        gl: 'in'
      });

      const suggestions = response.suggestions || response.data?.suggestions || [];
      return suggestions.slice(0, count).map(s => s.value);
    } catch (error) {
      console.error('Error fetching related keywords:', error);
      return [];
    }
  }

  /**
   * Analyze competitor keywords
   */
  async analyzeCompetitorKeywords(domain) {
    try {
      if (!this.serpApiKey) return [];
      // Multi-key resilient SERP competitor analysis
      const response = await this.serpRotator.executeSearch({
        engine: 'google',
        q: `site:${domain}`,
        num: 20
      });

      const results = response.organic_results || response.data?.organic_results || [];
      return results.map(result => ({
        title: result.title,
        url: result.link,
        snippet: result.snippet
      }));
    } catch (error) {
      console.error('Error analyzing competitor:', error);
      return [];
    }
  }

  /**
   * Generate SEO-optimized content suggestions
   */
  async generateContentSuggestions(primaryKeyword, industry = 'technology') {
    const relatedKeywords = await this.getRelatedKeywords(primaryKeyword, 15);
    const trendingKeywords = await this.getTrendingKeywords();
    
    // Filter trending keywords relevant to your industry
    const relevantTrends = trendingKeywords.filter(trend => 
      trend.title.toLowerCase().includes(industry.toLowerCase()) ||
      trend.title.toLowerCase().includes('technology') ||
      trend.title.toLowerCase().includes('business') ||
      trend.title.toLowerCase().includes('digital')
    );

    return {
      primaryKeyword,
      relatedKeywords,
      trendingKeywords: relevantTrends.slice(0, 5),
      contentIdeas: this.generateContentIdeas(primaryKeyword, relatedKeywords),
      seoTips: this.generateSEOTips(primaryKeyword)
    };
  }

  /**
   * Generate content ideas based on keywords
   */
  generateContentIdeas(primaryKeyword, relatedKeywords) {
    const templates = [
      `How to ${primaryKeyword}: Complete Guide for 2026`,
      `Top 10 ${primaryKeyword} Strategies That Actually Work`,
      `${primaryKeyword} vs ${relatedKeywords[0]}: Which is Better?`,
      `The Ultimate ${primaryKeyword} Checklist for Beginners`,
      `${primaryKeyword} Mistakes to Avoid in 2026`,
      `Future of ${primaryKeyword}: Trends and Predictions`,
      `${primaryKeyword} Case Study: How We Achieved 300% Growth`,
      `Free ${primaryKeyword} Tools Every Business Needs`
    ];

    return templates.slice(0, 5);
  }

  /**
   * Generate SEO optimization tips
   */
  generateSEOTips(keyword) {
    return {
      title: `Include "${keyword}" in the first 60 characters`,
      metaDescription: `Use "${keyword}" naturally in meta description (150-160 chars)`,
      headings: `Include "${keyword}" in H1 and at least one H2`,
      content: `Use "${keyword}" 1-2% of total word count`,
      images: `Include "${keyword}" in image alt texts`,
      url: `Include "${keyword}" in URL slug`
    };
  }
}

export default KeywordTrendsService;