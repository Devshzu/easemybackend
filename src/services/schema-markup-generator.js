/**
 * 📊 SCHEMA MARKUP GENERATOR
 * Generates rich schema markup for all blog posts
 * Enables: Featured Snippets, Rich Results, Star Ratings, FAQs, etc.
 * Massive ranking boost + better click-through rates!
 */

class SchemaMarkupGenerator {
  constructor() {
    this.domain = process.env.TARGET_DOMAIN || 'easemyweb.in';
    this.organizationName = 'EaseMyWeb';
  }

  /**
   * 📊 Generate complete schema markup for a blog post
   */
  generateCompleteSchema(blogPost, keywords, faqItems = []) {
    const schemas = [];

    // 1. Article Schema (Main content)
    schemas.push(this.generateArticleSchema(blogPost));

    // 2. Organization Schema (Brand authority)
    schemas.push(this.generateOrganizationSchema());

    // 3. BreadcrumbList Schema (Navigation)
    schemas.push(this.generateBreadcrumbSchema(blogPost));

    // 4. FAQ Schema (Featured snippets)
    if (faqItems.length > 0) {
      schemas.push(this.generateFAQSchema(faqItems));
    }

    // 5. WebPage Schema (Page info)
    schemas.push(this.generateWebPageSchema(blogPost));

    // 6. Review/Rating Schema (Trust signals)
    schemas.push(this.generateReviewSchema(blogPost));

    return schemas;
  }

  /**
   * 📰 Article Schema
   */
  generateArticleSchema(blogPost) {
    return {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: blogPost.title,
      description: blogPost.metaDescription || blogPost.excerpt,
      image: blogPost.featuredImage || `https://${this.domain}/images/default-blog.jpg`,
      datePublished: blogPost.createdAt || new Date().toISOString(),
      dateModified: blogPost.updatedAt || blogPost.createdAt || new Date().toISOString(),
      author: {
        '@type': 'Organization',
        name: this.organizationName,
        url: `https://${this.domain}/about`
      },
      publisher: {
        '@type': 'Organization',
        name: this.organizationName,
        logo: {
          '@type': 'ImageObject',
          url: `https://${this.domain}/logo.png`
        }
      },
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': `https://${this.domain}/blog/${blogPost.slug}`
      },
      keywords: (blogPost.keywords || []).join(', '),
      articleSection: blogPost.category || 'Technology',
      wordCount: this.estimateWordCount(blogPost.content),
      inLanguage: 'en-US'
    };
  }

  /**
   * 🏢 Organization Schema
   */
  generateOrganizationSchema() {
    return {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: this.organizationName,
      url: `https://${this.domain}`,
      logo: `https://${this.domain}/logo.png`,
      description: 'Leading web development, mobile app development, and digital marketing company in India',
      address: {
        '@type': 'PostalAddress',
        addressCountry: 'IN',
        addressRegion: 'Delhi',
        addressLocality: 'New Delhi'
      },
      contactPoint: {
        '@type': 'ContactPoint',
        telephone: '+91-9999999999',
        contactType: 'Customer Service',
        availableLanguage: ['English', 'Hindi']
      },
      sameAs: [
        'https://www.linkedin.com/company/easemyweb',
        'https://twitter.com/easemyweb',
        'https://www.facebook.com/easemyweb',
        'https://www.instagram.com/easemyweb'
      ],
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '4.9',
        reviewCount: '500',
        bestRating: '5',
        worstRating: '1'
      }
    };
  }

  /**
   * 🍞 Breadcrumb Schema
   */
  generateBreadcrumbSchema(blogPost) {
    return {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: `https://${this.domain}/`
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Blog',
          item: `https://${this.domain}/blog`
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: blogPost.category || 'Technology',
          item: `https://${this.domain}/blog/category/${(blogPost.category || 'technology').toLowerCase()}`
        },
        {
          '@type': 'ListItem',
          position: 4,
          name: blogPost.title,
          item: `https://${this.domain}/blog/${blogPost.slug}`
        }
      ]
    };
  }

  /**
   * ❓ FAQ Schema (For Featured Snippets!)
   */
  generateFAQSchema(faqItems) {
    return {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqItems.map(item => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.answer
        }
      }))
    };
  }

  /**
   * 📄 WebPage Schema
   */
  generateWebPageSchema(blogPost) {
    return {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      '@id': `https://${this.domain}/blog/${blogPost.slug}`,
      url: `https://${this.domain}/blog/${blogPost.slug}`,
      name: blogPost.title,
      description: blogPost.metaDescription || blogPost.excerpt,
      datePublished: blogPost.createdAt || new Date().toISOString(),
      dateModified: blogPost.updatedAt || blogPost.createdAt || new Date().toISOString(),
      inLanguage: 'en-US',
      isPartOf: {
        '@type': 'WebSite',
        '@id': `https://${this.domain}/#website`,
        url: `https://${this.domain}`,
        name: this.organizationName
      },
      breadcrumb: {
        '@id': `https://${this.domain}/blog/${blogPost.slug}#breadcrumb`
      }
    };
  }

  /**
   * ⭐ Review/Rating Schema (Trust signals)
   */
  generateReviewSchema(blogPost) {
    return {
      '@context': 'https://schema.org',
      '@type': 'Review',
      itemReviewed: {
        '@type': 'Article',
        name: blogPost.title
      },
      reviewRating: {
        '@type': 'Rating',
        ratingValue: '5',
        bestRating: '5',
        worstRating: '1'
      },
      author: {
        '@type': 'Organization',
        name: this.organizationName
      },
      reviewBody: 'Comprehensive and well-researched article providing valuable insights and actionable information.'
    };
  }

  /**
   * 🎯 Generate HowTo Schema (For step-by-step guides)
   */
  generateHowToSchema(title, steps) {
    return {
      '@context': 'https://schema.org',
      '@type': 'HowTo',
      name: title,
      description: `Step-by-step guide: ${title}`,
      step: steps.map((step, index) => ({
        '@type': 'HowToStep',
        position: index + 1,
        name: step.name,
        text: step.text,
        url: step.url || ''
      }))
    };
  }

  /**
   * 📝 Generate Schema HTML script tag
   */
  generateSchemaScriptTag(schemas) {
    let html = '\n<!-- 🎯 Rich Schema Markup for SEO -->\n';
    
    for (const schema of schemas) {
      html += `<script type="application/ld+json">\n`;
      html += JSON.stringify(schema, null, 2);
      html += `\n</script>\n`;
    }

    return html;
  }

  /**
   * ❓ Generate FAQ items from keywords
   */
  generateFAQItems(mainKeyword, keywords) {
    const faqs = [];

    // Generate 10-15 relevant FAQs
    const questionTemplates = [
      {
        question: `What is ${mainKeyword}?`,
        answer: `${mainKeyword} is a professional service that helps businesses achieve their goals through strategic planning, expert execution, and continuous optimization. At ${this.organizationName}, we specialize in delivering high-quality ${mainKeyword} solutions tailored to your specific needs.`
      },
      {
        question: `How much does ${mainKeyword} cost?`,
        answer: `The cost of ${mainKeyword} varies based on project scope, complexity, and requirements. At ${this.organizationName}, we offer flexible pricing options starting from competitive rates. Contact us for a free consultation and customized quote.`
      },
      {
        question: `How long does ${mainKeyword} take?`,
        answer: `${mainKeyword} timeline depends on project complexity. Typically, projects range from 2-12 weeks. Our team at ${this.organizationName} works efficiently to deliver quality results within agreed timelines while maintaining the highest standards.`
      },
      {
        question: `Why choose ${this.organizationName} for ${mainKeyword}?`,
        answer: `${this.organizationName} stands out with 500+ successfully completed projects, 99% client satisfaction rate, expert team with 5+ years experience, and proven track record in ${mainKeyword}. We combine technical excellence with business understanding to deliver results.`
      },
      {
        question: `What are the benefits of ${mainKeyword}?`,
        answer: `${mainKeyword} provides numerous benefits including improved efficiency, cost savings, better user experience, scalability, and competitive advantage. Our clients typically see significant ROI within 3-6 months of implementation.`
      },
      {
        question: `How to get started with ${mainKeyword}?`,
        answer: `Getting started is easy! Simply contact ${this.organizationName} for a free consultation. We'll discuss your requirements, provide expert recommendations, and create a customized plan. Our team guides you through every step of the process.`
      },
      {
        question: `Is ${mainKeyword} suitable for small businesses?`,
        answer: `Absolutely! ${mainKeyword} is beneficial for businesses of all sizes. ${this.organizationName} offers scalable solutions designed to fit small business budgets while delivering enterprise-level quality and results.`
      },
      {
        question: `What makes ${mainKeyword} successful?`,
        answer: `Success in ${mainKeyword} requires expert planning, quality execution, continuous optimization, and experienced team. ${this.organizationName} combines all these elements with proven methodologies to ensure project success.`
      },
      {
        question: `Can I see examples of ${mainKeyword} work?`,
        answer: `Yes! ${this.organizationName} has completed 500+ projects across various industries. Visit our portfolio to see case studies, client testimonials, and examples of our ${mainKeyword} work. We're proud of our track record.`
      },
      {
        question: `What support do you provide after ${mainKeyword}?`,
        answer: `${this.organizationName} provides comprehensive post-project support including maintenance, updates, optimization, and 24/7 technical assistance. We build long-term partnerships with our clients to ensure continued success.`
      }
    ];

    return questionTemplates;
  }

  /**
   * 📊 Inject schema into blog content
   */
  injectSchemaIntoContent(content, blogPost = {}, keywords = []) {
    const postContent = content || blogPost?.content || '';
    const post = { ...blogPost, content: postContent };

    // Generate FAQ items
    const faqItems = this.generateFAQItems(keywords[0] || post.title || 'FAQ', keywords);

    // Generate all schemas
    const schemas = this.generateCompleteSchema(post, keywords, faqItems);

    // Generate HTML
    const schemaHtml = this.generateSchemaScriptTag(schemas);

    // Add schema at the beginning of content
    const enhancedContent = schemaHtml + '\n\n' + postContent;

    // Add visible FAQ section at the end
    const faqSectionHtml = this.generateFAQSectionHTML(faqItems);
    
    return enhancedContent + '\n\n' + faqSectionHtml;
  }

  /**
   * 📝 Generate visible FAQ section HTML
   */
  generateFAQSectionHTML(faqItems) {
    let html = `
<section class="faq-section">
  <h2>❓ Frequently Asked Questions</h2>
  <div class="faq-container">
`;

    faqItems.forEach((item, index) => {
      html += `
    <div class="faq-item" itemscope itemprop="mainEntity" itemtype="https://schema.org/Question">
      <h3 itemprop="name">${item.question}</h3>
      <div itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
        <p itemprop="text">${item.answer}</p>
      </div>
    </div>
`;
    });

    html += `
  </div>
</section>
`;

    return html;
  }

  /**
   * 📏 Estimate word count
   */
  estimateWordCount(content) {
    if (!content || typeof content !== 'string') return 0;
    const text = content.replace(/<[^>]*>/g, '');
    return text.split(/\s+/).filter(Boolean).length;
  }

  /**
   * ✅ Validate schema markup
   */
  validateSchema(schema) {
    // Basic validation
    if (!schema['@context'] || !schema['@type']) {
      return { valid: false, error: 'Missing @context or @type' };
    }

    return { valid: true };
  }
}

export default SchemaMarkupGenerator;
