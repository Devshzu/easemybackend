const express = require('express');
const router = express.Router();
const AutoBacklinkBuilder = require('../services/auto-backlink-builder');
const ContentVelocityOptimizer = require('../services/content-velocity-optimizer');
const Blog = require('../modules/blog/blog.model');

const backlinkBuilder = new AutoBacklinkBuilder();
const velocityOptimizer = new ContentVelocityOptimizer();

/**
 * POST /api/magic-seo/velocity-strategy
 * Execute high-velocity content strategy for rapid ranking
 */
router.post('/velocity-strategy', async (req, res) => {
  try {
    const { targetRankings = 10, rapidPublish = true } = req.body;
    
    console.log('🚀 Executing Velocity Strategy...');
    
    const velocityResult = await velocityOptimizer.executeVelocityStrategy(targetRankings);
    
    res.json({
      success: true,
      message: '🚀 Content Velocity Strategy executed successfully!',
      data: velocityResult
    });

  } catch (error) {
    console.error('Velocity strategy error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/magic-seo/backlink-campaign
 * Launch automated backlink building campaign
 */
router.post('/backlink-campaign', async (req, res) => {
  try {
    const { keywords = [], contentUrls = [], executeOutreach = false } = req.body;
    
    console.log('🔗 Launching Backlink Campaign...');
    
    const backlinkResult = await backlinkBuilder.executeBacklinkCampaign(keywords, contentUrls);
    
    // Execute immediate outreach if requested
    if (executeOutreach && backlinkResult.outreach_campaigns) {
      const outreachResults = await backlinkBuilder.executeAutomatedOutreach(
        backlinkResult.outreach_campaigns.slice(0, 5)
      );
      backlinkResult.outreach_executed = outreachResults;
    }
    
    res.json({
      success: true,
      message: '🔗 Backlink campaign launched successfully!',
      data: backlinkResult
    });

  } catch (error) {
    console.error('Backlink campaign error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/magic-seo/ranking-dashboard
 * Get comprehensive ranking dashboard data
 */
router.get('/ranking-dashboard', async (req, res) => {
  try {
    // Get recent blog performance
    const recentBlogs = await Blog.find({ published: true })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('title slug keywords createdAt velocityScore');
    
    // Calculate performance metrics
    const performanceMetrics = {
      total_blogs: await Blog.countDocuments({ published: true }),
      avg_velocity_score: recentBlogs.reduce((acc, blog) => acc + (blog.velocityScore || 70), 0) / recentBlogs.length,
      velocity_optimized: await Blog.countDocuments({ velocityOptimized: true }),
      recent_publications: recentBlogs.length
    };
    
    res.json({
      success: true,
      data: {
        performance_metrics: performanceMetrics,
        recent_blogs: recentBlogs,
        magic_seo_status: 'ACTIVE',
        dashboard_updated: new Date().toISOString()
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/magic-seo/bulk-optimize
 * Bulk optimize existing content for better rankings
 */
router.post('/bulk-optimize', async (req, res) => {
  try {
    const { blogIds = [], optimizationType = 'velocity' } = req.body;
    
    const optimizationResults = [];
    
    // Get blogs to optimize
    const blogsToOptimize = blogIds.length > 0 
      ? await Blog.find({ _id: { $in: blogIds } })
      : await Blog.find({ published: true }).sort({ createdAt: -1 }).limit(10);
    
    for (const blog of blogsToOptimize) {
      try {
        // Apply velocity optimizations
        const optimizedContent = await optimizeExistingBlog(blog, optimizationType);
        
        // Update the blog
        await Blog.findByIdAndUpdate(blog._id, optimizedContent);
        
        optimizationResults.push({
          blog_id: blog._id,
          title: blog.title,
          optimization_score: optimizedContent.velocityScore || 80,
          improvements_applied: optimizedContent.improvements || [],
          status: 'OPTIMIZED'
        });
        
      } catch (error) {
        optimizationResults.push({
          blog_id: blog._id,
          title: blog.title,
          status: 'FAILED',
          error: error.message
        });
      }
    }
    
    res.json({
      success: true,
      message: `✨ Bulk optimization completed for ${optimizationResults.length} blogs`,
      data: {
        optimization_results: optimizationResults,
        success_count: optimizationResults.filter(r => r.status === 'OPTIMIZED').length,
        total_processed: optimizationResults.length
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/magic-seo/performance-report
 * Get detailed performance report
 */
router.get('/performance-report', async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const fromDate = new Date(Date.now() - parseInt(days) * 24 * 60 * 60 * 1000);
    
    // Get blogs from specified period
    const periodBlogs = await Blog.find({ 
      published: true,
      createdAt: { $gte: fromDate }
    }).select('title keywords velocityScore createdAt velocityOptimized');
    
    // Calculate metrics
    const report = {
      period: `${days} days`,
      total_content_created: periodBlogs.length,
      velocity_optimized_content: periodBlogs.filter(blog => blog.velocityOptimized).length,
      average_velocity_score: periodBlogs.reduce((acc, blog) => acc + (blog.velocityScore || 70), 0) / periodBlogs.length,
      content_by_week: getContentByWeek(periodBlogs),
      top_performing_content: periodBlogs
        .sort((a, b) => (b.velocityScore || 70) - (a.velocityScore || 70))
        .slice(0, 5)
        .map(blog => ({
          title: blog.title,
          velocity_score: blog.velocityScore || 70,
          created: blog.createdAt
        })),
      projected_ranking_improvements: {
        page_1_rankings: Math.floor(periodBlogs.length * 0.3),
        page_2_rankings: Math.floor(periodBlogs.length * 0.4),
        traffic_increase_estimate: `${periodBlogs.length * 25}-${periodBlogs.length * 50}%`
      }
    };
    
    res.json({
      success: true,
      data: report
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Helper functions
async function optimizeExistingBlog(blog, optimizationType) {
  const improvements = [];
  const updates = {};
  
  // Add velocity score if missing
  if (!blog.velocityScore) {
    updates.velocityScore = 75;
    improvements.push('Added velocity score');
  }
  
  // Optimize meta description
  if (!blog.metaDescription || blog.metaDescription.length < 120) {
    updates.metaDescription = `Complete guide to ${blog.keywords?.[0] || 'technology'}. Learn expert strategies, best practices, and get professional services from EaseMyWeb.`;
    improvements.push('Optimized meta description');
  }
  
  // Add missing keywords
  if (!blog.keywords || blog.keywords.length < 3) {
    updates.keywords = [
      ...(blog.keywords || []),
      'web development',
      'digital marketing',
      'technology solutions'
    ];
    improvements.push('Added relevant keywords');
  }
  
  // Mark as velocity optimized
  updates.velocityOptimized = true;
  updates.improvements = improvements;
  updates.lastOptimized = new Date();
  
  return updates;
}

function getContentByWeek(blogs) {
  const weeks = {};
  
  blogs.forEach(blog => {
    const week = getWeekNumber(blog.createdAt);
    weeks[week] = (weeks[week] || 0) + 1;
  });
  
  return weeks;
}

function getWeekNumber(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const week = Math.ceil(((d - new Date(year, 0, 1)) / 86400000 + 1) / 7);
  return `${year}-W${week}`;
}

module.exports = router;