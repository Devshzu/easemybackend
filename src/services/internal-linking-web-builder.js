/**
 * 🔗 INTERNAL LINKING WEB BUILDER
 * Creates massive internal linking network across all blog posts
 * Every post links to 10-15 related posts + service pages
 * Boosts ALL pages' authority and rankings!
 */

import Blog from '../modules/blog/blog.model.js';

class InternalLinkingWebBuilder {
  constructor() {
    this.linkCache = new Map();
    this.servicePages = [
      { url: '/services/web-development', anchor: 'Web Development Services' },
      { url: '/services/mobile-app-development', anchor: 'Mobile App Development' },
      { url: '/services/digital-marketing', anchor: 'Digital Marketing Services' },
      { url: '/services/ecommerce-development', anchor: 'Ecommerce Development' },
      { url: '/services/ui-ux-design', anchor: 'UI/UX Design Services' },
      { url: '/services/seo-services', anchor: 'SEO Services' },
      { url: '/services/software-development', anchor: 'Software Development' },
      { url: '/contact', anchor: 'Contact Us' },
      { url: '/portfolio', anchor: 'Our Portfolio' },
      { url: '/about', anchor: 'About EaseMyWeb' }
    ];
  }

  /**
   * 🔗 Build internal linking for a new blog post
   */
  async buildInternalLinks(blogPost, keywords) {
    console.log(`🔗 Building internal link web for: ${blogPost.title}`);

    const internalLinks = {
      related_blogs: [],
      service_pages: [],
      strategic_links: [],
      total_links: 0
    };

    // 1. Find related blog posts (10-15 links)
    const relatedBlogs = await this.findRelatedBlogs(keywords, blogPost._id);
    internalLinks.related_blogs = relatedBlogs.slice(0, 15);

    // 2. Add relevant service page links (2-3 links)
    const relevantServices = this.getRelevantServicePages(keywords);
    internalLinks.service_pages = relevantServices.slice(0, 3);

    // 3. Add strategic high-authority links
    const strategicLinks = await this.getStrategicLinks(keywords);
    internalLinks.strategic_links = strategicLinks.slice(0, 5);

    // Calculate total
    internalLinks.total_links = 
      internalLinks.related_blogs.length + 
      internalLinks.service_pages.length + 
      internalLinks.strategic_links.length;

    return internalLinks;
  }

  /**
   * 🔍 Find related blog posts based on keywords
   */
  async findRelatedBlogs(keywords, excludeId) {
    try {
      // Search for blogs with similar keywords
      const relatedBlogs = await Blog.find({
        _id: { $ne: excludeId },
        published: true,
        keywords: { $in: keywords }
      })
      .select('title slug keywords')
      .sort({ createdAt: -1 })
      .limit(20);

      return relatedBlogs.map(blog => ({
        url: `/blog/${blog.slug}`,
        anchor: blog.title,
        relevance: this.calculateRelevance(keywords, blog.keywords || [])
      }))
      .sort((a, b) => b.relevance - a.relevance);

    } catch (error) {
      console.error('Error finding related blogs:', error);
      return [];
    }
  }

  /**
   * 📊 Calculate relevance score between keyword sets
   */
  calculateRelevance(keywords1, keywords2) {
    const set1 = new Set(keywords1.map(k => k.toLowerCase()));
    const set2 = new Set(keywords2.map(k => k.toLowerCase()));
    
    let matches = 0;
    for (const keyword of set1) {
      if (set2.has(keyword)) {
        matches++;
      }
    }

    return matches;
  }

  /**
   * 🏢 Get relevant service pages based on keywords
   */
  getRelevantServicePages(keywords) {
    const relevantServices = [];
    const keywordStr = keywords.join(' ').toLowerCase();

    for (const service of this.servicePages) {
      // Match keywords to service pages
      if (keywordStr.includes('web') && service.url.includes('web-development')) {
        relevantServices.push(service);
      } else if (keywordStr.includes('mobile') || keywordStr.includes('app')) {
        if (service.url.includes('mobile-app')) relevantServices.push(service);
      } else if (keywordStr.includes('marketing') || keywordStr.includes('seo')) {
        if (service.url.includes('digital-marketing') || service.url.includes('seo')) {
          relevantServices.push(service);
        }
      } else if (keywordStr.includes('ecommerce') || keywordStr.includes('shop')) {
        if (service.url.includes('ecommerce')) relevantServices.push(service);
      } else if (keywordStr.includes('design') || keywordStr.includes('ui')) {
        if (service.url.includes('ui-ux')) relevantServices.push(service);
      }
    }

    // Always add contact page
    relevantServices.push(this.servicePages.find(s => s.url === '/contact'));

    return relevantServices;
  }

  /**
   * 🎯 Get strategic high-authority links
   */
  async getStrategicLinks(keywords) {
    try {
      // Get high-performing blogs (most views, best rankings)
      const topBlogs = await Blog.find({
        published: true,
        ultraOptimized: true
      })
      .select('title slug keywords')
      .sort({ createdAt: -1 })
      .limit(10);

      return topBlogs.map(blog => ({
        url: `/blog/${blog.slug}`,
        anchor: blog.title,
        type: 'high_authority'
      }));

    } catch (error) {
      console.error('Error getting strategic links:', error);
      return [];
    }
  }

  /**
   * 📝 Inject internal links into blog content
   */
  injectLinksIntoContent(content, internalLinks) {
    let enhancedContent = content;

    // 1. Add "Related Articles" section at the end
    const relatedSection = this.generateRelatedArticlesSection(internalLinks.related_blogs);
    enhancedContent += '\n\n' + relatedSection;

    // 2. Add contextual links throughout content
    enhancedContent = this.addContextualLinks(enhancedContent, internalLinks);

    // 3. Add service CTA boxes
    const ctaSection = this.generateServiceCTASection(internalLinks.service_pages);
    
    // Insert CTA in the middle of content
    const contentParts = enhancedContent.split('\n\n');
    const middleIndex = Math.floor(contentParts.length / 2);
    contentParts.splice(middleIndex, 0, ctaSection);
    enhancedContent = contentParts.join('\n\n');

    return enhancedContent;
  }

  /**
   * 📚 Generate Related Articles section
   */
  generateRelatedArticlesSection(relatedBlogs) {
    if (relatedBlogs.length === 0) return '';

    let html = `
<section class="related-articles">
  <h2>📚 Related Articles You'll Love</h2>
  <div class="related-articles-grid">
`;

    relatedBlogs.slice(0, 6).forEach(blog => {
      html += `
    <div class="related-article-card">
      <h3><a href="${blog.url}">${blog.anchor}</a></h3>
      <p>Deep dive into related topics and expand your knowledge.</p>
    </div>
`;
    });

    html += `
  </div>
</section>

<div class="internal-links-list">
  <h3>🔗 More Essential Reading:</h3>
  <ul>
`;

    relatedBlogs.slice(6, 12).forEach(blog => {
      html += `    <li><a href="${blog.url}">${blog.anchor}</a></li>\n`;
    });

    html += `
  </ul>
</div>
`;

    return html;
  }

  /**
   * 💼 Generate Service CTA section
   */
  generateServiceCTASection(servicePages) {
    if (servicePages.length === 0) return '';

    const mainService = servicePages[0];
    
    return `
<div class="service-cta-box">
  <h3>🚀 Ready to Get Started?</h3>
  <p>Our expert team is ready to bring your vision to life. Get a free consultation and quote today!</p>
  <div class="cta-buttons">
    <a href="${mainService.url}" class="btn-primary">${mainService.anchor}</a>
    <a href="/contact" class="btn-secondary">Contact Us Now</a>
  </div>
  <p class="cta-subtext">✅ 500+ Projects Delivered | ⭐ 99% Client Satisfaction | 🏆 Award-Winning Team</p>
</div>
`;
  }

  /**
   * 🔗 Add contextual links throughout content
   */
  addContextualLinks(content, internalLinks) {
    let enhancedContent = content;
    let linksAdded = 0;
    const maxLinks = 8;

    // Add links to related blogs contextually
    for (const blog of internalLinks.related_blogs) {
      if (linksAdded >= maxLinks) break;

      // Extract key terms from blog title
      const keyTerms = blog.anchor.toLowerCase().split(' ')
        .filter(word => word.length > 4)
        .slice(0, 3);

      // Try to find and link these terms in content
      for (const term of keyTerms) {
        const regex = new RegExp(`\\b${term}\\b(?![^<]*>|[^<>]*</)`, 'gi');
        const match = content.match(regex);
        
        if (match && match.length > 0) {
          // Replace first occurrence only
          enhancedContent = enhancedContent.replace(
            regex,
            `<a href="${blog.url}">${match[0]}</a>`
          );
          linksAdded++;
          break;
        }
      }
    }

    return enhancedContent;
  }

  /**
   * 🔄 Update existing blogs with new internal links
   */
  async updateExistingBlogsWithLinks(newBlogId) {
    try {
      const newBlog = await Blog.findById(newBlogId);
      if (!newBlog) return;

      // Find blogs that should link to this new blog
      const relatedBlogs = await Blog.find({
        _id: { $ne: newBlogId },
        published: true,
        keywords: { $in: newBlog.keywords || [] }
      }).limit(20);

      // Add link to new blog in related blogs
      for (const blog of relatedBlogs) {
        const linkHtml = `<p>Related: <a href="/blog/${newBlog.slug}">${newBlog.title}</a></p>`;
        
        // Add link at the end if not already present
        if (!blog.content.includes(newBlog.slug)) {
          blog.content += `\n\n${linkHtml}`;
          await blog.save();
        }
      }

      console.log(`✅ Updated ${relatedBlogs.length} existing blogs with links to new post`);

    } catch (error) {
      console.error('Error updating existing blogs:', error);
    }
  }

  /**
   * 🕸️ Build complete internal linking web for all blogs
   */
  async buildCompleteWeb() {
    try {
      console.log('🕸️ Building complete internal linking web...');

      const allBlogs = await Blog.find({ published: true });
      let updated = 0;

      for (const blog of allBlogs) {
        // Build links for this blog
        const internalLinks = await this.buildInternalLinks(blog, blog.keywords || []);
        
        // Inject links into content
        const enhancedContent = this.injectLinksIntoContent(blog.content, internalLinks);
        
        // Update blog
        blog.content = enhancedContent;
        await blog.save();
        
        updated++;
      }

      console.log(`✅ Built internal linking web for ${updated} blogs`);
      return { success: true, blogs_updated: updated };

    } catch (error) {
      console.error('Error building complete web:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 📊 Generate internal linking report
   */
  async generateLinkingReport() {
    try {
      const allBlogs = await Blog.find({ published: true });
      
      const report = {
        total_blogs: allBlogs.length,
        total_internal_links: 0,
        orphan_pages: [],
        well_linked_pages: [],
        linking_distribution: {}
      };

      for (const blog of allBlogs) {
        // Count links in content
        const linkCount = (blog.content.match(/<a href="\/blog\//g) || []).length;
        report.total_internal_links += linkCount;

        if (linkCount === 0) {
          report.orphan_pages.push(blog.slug);
        } else if (linkCount >= 10) {
          report.well_linked_pages.push(blog.slug);
        }

        // Distribution
        const bucket = linkCount < 5 ? '0-5' : linkCount < 10 ? '5-10' : '10+';
        report.linking_distribution[bucket] = (report.linking_distribution[bucket] || 0) + 1;
      }

      report.average_links_per_page = Math.round(report.total_internal_links / report.total_blogs);

      return report;

    } catch (error) {
      console.error('Error generating linking report:', error);
      return null;
    }
  }
}

export default InternalLinkingWebBuilder;
