import axios from 'axios';
import * as cheerio from 'cheerio';

class KeywordTrendsService {
  constructor() {
    this.googleTrendsApi = 'https://trends.google.com/trends/api/explore';
    this.serpApiKey = process.env.SERP_API_KEY; // Get from serpapi.com
  }

  /**
   * Get trending keywords from Google Trends
   */
  async getTrendingKeywords(category = '', geo = 'IN') {
    try {
      // Use unofficial Google Trends scraping or SerpApi
      const response = await axios.get(`https://serpapi.com/search.json`, {
        params: {
          engine: 'google_trends_trending_now',
          geo: geo,
          api_key: this.serpApiKey,
          cat: category
        }
      });

      return response.data.trending_searches || [];
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
      const response = await axios.get('https://serpapi.com/search.json', {
        params: {
          engine: 'google_keyword_research',
          q: keyword,
          gl: 'in',
          hl: 'en',
          api_key: this.serpApiKey
        }
      });

      return {
        keyword: keyword,
        searchVolume: response.data.search_volume || 0,
        competition: response.data.competition || 'unknown',
        cpc: response.data.cpc || 0,
        trend: response.data.trend || []
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
      const response = await axios.get('https://serpapi.com/search.json', {
        params: {
          engine: 'google_autocomplete',
          q: seed_keyword,
          gl: 'in',
          api_key: this.serpApiKey
        }
      });

      const suggestions = response.data.suggestions || [];
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
      // This would require SEMrush or Ahrefs API
      // For now, we'll use a basic SERP analysis
      const response = await axios.get('https://serpapi.com/search.json', {
        params: {
          engine: 'google',
          q: `site:${domain}`,
          num: 20,
          api_key: this.serpApiKey
        }
      });

      const results = response.data.organic_results || [];
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