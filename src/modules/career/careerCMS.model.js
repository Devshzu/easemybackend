import mongoose from 'mongoose';

const perkSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  icon: { type: String, default: 'Zap' },
});

const stepSchema = new mongoose.Schema({
  stepNumber: { type: Number, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
});

const careerCMSSchema = new mongoose.Schema(
  {
    heroTag: {
      type: String,
      default: 'We Are Hiring',
    },
    heroTitle: {
      type: String,
      default: 'Build Your Career In Digital Innovation',
    },
    heroDescription: {
      type: String,
      default:
        'Collaborate with forward-thinking developers and designers. We build scalable digital architectures, enterprise web applications, and seamless user experiences.',
    },
    cultureTitle: {
      type: String,
      default: 'Why Build With Us?',
    },
    cultureDescription: {
      type: String,
      default:
        'We empower engineers and designers with autonomy, high-performance tooling, and balanced workloads.',
    },
    culturePerks: {
      type: [perkSchema],
      default: [
        {
          title: 'Competitive Compensation',
          description: 'Top-tier base pay with performance milestones.',
          icon: 'DollarSign',
        },
        {
          title: 'Remote-First Culture',
          description: 'Work asynchronously from any global time zone.',
          icon: 'Globe',
        },
        {
          title: 'Flexible Scheduling',
          description: 'We focus on completed deliverables, not tracking clocked hours.',
          icon: 'Calendar',
        },
      ],
    },
    hiringProcessTitle: {
      type: String,
      default: 'Interview Sequence',
    },
    hiringProcessSteps: {
      type: [stepSchema],
      default: [
        {
          stepNumber: 1,
          title: 'Application Review',
          description:
            'Assessment of technical credentials and codebase within 3 business days.',
        },
        {
          stepNumber: 2,
          title: 'Technical Architecture Dialogue',
          description:
            '30-45 minute conversational review of past system designs and workflows.',
        },
        {
          stepNumber: 3,
          title: 'Team Synergy & Final Offer',
          description:
            'Sync with lead team contributors, followed by clear written offer terms.',
        },
      ],
    },
    metaTitle: {
      type: String,
      default: 'Career Opportunities | Join Our Web & Digital Engineering Team',
    },
    metaDescription: {
      type: String,
      default:
        'Explore career opportunities at Easemyweb. Build high-impact web and digital products with our engineering and design team.',
    },
  },
  {
    timestamps: true,
  }
);

export const CareerCMS = mongoose.model('CareerCMS', careerCMSSchema);
export default CareerCMS;
