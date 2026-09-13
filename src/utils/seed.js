import { Admin } from '../modules/auth/admin.model.js';
import { Blog } from '../modules/blog/blog.model.js';
import { Job } from '../modules/career/job.model.js';
import { CareerCMS } from '../modules/career/careerCMS.model.js';
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
      existingAdmin.password = adminPassword;
      await existingAdmin.save();
      logger.info(`🔑 Admin user updated: ${adminEmail}`);
    }

    // 2. Seed Static Blog Data into MongoDB
    const blogCount = await Blog.countDocuments();
    if (blogCount === 0) {
      const initialBlogs = [
        {
          title: 'The Future of AI in Business Automation',
          slug: 'the-future-of-ai-in-business-automation',
          category: 'Technology',
          author: 'Sarah Chen',
          readTime: '8 min read',
          excerpt:
            'Discover how artificial intelligence is revolutionizing business processes and what it means for the future of work.',
          content: `<p>Artificial Intelligence has become the cornerstone of modern business automation, transforming how organizations operate and compete in today's digital landscape. From predictive analytics to intelligent process automation, AI is reshaping industries across the globe.</p><h2>The Current State of AI in Business</h2><p>Today's businesses are leveraging AI in numerous ways, from customer service chatbots to sophisticated data analysis systems. The technology has evolved from simple rule-based systems to complex neural networks capable of learning and adapting to new situations.</p><h2>Key Applications</h2><ul><li><strong>Predictive Analytics:</strong> Forecasting market trends and customer behavior</li><li><strong>Process Automation:</strong> Streamlining repetitive tasks and workflows</li><li><strong>Customer Experience:</strong> Personalizing interactions and recommendations</li><li><strong>Risk Management:</strong> Identifying potential threats and opportunities</li></ul><h2>The Future Outlook</h2><p>As AI technology continues to advance, we can expect even more sophisticated applications in business automation. Machine learning algorithms will become more intuitive, and AI systems will be able to handle increasingly complex tasks with minimal human intervention.</p>`,
          image:
            'https://images.pexels.com/photos/8386434/pexels-photo-8386434.jpeg?auto=compress&cs=tinysrgb&w=800',
          published: true,
        },
        {
          title: 'Design Systems That Scale',
          slug: 'design-systems-that-scale',
          category: 'Design',
          author: 'Emma Thompson',
          readTime: '6 min read',
          excerpt:
            'How to create and maintain design systems that grow with your product and team while ensuring consistency.',
          content: `<p>Design systems have become essential for modern product development, providing the foundation for consistent, scalable user experiences. But creating a design system that truly scales requires careful planning and ongoing maintenance.</p><h2>Building the Foundation</h2><p>A successful design system starts with a strong foundation of design principles, tokens, and components. These elements work together to create a cohesive visual language that can be applied across all touchpoints.</p><h2>Key Components of a Scalable Design System</h2><ul><li><strong>Design Tokens:</strong> The basic building blocks of your visual language</li><li><strong>Component Library:</strong> Reusable UI components with clear documentation</li><li><strong>Style Guide:</strong> Guidelines for typography, color, spacing, and imagery</li></ul>`,
          image:
            'https://images.pexels.com/photos/196644/pexels-photo-196644.jpeg?auto=compress&cs=tinysrgb&w=800',
          published: true,
        },
        {
          title: 'Machine Learning for Beginners',
          slug: 'machine-learning-for-beginners',
          category: 'Technology',
          author: 'Alex Johnson',
          readTime: '15 min read',
          excerpt:
            'A comprehensive guide to getting started with machine learning, from basic concepts to practical applications.',
          content: `<p>Machine learning has become one of the most exciting and rapidly growing fields in technology. Whether you're a developer, data scientist, or simply curious about AI, understanding the fundamentals of machine learning is essential in today's digital world.</p><h2>What is Machine Learning?</h2><p>Machine learning is a subset of artificial intelligence that enables computers to learn and improve from experience without being explicitly programmed.</p>`,
          image:
            'https://images.pexels.com/photos/8386440/pexels-photo-8386440.jpeg?auto=compress&cs=tinysrgb&w=800',
          published: true,
        },
        {
          title: 'Building Scalable Web Applications',
          slug: 'building-scalable-web-applications',
          category: 'Development',
          author: 'Marcus Rodriguez',
          readTime: '12 min read',
          excerpt:
            'Learn the essential principles and best practices for creating web applications that can handle millions of users.',
          content: `<p>Building scalable web applications is one of the most challenging aspects of modern software development. As your user base grows, your application must be able to handle increased traffic, data, and complexity without compromising performance or user experience.</p>`,
          image:
            'https://images.pexels.com/photos/1181263/pexels-photo-1181263.jpeg?auto=compress&cs=tinysrgb&w=800',
          published: true,
        },
        {
          title: 'Cybersecurity in the Modern Era',
          slug: 'cybersecurity-in-the-modern-era',
          category: 'Security',
          author: 'David Kim',
          readTime: '10 min read',
          excerpt:
            'Understanding the evolving landscape of cybersecurity threats and how to protect your digital assets.',
          content: `<p>In today's interconnected world, cybersecurity has become more critical than ever. With the increasing sophistication of cyber threats and the growing reliance on digital systems, organizations must stay ahead of potential security risks.</p>`,
          image:
            'https://images.pexels.com/photos/60504/security-protection-anti-virus-software-60504.jpeg?auto=compress&cs=tinysrgb&w=800',
          published: true,
        },
        {
          title: 'The Rise of Remote Work Culture',
          slug: 'the-rise-of-remote-work-culture',
          category: 'Business',
          author: 'Lisa Park',
          readTime: '7 min read',
          excerpt:
            'Exploring how remote work has transformed business culture and what leaders need to know for success.',
          content: `<p>The shift to remote work has fundamentally changed how businesses operate and how employees collaborate. What began as a temporary response to global circumstances has evolved into a permanent transformation of workplace culture.</p>`,
          image:
            'https://images.pexels.com/photos/4226140/pexels-photo-4226140.jpeg?auto=compress&cs=tinysrgb&w=800',
          published: true,
        },
      ];

      await Blog.insertMany(initialBlogs);
      logger.info(`📚 Seeded ${initialBlogs.length} initial blog posts into MongoDB database.`);
    }

    // 3. Seed Static Career Job Postings into MongoDB
    const jobCount = await Job.countDocuments();
    if (jobCount === 0) {
      const initialJobs = [
        {
          title: 'Frontend Developer',
          slug: 'frontend-developer',
          department: 'Engineering',
          employmentType: 'Full-time',
          location: 'Remote / San Francisco',
          salary: '$80k - $120k',
          experience: '3+ years',
          icon: 'Code',
          shortDescription:
            'Build beautiful, responsive user interfaces using React, TypeScript, and modern CSS frameworks.',
          description:
            'Build beautiful, responsive user interfaces using React, TypeScript, and modern CSS frameworks. Work alongside senior product engineers and designers to deliver high-performance client applications.',
          requirements: [
            '3+ years of React/Next.js experience',
            'Strong TypeScript skills',
            'Experience with modern CSS frameworks',
            'Knowledge of responsive design principles',
          ],
          skills: ['React', 'Next.js', 'TypeScript', 'Tailwind CSS', 'Framer Motion'],
          responsibilities: [
            'Develop responsive component libraries with Next.js & React',
            'Collaborate closely with UI/UX designers',
            'Optimize page load performance and Web Vitals metrics',
          ],
          qualifications: [
            "Bachelor's degree in Computer Science or equivalent practical experience",
            'Proven track record of shipping responsive web apps',
          ],
          benefits: [
            'Flexible Remote Work Options',
            'Health & Wellness Allowance',
            'Annual Learning & Development Budget',
          ],
          openings: 2,
          status: 'PUBLISHED',
          isFeatured: true,
          sortOrder: 1,
          metaTitle: 'Frontend Developer Jobs | EaseMyWeb Careers',
          metaDescription:
            'Join EaseMyWeb as a Frontend Developer. Build modern React and Next.js digital applications with our engineering team.',
        },
        {
          title: 'Backend Developer',
          slug: 'backend-developer',
          department: 'Engineering',
          employmentType: 'Full-time',
          location: 'Remote / New York',
          salary: '$90k - $140k',
          experience: '4+ years',
          icon: 'Database',
          shortDescription:
            'Design and build scalable APIs, microservices, and reliable architectures using Node.js, Python, or Go.',
          description:
            'Design and build scalable APIs, microservices, and reliable architectures using Node.js, Python, or Go. Ensure system security, high availability, and optimal database schema performance.',
          requirements: [
            '4+ years of backend development experience',
            'Experience with databases (SQL / NoSQL / MongoDB)',
            'Knowledge of cloud platforms (AWS / GCP)',
            'Understanding of microservices and REST API architecture',
          ],
          skills: ['Node.js', 'Express', 'MongoDB', 'PostgreSQL', 'REST APIs', 'Docker'],
          responsibilities: [
            'Architect secure API endpoints and database schemas',
            'Maintain system resilience and caching mechanisms',
            'Implement background job queue processing and monitoring',
          ],
          qualifications: [
            "Bachelor's degree in CS, Software Engineering, or equivalent experience",
            'Deep knowledge of API security standards and JWT authentication',
          ],
          benefits: [
            'Competitive Equity Options',
            'Home Office Setup Allowance',
            'Flexible Vacation Policy',
          ],
          openings: 1,
          status: 'PUBLISHED',
          isFeatured: true,
          sortOrder: 2,
          metaTitle: 'Backend Developer Jobs | EaseMyWeb Careers',
          metaDescription:
            'Join EaseMyWeb as a Backend Developer. Build high-scale Node.js microservices and database architectures.',
        },
        {
          title: 'UI/UX Designer',
          slug: 'ui-ux-designer',
          department: 'Design',
          employmentType: 'Full-time',
          location: 'Remote / Los Angeles',
          salary: '$70k - $100k',
          experience: '3+ years',
          icon: 'Palette',
          shortDescription:
            'Create intuitive, engaging, and modern user experiences for multi-platform web applications.',
          description:
            'Create intuitive, engaging, and modern user experiences for multi-platform web applications. Work closely with frontend engineers to produce pixel-perfect responsive layouts.',
          requirements: [
            '3+ years of UI/UX design experience',
            'Proficiency in Figma, Design Systems, and prototyping',
            'Strong portfolio showcasing product design process',
            'Understanding of developer handoff workflows',
          ],
          skills: ['Figma', 'UI Design', 'UX Research', 'Wireframing', 'Design Systems'],
          responsibilities: [
            'Craft seamless user journeys and interactive prototypes',
            'Maintain scalable design tokens and UI component libraries',
            'Conduct user feedback sessions and design reviews',
          ],
          qualifications: [
            'Degree in Product Design, Human-Computer Interaction, or relevant portfolio',
            'Experience working in agile product development teams',
          ],
          benefits: [
            'Hardware & Software Tooling Allowance',
            'Design Conference & Course Sponsorship',
            'Flexible Asynchronous Work',
          ],
          openings: 1,
          status: 'PUBLISHED',
          isFeatured: false,
          sortOrder: 3,
          metaTitle: 'UI/UX Designer Jobs | EaseMyWeb Careers',
          metaDescription:
            'Join EaseMyWeb as a UI/UX Designer. Shape modern digital user interfaces and design systems.',
        },
        {
          title: 'Fullstack Developer',
          slug: 'fullstack-developer',
          department: 'Engineering',
          employmentType: 'Full-time',
          location: 'Remote / Austin',
          salary: '$100k - $150k',
          experience: '5+ years',
          icon: 'Globe',
          shortDescription:
            'Work across the entire architecture to deliver end-to-end solutions for scalable products.',
          description:
            'Work across the entire architecture to deliver end-to-end solutions for scalable products. Lead system feature design from database models to frontend interactive UI components.',
          requirements: [
            '5+ years of fullstack web development',
            'Strong experience with React, Next.js, and Node.js',
            'Database design, indexing, and optimization skills',
            'DevOps awareness and CI/CD deployment pipelines',
          ],
          skills: ['React', 'Next.js', 'Node.js', 'MongoDB', 'AWS', 'CI/CD'],
          responsibilities: [
            'Deliver end-to-end web product features',
            'Integrate third-party API webhooks and data pipelines',
            'Conduct code reviews and champion clean code quality',
          ],
          qualifications: [
            '5+ years building full-stack web applications',
            'Strong understanding of web security and performance optimization',
          ],
          benefits: [
            'Comprehensive Health & Dental Benefits',
            'Annual International Team Retreats',
            'Performance Bonus Structure',
          ],
          openings: 2,
          status: 'PUBLISHED',
          isFeatured: true,
          sortOrder: 4,
          metaTitle: 'Fullstack Developer Jobs | EaseMyWeb Careers',
          metaDescription:
            'Join EaseMyWeb as a Fullstack Developer. Build end-to-end Next.js and Node.js digital applications.',
        },
      ];

      await Job.insertMany(initialJobs);
      logger.info(`💼 Seeded ${initialJobs.length} initial static job postings into MongoDB.`);
    }

    // 4. Seed Career CMS Initial Settings
    const cmsCount = await CareerCMS.countDocuments();
    if (cmsCount === 0) {
      await CareerCMS.create({});
      logger.info(`🎨 Seeded initial Career CMS page settings into MongoDB.`);
    }
  } catch (error) {
    logger.error('Error seeding database:', error.message);
  }
};
