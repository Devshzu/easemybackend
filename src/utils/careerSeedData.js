/**
 * Shared Career job seed data.
 *
 * Single source of truth used by:
 *  - src/utils/seed.js        (auto-seeds only when the jobs collection is empty)
 *  - scripts/seed-jobs.js     (re-seed script that replaces existing job records)
 *
 * All roles are based at the Noida office. Salary is intentionally omitted
 * (kept private / "Negotiable") and is not shown on the public career pages.
 */

const JOB_LOCATION = 'Noida, Uttar Pradesh';

export const initialJobs = [
  {
    title: 'Business Development Executive (BDE)',
    slug: 'business-development-executive',
    department: 'Sales & Business Development',
    employmentType: 'Full-time',
    location: JOB_LOCATION,
    experience: '0 - 2 years',
    icon: 'Briefcase',
    shortDescription:
      'Generate leads, pitch our web & digital services, and build lasting client relationships that drive company growth.',
    description:
      'As a Business Development Executive at EaseMyWeb, you will be the front line of our growth engine. You will identify potential clients, pitch our website design, development, and digital marketing services, and nurture relationships from the first call through to closing. This is a great opportunity for a driven communicator to grow into a senior sales role.',
    responsibilities: [
      'Identify and generate new business leads through calls, emails, and online research',
      'Pitch EaseMyWeb services (web design, development, SEO, digital marketing) to prospects',
      'Follow up on inbound enquiries and convert them into paying clients',
      'Maintain and update client records in the CRM',
      'Coordinate with the delivery team to ensure client requirements are met',
    ],
    requirements: [
      'Excellent verbal and written communication skills',
      'Confidence in cold calling and client interaction',
      'Basic understanding of websites and digital services (preferred)',
      'Self-motivated with a target-driven attitude',
    ],
    skills: ['Lead Generation', 'Client Communication', 'Sales', 'CRM', 'Negotiation'],
    qualifications: [
      'Graduate in any discipline (BBA / B.Com / B.Tech / MBA preferred)',
      'Freshers with strong communication skills are welcome to apply',
    ],
    benefits: [
      'Attractive performance-based incentives',
      'Clear growth path into senior sales roles',
      'Friendly, energetic team at our Noida office',
    ],
    openings: 3,
    status: 'PUBLISHED',
    isFeatured: true,
    sortOrder: 1,
    metaTitle: 'Business Development Executive Jobs in Noida | EaseMyWeb Careers',
    metaDescription:
      'Join EaseMyWeb as a Business Development Executive in Noida. Generate leads, pitch digital services, and grow your sales career.',
  },
  {
    title: 'Web Developer',
    slug: 'web-developer',
    department: 'Engineering',
    employmentType: 'Full-time',
    location: JOB_LOCATION,
    experience: '1 - 3 years',
    icon: 'Code',
    shortDescription:
      'Build responsive, high-performance websites and web applications for our clients using modern web technologies.',
    description:
      'We are looking for a Web Developer to build and maintain fast, responsive, and visually polished websites for our clients. You will work across HTML, CSS, JavaScript and modern frameworks, turning designs into pixel-perfect, production-ready pages at our Noida office.',
    responsibilities: [
      'Develop responsive websites and web apps from design mockups',
      'Write clean, reusable HTML, CSS, and JavaScript',
      'Integrate CMS, forms, and third-party APIs',
      'Optimize sites for speed, SEO, and cross-browser compatibility',
      'Fix bugs and maintain existing client websites',
    ],
    requirements: [
      '1+ years of hands-on web development experience',
      'Strong knowledge of HTML5, CSS3, and JavaScript',
      'Experience with React / Next.js or WordPress (preferred)',
      'Understanding of responsive and mobile-first design',
    ],
    skills: ['HTML', 'CSS', 'JavaScript', 'React', 'Next.js', 'WordPress'],
    qualifications: [
      'Graduate in Computer Science, IT, or equivalent practical experience',
      'A portfolio or live projects to showcase your work',
    ],
    benefits: [
      'Work on diverse, real client projects',
      'Learning & development support',
      'Collaborative engineering team at our Noida office',
    ],
    openings: 2,
    status: 'PUBLISHED',
    isFeatured: true,
    sortOrder: 2,
    metaTitle: 'Web Developer Jobs in Noida | EaseMyWeb Careers',
    metaDescription:
      'Join EaseMyWeb as a Web Developer in Noida. Build responsive websites and web applications using modern technologies.',
  },
  {
    title: 'Digital Marketing Executive',
    slug: 'digital-marketing-executive',
    department: 'Marketing',
    employmentType: 'Full-time',
    location: JOB_LOCATION,
    experience: '1 - 3 years',
    icon: 'Globe',
    shortDescription:
      'Plan and run digital campaigns across social media, Google Ads, and email to grow our clients online.',
    description:
      'As a Digital Marketing Executive, you will plan, execute, and optimize digital marketing campaigns for EaseMyWeb and our clients. From social media to paid ads and email marketing, you will help brands grow their online presence and generate leads.',
    responsibilities: [
      'Plan and manage social media and paid ad campaigns (Meta, Google Ads)',
      'Create and schedule content across social platforms',
      'Track campaign performance and prepare reports',
      'Run email marketing and lead-nurturing campaigns',
      'Stay updated with the latest digital marketing trends',
    ],
    requirements: [
      '1+ years of digital marketing experience',
      'Hands-on experience with Meta Ads / Google Ads',
      'Familiarity with analytics tools (Google Analytics, Meta Business Suite)',
      'Good copywriting and communication skills',
    ],
    skills: ['Social Media Marketing', 'Google Ads', 'Meta Ads', 'SEO', 'Email Marketing', 'Analytics'],
    qualifications: [
      'Graduate in Marketing, Mass Communication, or any discipline',
      'Digital marketing certification is a plus',
    ],
    benefits: [
      'Performance-based incentives',
      'Access to premium marketing tools',
      'Fast-paced growth environment at our Noida office',
    ],
    openings: 2,
    status: 'PUBLISHED',
    isFeatured: false,
    sortOrder: 3,
    metaTitle: 'Digital Marketing Executive Jobs in Noida | EaseMyWeb Careers',
    metaDescription:
      'Join EaseMyWeb as a Digital Marketing Executive in Noida. Run social, paid, and email campaigns that grow brands online.',
  },
  {
    title: 'SEO Executive',
    slug: 'seo-executive',
    department: 'Marketing',
    employmentType: 'Full-time',
    location: JOB_LOCATION,
    experience: '0 - 2 years',
    icon: 'Zap',
    shortDescription:
      'Improve search rankings for our clients through on-page, off-page, and technical SEO.',
    description:
      'We are hiring an SEO Executive to boost the organic visibility of our clients websites. You will handle keyword research, on-page optimization, link building, and technical SEO to drive rankings and traffic.',
    responsibilities: [
      'Perform keyword research and competitor analysis',
      'Optimize website content, meta tags, and structure (on-page SEO)',
      'Build quality backlinks (off-page SEO)',
      'Monitor rankings, traffic, and technical SEO health',
      'Prepare monthly SEO performance reports',
    ],
    requirements: [
      'Understanding of on-page, off-page, and technical SEO',
      'Familiarity with tools like Google Search Console, Ahrefs, or SEMrush',
      'Basic knowledge of HTML and website structure',
      'Analytical mindset with attention to detail',
    ],
    skills: ['On-Page SEO', 'Off-Page SEO', 'Keyword Research', 'Google Search Console', 'Link Building'],
    qualifications: [
      'Graduate in any discipline',
      'Freshers with SEO knowledge or internships are welcome',
    ],
    benefits: [
      'Hands-on training on live projects',
      'Growth into senior SEO / marketing roles',
      'Supportive team at our Noida office',
    ],
    openings: 2,
    status: 'PUBLISHED',
    isFeatured: false,
    sortOrder: 4,
    metaTitle: 'SEO Executive Jobs in Noida | EaseMyWeb Careers',
    metaDescription:
      'Join EaseMyWeb as an SEO Executive in Noida. Drive organic rankings through on-page, off-page, and technical SEO.',
  },
  {
    title: 'Graphic Designer',
    slug: 'graphic-designer',
    department: 'Design',
    employmentType: 'Full-time',
    location: JOB_LOCATION,
    experience: '1 - 3 years',
    icon: 'Palette',
    shortDescription:
      'Design creatives, social media posts, banners, and branding assets that make our clients stand out.',
    description:
      'We are looking for a creative Graphic Designer to produce eye-catching visuals for websites, social media, ads, and branding. You will collaborate with the marketing and web teams to deliver on-brand designs at our Noida office.',
    responsibilities: [
      'Design social media creatives, banners, brochures, and ads',
      'Create branding assets and marketing collateral',
      'Support the web team with UI graphics and mockups',
      'Ensure designs are consistent with brand guidelines',
      'Deliver high-quality creatives within deadlines',
    ],
    requirements: [
      '1+ years of graphic design experience',
      'Proficiency in Adobe Photoshop, Illustrator, or Canva',
      'Strong sense of layout, colour, and typography',
      'A portfolio showcasing your design work',
    ],
    skills: ['Photoshop', 'Illustrator', 'Canva', 'Branding', 'Social Media Design'],
    qualifications: [
      'Degree or diploma in Graphic Design, Fine Arts, or equivalent',
      'A strong portfolio is required',
    ],
    benefits: [
      'Creative freedom on diverse projects',
      'Modern design tooling',
      'Vibrant creative team at our Noida office',
    ],
    openings: 1,
    status: 'PUBLISHED',
    isFeatured: false,
    sortOrder: 5,
    metaTitle: 'Graphic Designer Jobs in Noida | EaseMyWeb Careers',
    metaDescription:
      'Join EaseMyWeb as a Graphic Designer in Noida. Create standout creatives, branding, and social media designs.',
  },
  {
    title: 'Telecaller / Inside Sales Executive',
    slug: 'telecaller-inside-sales-executive',
    department: 'Sales & Business Development',
    employmentType: 'Full-time',
    location: JOB_LOCATION,
    experience: '0 - 2 years',
    icon: 'Briefcase',
    shortDescription:
      'Connect with prospects over calls, explain our services, and set up qualified meetings for the sales team.',
    description:
      'As a Telecaller / Inside Sales Executive, you will reach out to potential clients over phone, understand their needs, explain EaseMyWeb services, and schedule follow-ups or meetings for the business development team. Great for confident communicators starting their sales career.',
    responsibilities: [
      'Make outbound calls to prospective clients from provided leads',
      'Explain EaseMyWeb services and answer basic queries',
      'Qualify leads and schedule meetings for the BD team',
      'Maintain call records and update the CRM',
      'Achieve daily and monthly calling targets',
    ],
    requirements: [
      'Good communication skills in Hindi and English',
      'Confident and pleasant telephone manner',
      'Basic computer and CRM usage',
      'Willingness to work towards targets',
    ],
    skills: ['Cold Calling', 'Communication', 'Lead Qualification', 'CRM', 'Customer Handling'],
    qualifications: [
      'Graduate / undergraduate in any discipline',
      'Freshers are welcome to apply',
    ],
    benefits: [
      'Fixed salary plus calling incentives',
      'On-the-job sales training',
      'Growth into Business Development roles',
    ],
    openings: 3,
    status: 'PUBLISHED',
    isFeatured: false,
    sortOrder: 6,
    metaTitle: 'Telecaller / Inside Sales Jobs in Noida | EaseMyWeb Careers',
    metaDescription:
      'Join EaseMyWeb as a Telecaller / Inside Sales Executive in Noida. Connect with prospects and grow your sales career.',
  },
  {
    title: 'UI/UX Designer',
    slug: 'ui-ux-designer',
    department: 'Design',
    employmentType: 'Full-time',
    location: JOB_LOCATION,
    experience: '1 - 3 years',
    icon: 'Palette',
    shortDescription:
      'Design clear, accessible interfaces and user journeys for websites and digital products.',
    description:
      'EaseMyWeb is looking for a UI/UX Designer to turn business goals and user needs into polished web experiences. You will work closely with developers, clients, and the marketing team from discovery through handoff, based at our Noida office.',
    responsibilities: [
      'Create user flows, wireframes, prototypes, and responsive interface designs',
      'Translate client briefs and research into practical design solutions',
      'Maintain and improve design systems and reusable UI patterns',
      'Present design decisions and incorporate feedback from clients and teammates',
      'Partner with developers to support accurate, accessible implementation',
    ],
    requirements: [
      'Portfolio demonstrating web or product design work',
      'Confident with Figma and prototyping workflows',
      'Understanding of responsive design, accessibility, and interaction patterns',
      'Clear communication and comfort working with client feedback',
    ],
    skills: ['Figma', 'UI Design', 'UX Research', 'Wireframing', 'Prototyping', 'Design Systems'],
    qualifications: [
      'Degree or diploma in design, human-computer interaction, or equivalent experience',
      'Agency, freelance, or internship experience is welcome',
    ],
    benefits: [
      'Work across varied industries and real client projects',
      'Collaborate directly with development and marketing teams',
      'Learning and development support',
    ],
    openings: 1,
    status: 'PUBLISHED',
    isFeatured: false,
    sortOrder: 7,
    metaTitle: 'UI/UX Designer Jobs in Noida | EaseMyWeb Careers',
    metaDescription:
      'Join EaseMyWeb as a UI/UX Designer in Noida. Design useful, accessible websites and digital product experiences.',
  },
  {
    title: 'Content Writer',
    slug: 'content-writer',
    department: 'Content & Marketing',
    employmentType: 'Full-time',
    location: JOB_LOCATION,
    experience: '1 - 3 years',
    icon: 'Globe',
    shortDescription:
      'Write useful, search-aware content for websites, blogs, landing pages, and social campaigns.',
    description:
      'We are hiring a Content Writer to create clear, original content for EaseMyWeb and its clients. You will work with SEO and marketing colleagues to turn research and briefs into accurate website copy, articles, and campaign content at our Noida office.',
    responsibilities: [
      'Write and edit website pages, blog articles, landing pages, and campaign copy',
      'Research assigned topics and verify claims using reliable sources',
      'Apply SEO briefs naturally, including search intent and internal linking',
      'Coordinate with designers, SEO specialists, and account teams',
      'Revise drafts based on editorial and client feedback while meeting deadlines',
    ],
    requirements: [
      'Strong written English and careful editing skills',
      'Ability to research unfamiliar topics and explain them clearly',
      'Basic understanding of SEO writing and content management systems',
      'Writing samples or a portfolio of published work',
    ],
    skills: ['Copywriting', 'Blog Writing', 'SEO Content', 'Editing', 'Research', 'WordPress'],
    qualifications: [
      'Graduate in English, Journalism, Mass Communication, or a related discipline preferred',
      'Relevant internships and freelance writing experience are welcome',
    ],
    benefits: [
      'Write for a varied portfolio of real businesses',
      'Editorial feedback and opportunities to grow into content strategy',
      'Collaborative marketing team at our Noida office',
    ],
    openings: 1,
    status: 'PUBLISHED',
    isFeatured: false,
    sortOrder: 8,
    metaTitle: 'Content Writer Jobs in Noida | EaseMyWeb Careers',
    metaDescription:
      'Join EaseMyWeb as a Content Writer in Noida. Create useful website, blog, and SEO content for growing businesses.',
  },
  {
    title: 'Client Success Executive',
    slug: 'client-success-executive',
    department: 'Client Services',
    employmentType: 'Full-time',
    location: JOB_LOCATION,
    experience: '1 - 3 years',
    icon: 'Briefcase',
    shortDescription:
      'Coordinate client projects, keep communication clear, and help engagements run smoothly from kickoff to delivery.',
    description:
      'As a Client Success Executive, you will be a dependable point of contact for website and digital marketing clients. You will coordinate briefs, timelines, feedback, and follow-ups between clients and internal delivery teams from our Noida office.',
    responsibilities: [
      'Understand client goals and document clear project briefs and action items',
      'Coordinate timelines, feedback, approvals, and handoffs with internal teams',
      'Keep clients updated and follow up on open questions or deliverables',
      'Identify risks early and help resolve issues with the right team members',
      'Maintain accurate account notes and support client retention',
    ],
    requirements: [
      'Strong written and verbal communication skills in English and Hindi',
      'Organized approach to managing multiple clients and deadlines',
      'Comfortable with spreadsheets, email, and project tracking tools',
      'Customer service, account coordination, or agency experience preferred',
    ],
    skills: ['Client Communication', 'Project Coordination', 'Account Management', 'Documentation', 'Problem Solving'],
    qualifications: [
      'Graduate in any discipline; business or communications studies are a plus',
      'Early-career candidates with strong coordination skills are welcome',
    ],
    benefits: [
      'Build experience across web and digital marketing projects',
      'Work closely with clients and multidisciplinary delivery teams',
      'Clear growth path in account and client services',
    ],
    openings: 1,
    status: 'PUBLISHED',
    isFeatured: false,
    sortOrder: 9,
    metaTitle: 'Client Success Executive Jobs in Noida | EaseMyWeb Careers',
    metaDescription:
      'Join EaseMyWeb as a Client Success Executive in Noida. Coordinate website and digital marketing projects and build strong client relationships.',
  },
];

export default initialJobs;
