import mongoose from 'mongoose';

const contactSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email address is required'],
      trim: true,
      lowercase: true,
    },
    company: {
      type: String,
      trim: true,
      default: '',
    },
    service: {
      type: String,
      trim: true,
      default: 'General Inquiry',
    },
    subject: {
      type: String,
      trim: true,
      default: '',
    },
    message: {
      type: String,
      required: [true, 'Message content is required'],
      trim: true,
    },
    status: {
      type: String,
      enum: ['new', 'in-progress', 'resolved', 'archived'],
      default: 'new',
    },
  },
  {
    timestamps: true,
  }
);

export const Contact = mongoose.model('Contact', contactSchema);
export default Contact;
