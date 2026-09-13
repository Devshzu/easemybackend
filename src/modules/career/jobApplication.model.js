import mongoose from 'mongoose';

const jobApplicationSchema = new mongoose.Schema(
  {
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      required: [true, 'Job ID is required'],
      index: true,
    },
    applicantName: {
      type: String,
      required: [true, 'Applicant name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email address is required'],
      lowercase: true,
      trim: true,
      index: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    experience: {
      type: String,
      required: [true, 'Seniority/Experience level is required'],
      trim: true,
    },
    portfolioUrl: {
      type: String,
      trim: true,
      default: '',
    },
    coverLetter: {
      type: String,
      required: [true, 'Cover letter is required'],
      trim: true,
    },
    resume: {
      type: String,
      default: '',
    },
    resumeOriginalName: {
      type: String,
      default: '',
    },
    resumeMimeType: {
      type: String,
      default: '',
    },
    currentCompany: {
      type: String,
      trim: true,
      default: '',
    },
    currentPosition: {
      type: String,
      trim: true,
      default: '',
    },
    noticePeriod: {
      type: String,
      trim: true,
      default: '',
    },
    expectedSalary: {
      type: String,
      trim: true,
      default: '',
    },
    linkedinUrl: {
      type: String,
      trim: true,
      default: '',
    },
    githubUrl: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: ['NEW', 'REVIEWING', 'SHORTLISTED', 'INTERVIEW', 'SELECTED', 'REJECTED', 'WITHDRAWN'],
      default: 'NEW',
      index: true,
    },
    adminNotes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

jobApplicationSchema.index({ jobId: 1, createdAt: -1 });

export const JobApplication = mongoose.model('JobApplication', jobApplicationSchema);
export default JobApplication;
