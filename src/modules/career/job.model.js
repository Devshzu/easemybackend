import mongoose from 'mongoose';

const jobSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Job title is required'],
      trim: true,
    },
    slug: {
      type: String,
      required: [true, 'Job slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    department: {
      type: String,
      required: [true, 'Department is required'],
      trim: true,
      index: true,
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true,
      index: true,
    },
    employmentType: {
      type: String,
      required: [true, 'Employment type is required'],
      trim: true,
      default: 'Full-time',
    },
    experience: {
      type: String,
      required: [true, 'Experience requirement is required'],
      trim: true,
    },
    salary: {
      type: String,
      trim: true,
      default: 'Negotiable',
    },
    shortDescription: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Job description is required'],
      trim: true,
    },
    responsibilities: {
      type: [String],
      default: [],
    },
    requirements: {
      type: [String],
      default: [],
    },
    qualifications: {
      type: [String],
      default: [],
    },
    skills: {
      type: [String],
      default: [],
    },
    benefits: {
      type: [String],
      default: [],
    },
    openings: {
      type: Number,
      default: 1,
    },
    applicationDeadline: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ['DRAFT', 'PUBLISHED', 'CLOSED', 'ARCHIVED'],
      default: 'PUBLISHED',
      index: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
    icon: {
      type: String,
      default: 'Briefcase',
    },
    metaTitle: {
      type: String,
      trim: true,
    },
    metaDescription: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

jobSchema.index({ status: 1, department: 1, createdAt: -1 });

export const Job = mongoose.model('Job', jobSchema);
export default Job;
