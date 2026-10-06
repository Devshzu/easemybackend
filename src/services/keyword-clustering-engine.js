/**
 * 🎯 KEYWORD CLUSTERING ENGINE
 * Groups related keywords together for maximum ranking power
 * Each blog targets 10-15 keywords instead of just 1!
 */

import axios from 'axios';

class KeywordClusteringEngine {
  constructor() {
    this.serpApiKey = process.env.SERP_API_KEY;
  }

  /**
   * 🎯 Create keyword clusters from massive keyword list
   * Groups semantically related keywords together
   */
  async createKeywordClusters(keywords) {
    console.log(`🎯 Clustering ${keywords.length} keywords...`);
    
    const clusters = [];
    const usedKeywords = new Set();

    for (const mainKeyword of keywords) {
      if (usedKeywords.has(mainKeyword)) continue;

      // Create cluster around this keyword
      const cluster = await this.buildCluster(mainKeyword, keywords, usedKeywords);
      
      if (cluster.keywords.length >= 3) {
        clusters.push(cluster);
      }

      // Stop when we have enough clusters
      if (clusters.length >= 100) break;
    }

    console.log(`✅ Created ${clusters.length} keyword clusters`);
    return clusters;
  }

  /**
   * Build a cluster of related keywords
   */
  async buildCluster(mainKeyword, allKeywords, usedKeywords) {
    const cluster = {
      primary_keyword: mainKeyword,
      keywords: [mainKeyword],
      lsi_keywords: [],
      question_keywords: [],
      long_tail_keywords: [],
      search_volume: 0,
      competition: 'medium',
      ranking_potential: 85
    };

    usedKeywords.add(mainKeyword);

    // Extract base terms from main keyword
    const baseTerms = this.extractBaseTerms(mainKeyword);

    // Find related keywords
    for (const keyword of allKeywords) {
      if (usedKeywords.has(keyword)) continue;
      if (cluster.keywords.length >= 15) break;

      // Check if keyword is related
      if (this.areKeywordsRelated(mainKeyword, keyword, baseTerms)) {
        cluster.keywords.push(keyword);
        usedKeywords.add(keyword);

        // Categorize keyword type
        if (keyword.toLowerCase().startsWith('how to') || 
            keyword.toLowerCase().startsWith('what is') ||
            keyword.toLowerCase().startsWith('why')) {
          cluster.question_keywords.push(keyword);
        } else if (keyword.split(' ').length >= 4) {
          cluster.long_tail_keywords.push(keyword);
        }
      }
    }

    // Add LSI keywords
    cluster.lsi_keywords = await this.generateLSIKeywords(mainKeyword);

    // Estimate metrics
    cluster.search_volume = this.estimateSearchVolume(cluster.keywords);
    cluster.competition = this.estimateCompetition(mainKeyword);
    cluster.ranking_potential = this.calculateRankingPotential(cluster);

    return cluster;
  }

  /**
   * Extract base terms from keyword
   */
  extractBaseTerms(keyword) {
    const stopWords = ['in', 'the', 'a', 'an', 'and', 'or', 'but', 'for', 'with', 'to', 'of'];
    const terms = keyword.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(' ')
      .filter(term => term.length > 2 && !stopWords.includes(term));
    
    return new Set(terms);
  }

  /**
   * Check if two keywords are related
   */
  areKeywordsRelated(keyword1, keyword2, baseTerms) {
    const terms2 = this.extractBaseTerms(keyword2);
    
    // Count common terms
    let commonTerms = 0;
    for (const term of baseTerms) {
      if (terms2.has(term)) {
        commonTerms++;
      }
    }

    // Related if they share 50%+ terms
    const threshold = Math.ceil(baseTerms.size * 0.5);
    return commonTerms >= threshold;
  }

  /**
   * Generate LSI (Latent Semantic Indexing) keywords
   * These are related terms Google expects to see
   */
  async generateLSIKeywords(mainKeyword) {
    const lsiKeywords = [];
    const baseKeyword = mainKeyword.toLowerCase();

    // Tech-related LSI terms
    const techLSI = {
      'web development': ['HTML', 'CSS', 'JavaScript', 'frontend', 'backend', 'responsive design', 'web frameworks', 'programming', 'software engineering', 'web application'],
      'mobile app': ['iOS', 'Android', 'React Native', 'Flutter', 'Swift', 'Kotlin', 'app store', 'mobile UI', 'app development', 'native app'],
      'digital marketing': ['SEO', 'social media', 'content marketing', 'PPC', 'email marketing', 'analytics', 'conversion rate', 'lead generation', 'online advertising'],
      'ecommerce': ['online store', 'shopping cart', 'payment gateway', 'product catalog', 'checkout process', 'inventory management', 'order fulfillment'],
      'seo': ['search engine optimization', 'keywords', 'backlinks', 'rankings', 'SERP', 'meta tags', 'site speed', 'mobile-friendly', 'schema markup'],
      'ui ux': ['user interface', 'user experience', 'wireframes', 'prototypes', 'usability', 'interaction design', 'visual design', 'user research'],
      'software': ['development', 'programming', 'coding', 'debugging', 'testing', 'deployment', 'maintenance', 'documentation', 'version control']
    };

    // Find matching LSI category
    for (const [category, terms] of Object.entries(techLSI)) {
      if (baseKeyword.includes(category)) {
        lsiKeywords.push(...terms);
        break;
      }
    }

    // Add generic business LSI terms
    const businessLSI = ['services', 'company', 'agency', 'consultant', 'expert', 'professional', 'solution', 'provider'];
    
    // Add location LSI terms
    const locationLSI = ['India', 'Delhi', 'Mumbai', 'Bangalore', 'Hyderabad', 'Chennai', 'Pune', 'online', 'nearme'];

    // Combine and limit to 10 most relevant
    const allLSI = [...lsiKeywords, ...businessLSI.slice(0, 3), ...locationLSI.slice(0, 3)];
    
    return allLSI.slice(0, 10);
  }

  /**
   * Estimate search volume
   */
  estimateSearchVolume(keywords) {
    // Base volume on keyword characteristics
    let volume = 0;
    
    for (const keyword of keywords) {
      const wordCount = keyword.split(' ').length;
      
      // Shorter keywords = higher volume usually
      if (wordCount <= 2) {
        volume += Math.floor(Math.random() * 5000) + 2000;
      } else if (wordCount === 3) {
        volume += Math.floor(Math.random() * 2000) + 1000;
      } else {
        volume += Math.floor(Math.random() * 1000) + 500;
      }
    }

    return Math.floor(volume / keywords.length);
  }

  /**
   * Estimate competition level
   */
  estimateCompetition(keyword) {
    const wordCount = keyword.split(' ').length;
    
    if (wordCount <= 2) return 'high';
    if (wordCount === 3) return 'medium';
    return 'low';
  }

  /**
   * Calculate ranking potential (0-100 score)
   */
  calculateRankingPotential(cluster) {
    let score = 70; // Base score

    // More keywords = higher potential
    score += Math.min(cluster.keywords.length * 2, 15);

    // Question keywords boost (for featured snippets)
    score += cluster.question_keywords.length * 3;

    // Long-tail keywords boost (easier to rank)
    score += cluster.long_tail_keywords.length * 2;

    // LSI keywords boost (comprehensive content)
    score += Math.min(cluster.lsi_keywords.length, 10);

    return Math.min(score, 100);
  }

  /**
   * 🎯 Get related questions for FAQ section
   */
  async getRelatedQuestions(mainKeyword) {
    const questions = [];

    // Common question patterns
    const patterns = [
      `What is ${mainKeyword}?`,
      `How does ${mainKeyword} work?`,
      `Why is ${mainKeyword} important?`,
      `When to use ${mainKeyword}?`,
      `Where to find ${mainKeyword}?`,
      `Who needs ${mainKeyword}?`,
      `How much does ${mainKeyword} cost?`,
      `What are the benefits of ${mainKeyword}?`,
      `How to choose ${mainKeyword}?`,
      `What are the best ${mainKeyword} practices?`,
      `How long does ${mainKeyword} take?`,
      `Is ${mainKeyword} worth it?`,
      `What makes ${mainKeyword} successful?`,
      `How to get started with ${mainKeyword}?`,
      `What are common ${mainKeyword} mistakes?`
    ];

    return patterns.slice(0, 10);
  }

  /**
   * 🎯 Get comparison keywords
   */
  getComparisonKeywords(mainKeyword) {
    return [
      `${mainKeyword} vs alternatives`,
      `${mainKeyword} comparison`,
      `best ${mainKeyword}`,
      `top ${mainKeyword}`,
      `${mainKeyword} review`,
      `${mainKeyword} pros and cons`,
      `${mainKeyword} advantages disadvantages`
    ];
  }

  /**
   * 🎯 Get commercial intent keywords
   */
  getCommercialKeywords(mainKeyword) {
    return [
      `${mainKeyword} services`,
      `${mainKeyword} company`,
      `${mainKeyword} agency`,
      `hire ${mainKeyword}`,
      `${mainKeyword} consultant`,
      `${mainKeyword} expert`,
      `${mainKeyword} pricing`,
      `${mainKeyword} cost`,
      `buy ${mainKeyword}`,
      `${mainKeyword} packages`
    ];
  }
}

export default KeywordClusteringEngine;
