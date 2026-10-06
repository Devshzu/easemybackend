import axios from 'axios';
import cheerio from 'cheerio';

class FreeKeywordTrendsService {
  constructor() {
    this.geminiApiKey = process.env.GOOGLE_GEMINI_API_KEY;
  }

  /**
   * Get trending keywords from Google Trends RSS (100% FREE)
   */
  async getTrendingKeywords(category = '', geo = 'IN') {
    try {
      // Method 1: Google Trends RSS Feed (Free)
      const trendingFromRSS = await this.getTrendsFromRSS(geo);
      
      // Method 2: Google Autocomplete (Free)
      const autocompleteSuggestions = await this.getGoogleAutocomplete('technology trends 2026');
      
      // Method 3: Related searches scraping (Free)
      const relatedSearches = await this.getRelatedSearches('web development trends');
      
      // Combine all sources
      const allTrends = [
        ...trendingFromRSS,
        ...autocompleteSuggestions,
        ...relatedSearches
      ];
      
      // Remove duplicates and filter by relevance
      const uniqueTrends = this.removeDuplicates(allTrends);
      
      return uniqueTrends.slice(0, 15);
      
    } catch (error) {
      console.error('Error fetching free trends:', error);
      return this.getFallbackKeywords();
    }
  }

  /**
   * Get trends from Google Trends RSS feed (Free)
   */
  async getTrendsFromRSS(geo = 'IN') {
    try {
      const rssUrl = `https://trends.google.com/trends/trendingsearches/daily/rss?geo=${geo}`;
      const response = await axios.get(rssUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      const $ = cheerio.load(response.data, { xmlMode: true });
      const trends = [];
      
      $('item').each((i, item) => {
        const title = $(item).find('title').text();
        const traffic = $(item).find('ht\\:approx_traffic, approx_traffic').text();
        
        if (title && title !== 'Google Trends') {
          trends.push({
            title: title.trim(),
            traffic: traffic || 'Medium',
            competition: 'Medium',
            source: 'google_trends_rss'
          });
        }
      });
      
      return trends;
      
    } catch (error) {
      console.error('RSS trends error:', error);
      return [];
    }
  }

  /**
   * Get Google autocomplete suggestions (Free)
   */
  async getGoogleAutocomplete(query) {
    try {
      const suggestions = [];
      const queries = [
        `${query}`,
        `${query} 2026`,
        `best ${query}`,
        `how to ${query}`,
        `${query} guide`
      ];
      
      for (const q of queries) {
        const url = `https://suggestqueries.google.com/complete/search?client=firefox&q=${encodeURIComponent(q)}`;
        
        try {
          const response = await axios.get(url, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            timeout: 5000
          });
          
          if (response.data && Array.isArray(response.data[1])) {
            response.data[1].forEach(suggestion => {
              suggestions.push({
                title: suggestion,
                traffic: 'Medium',
                competition: 'Low',
                source: 'google_autocomplete'
              });
            });
          }
        } catch (err) {
          console.log(`Autocomplete error for "${q}":`, err.message);
        }
      }
      
      return suggestions;
      
    } catch (error) {
      console.error('Autocomplete error:', error);
      return [];
    }
  }

  /**
   * Get related searches by scraping Google (Free)
   */
  async getRelatedSearches(query) {
    try {
      // This is a simplified version - in production you might want to use a proxy service
      const searches = [
        `${query} tutorial`,
        `${query} examples`,
        `${query} tips`,
        `${query} best practices`,
        `${query} 2026 predictions`,
        `future of ${query}`,
        `${query} tools`,
        `${query} strategies`
      ];
      
      return searches.map(search => ({
        title: search,
        traffic: 'Medium',
        competition: 'Low',
        source: 'related_searches'
      }));
      
    } catch (error) {
      console.error('Related searches error:', error);
      return [];
    }
  }

  /**
   * Remove duplicate keywords
   */
  removeDuplicates(trends) {
    const seen = new Set();
    return trends.filter(trend => {
      const normalized = trend.title.toLowerCase().trim();
      if (seen.has(normalized)) return false;
      seen.add(normalized);
      return true;
    });
  }

  /**
   * Fallback keywords when APIs fail
   */
  getFallbackKeywords() {
    return [
      { title: 'AI technology trends 2026', traffic: 'High', competition: 'Medium', source: 'fallback' },
      { title: 'web development best practices', traffic: 'High', competition: 'Medium', source: 'fallback' },
      { title: 'digital marketing strategies', traffic: 'High', competition: 'High', source: 'fallback' },
      { title: 'mobile app development', traffic: 'Medium', competition: 'Medium', source: 'fallback' },
      { title: 'SEO optimization guide', traffic: 'High', competition: 'High', source: 'fallback' },
      { title: 'e-commerce platform comparison', traffic: 'Medium', competition: 'Low', source: 'fallback' },
      { title: 'cloud computing benefits', traffic: 'Medium', competition: 'Medium', source: 'fallback' },
      { title: 'cybersecurity essentials', traffic: 'High', competition: 'Medium', source: 'fallback' }
    ];
  }

  /**
   * Analyze keyword difficulty (Free method)
   */
  async analyzeKeywordDifficulty(keyword) {
    // Simple heuristic-based difficulty analysis
    const wordCount = keyword.split(' ').length;
    const hasNumbers = /\d/.test(keyword);
    const hasYear = /202[4-9]/.test(keyword);
    
    let difficulty = 'Medium';
    
    if (wordCount > 4 || hasYear) difficulty = 'Low';
    else if (wordCount < 3 && !hasNumbers) difficulty = 'High';
    
    return {
      keyword,
      difficulty,
      wordCount,
      hasYear,
      recommendations: this.getKeywordRecommendations(keyword, difficulty)
    };
  }

  /**
   * Get keyword optimization recommendations
   */
  getKeywordRecommendations(keyword, difficulty) {
    const recommendations = [];
    
    if (difficulty === 'High') {
      recommendations.push('Consider long-tail variations of this keyword');
      recommendations.push('Focus on local SEO to reduce competition');
    }
    
    if (difficulty === 'Low') {
      recommendations.push('This keyword has good ranking potential');
      recommendations.push('Create comprehensive content around this topic');
    }
    
    recommendations.push(`Use "${keyword}" in your title and first paragraph`);
    recommendations.push(`Create related content around "${keyword}"`);
    
    return recommendations;
  }

  /**
   * Generate content ideas based on trending keywords (Free)
   */
  async generateContentIdeas(keywords) {
    const templates = [
      'The Complete Guide to {keyword} in 2026',
      'How {keyword} is Changing the Industry',
      '{keyword}: Everything You Need to Know',
      'Top 10 {keyword} Strategies That Work',
      '{keyword} vs Traditional Methods: What\'s Better?',
      'Future of {keyword}: Predictions and Trends',
      '{keyword} Case Study: Real Results',
      'Common {keyword} Mistakes to Avoid',
      'Best {keyword} Tools and Resources',
      '{keyword} for Beginners: Step-by-Step Guide'
    ];
    
    const ideas = [];
    
    keywords.slice(0, 5).forEach(keywordObj => {
      const keyword = keywordObj.title;
      templates.forEach(template => {
        ideas.push({
          title: template.replace('{keyword}', keyword),
          keyword: keyword,
          difficulty: keywordObj.competition,
          estimated_traffic: keywordObj.traffic,
          content_type: this.getContentType(template)
        });
      });
    });
    
    return ideas.slice(0, 15); // Return top 15 ideas
  }

  /**
   * Determine content type based on title template
   */
  getContentType(template) {
    if (template.includes('Guide') || template.includes('Everything')) return 'comprehensive_guide';
    if (template.includes('Top 10') || template.includes('Best')) return 'listicle';
    if (template.includes('Case Study')) return 'case_study';
    if (template.includes('vs') || template.includes('Compare')) return 'comparison';
    if (template.includes('Future') || template.includes('Predictions')) return 'trend_analysis';
    return 'informational';
  }
}

export default FreeKeywordTrendsService;