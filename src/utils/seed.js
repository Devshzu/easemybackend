import { Admin } from '../modules/auth/admin.model.js';
import { Blog } from '../modules/blog/blog.model.js';
import { logger } from '../config/logger.js';

export const seedDatabase = async () => {
  try {
    // 1. Seed Admin Login Credentials
    const adminEmail = 'admin@easemyweb.com';
    const adminPassword = 'karan@9999';

    const existingAdmin = await Admin.findOne({ email: adminEmail });
    if (!existingAdmin) {
      await Admin.create({
        email: adminEmail,
        password: adminPassword,
        role: 'admin',
      });
      logger.info(`🔑 Admin user seeded successfully: ${adminEmail}`);
    } else {
      // Ensure password is updated if changed
      existingAdmin.password = adminPassword;
      await existingAdmin.save();
      logger.info(`🔑 Admin user updated: ${adminEmail}`);
    }

    // 2. Seed Static Blog Data into MongoDB
    const blogCount = await Blog.countDocuments();
    if (blogCount === 0) {
      const initialBlogs = [
        {
          title: "The Future of AI in Business Automation",
          slug: "the-future-of-ai-in-business-automation",
          category: "Technology",
          author: "Sarah Chen",
          readTime: "8 min read",
          excerpt: "Discover how artificial intelligence is revolutionizing business processes and what it means for the future of work.",
          content: `<p>Artificial Intelligence has become the cornerstone of modern business automation, transforming how organizations operate and compete in today's digital landscape. From predictive analytics to intelligent process automation, AI is reshaping industries across the globe.</p><h2>The Current State of AI in Business</h2><p>Today's businesses are leveraging AI in numerous ways, from customer service chatbots to sophisticated data analysis systems. The technology has evolved from simple rule-based systems to complex neural networks capable of learning and adapting to new situations.</p><h2>Key Applications</h2><ul><li><strong>Predictive Analytics:</strong> Forecasting market trends and customer behavior</li><li><strong>Process Automation:</strong> Streamlining repetitive tasks and workflows</li><li><strong>Customer Experience:</strong> Personalizing interactions and recommendations</li><li><strong>Risk Management:</strong> Identifying potential threats and opportunities</li></ul><h2>The Future Outlook</h2><p>As AI technology continues to advance, we can expect even more sophisticated applications in business automation. Machine learning algorithms will become more intuitive, and AI systems will be able to handle increasingly complex tasks with minimal human intervention.</p>`,
          image: "https://images.pexels.com/photos/8386434/pexels-photo-8386434.jpeg?auto=compress&cs=tinysrgb&w=800",
          published: true,
        },
        {
          title: "Design Systems That Scale",
          slug: "design-systems-that-scale",
          category: "Design",
          author: "Emma Thompson",
          readTime: "6 min read",
          excerpt: "How to create and maintain design systems that grow with your product and team while ensuring consistency.",
          content: `<p>Design systems have become essential for modern product development, providing the foundation for consistent, scalable user experiences. But creating a design system that truly scales requires careful planning and ongoing maintenance.</p><h2>Building the Foundation</h2><p>A successful design system starts with a strong foundation of design principles, tokens, and components. These elements work together to create a cohesive visual language that can be applied across all touchpoints.</p><h2>Key Components of a Scalable Design System</h2><ul><li><strong>Design Tokens:</strong> The basic building blocks of your visual language</li><li><strong>Component Library:</strong> Reusable UI components with clear documentation</li><li><strong>Style Guide:</strong> Guidelines for typography, color, spacing, and imagery</li></ul>`,
          image: "https://images.pexels.com/photos/196644/pexels-photo-196644.jpeg?auto=compress&cs=tinysrgb&w=800",
          published: true,
        },
        {
          title: "Machine Learning for Beginners",
          slug: "machine-learning-for-beginners",
          category: "Technology",
          author: "Alex Johnson",
          readTime: "15 min read",
          excerpt: "A comprehensive guide to getting started with machine learning, from basic concepts to practical applications.",
          content: `<p>Machine learning has become one of the most exciting and rapidly growing fields in technology. Whether you're a developer, data scientist, or simply curious about AI, understanding the fundamentals of machine learning is essential in today's digital world.</p><h2>What is Machine Learning?</h2><p>Machine learning is a subset of artificial intelligence that enables computers to learn and improve from experience without being explicitly programmed.</p>`,
          image: "https://images.pexels.com/photos/8386440/pexels-photo-8386440.jpeg?auto=compress&cs=tinysrgb&w=800",
          published: true,
        },
        {
          title: "Building Scalable Web Applications",
          slug: "building-scalable-web-applications",
          category: "Development",
          author: "Marcus Rodriguez",
          readTime: "12 min read",
          excerpt: "Learn the essential principles and best practices for creating web applications that can handle millions of users.",
          content: `<p>Building scalable web applications is one of the most challenging aspects of modern software development. As your user base grows, your application must be able to handle increased traffic, data, and complexity without compromising performance or user experience.</p>`,
          image: "https://images.pexels.com/photos/1181263/pexels-photo-1181263.jpeg?auto=compress&cs=tinysrgb&w=800",
          published: true,
        },
        {
          title: "Cybersecurity in the Modern Era",
          slug: "cybersecurity-in-the-modern-era",
          category: "Security",
          author: "David Kim",
          readTime: "10 min read",
          excerpt: "Understanding the evolving landscape of cybersecurity threats and how to protect your digital assets.",
          content: `<p>In today's interconnected world, cybersecurity has become more critical than ever. With the increasing sophistication of cyber threats and the growing reliance on digital systems, organizations must stay ahead of potential security risks.</p>`,
          image: "https://images.pexels.com/photos/60504/security-protection-anti-virus-software-60504.jpeg?auto=compress&cs=tinysrgb&w=800",
          published: true,
        },
        {
          title: "The Rise of Remote Work Culture",
          slug: "the-rise-of-remote-work-culture",
          category: "Business",
          author: "Lisa Park",
          readTime: "7 min read",
          excerpt: "Exploring how remote work has transformed business culture and what leaders need to know for success.",
          content: `<p>The shift to remote work has fundamentally changed how businesses operate and how employees collaborate. What began as a temporary response to global circumstances has evolved into a permanent transformation of workplace culture.</p>`,
          image: "https://images.pexels.com/photos/4226140/pexels-photo-4226140.jpeg?auto=compress&cs=tinysrgb&w=800",
          published: true,
        },
      ];

      await Blog.insertMany(initialBlogs);
      logger.info(`📚 Seeded ${initialBlogs.length} initial blog posts into MongoDB database.`);
    }
  } catch (error) {
    logger.error('Error seeding database:', error.message);
  }
};
