const mongoose = require('mongoose');
const { Schema } = mongoose;

const followUpSchema = new Schema({
  type: {
    type: String,
    enum: ['email', 'linkedin', 'call', 'note', 'other'],
    default: 'email',
  },
  content: {
    type: String,
    required: true,
  },
  sentAt: {
    type: Date,
    default: Date.now,
  },
  outcome: {
    type: String, // reply received, no response, etc.
  }
});

const applicationSchema = new Schema({
  jobTitle: {
    type: String,
    required: [true, 'Job title is required'],
    trim: true,
    index: true,
  },
  company: {
    name: { type: String, required: [true, 'Company name is required'], trim: true },
    logoUrl: String,
    website: String,
    email: String,
  },
  jobUrl: {
    type: String,
    trim: true,
  },
  jobDescription: {
    type: String, // Full text for search
  },
  tags: [String],
  status: {
    type: String,
    enum: ['planned', 'applied', 'screening', 'technical', 'interview', 'offer', 'rejected', 'withdrawn'],
    default: 'applied',
    index: true,
  },
  contractType: {
    type: String,
    enum: ['full-time', 'part-time', 'contract', 'freelance', 'internship'],
  },
  seniority: {
    type: String,
    enum: ['junior', 'mid', 'senior', 'lead'],
  },
  locationType: {
    type: String,
    enum: ['remote', 'hybrid', 'onsite'],
  },
  location: {
    city: String,
    country: String,
  },
  techStack: [String],
  foundOn: {
    type: String,
    enum: ['linkedin', 'indeed', 'company', 'email', 'referral', 'other'],
  },
  appliedVia: {
    type: String,
    enum: ['company-website', 'linkedin', 'indeed', 'email', 'recruiter', 'other'],
  },
  salary: {
    min: Number,
    max: Number,
    currency: { type: String, default: 'USD' },
    type: { type: String, enum: ['annual', 'monthly', 'hourly'], default: 'annual' },
  },
  appliedAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
  followUpDate: Date,
  interviewDate: Date,
  
  // Relationships
  contacts: [{
    type: Schema.Types.ObjectId,
    ref: 'Contact',
  }],
  followUps: [followUpSchema],
  
  notes: String,
  resumeUrl: String,
  interviewNotes: String,
  cvVersion: String,
  coverLetter: String,
  
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  }
}, {
  timestamps: true,
});

// Add text index for search functionality later
applicationSchema.index({ 
  jobTitle: 'text', 
  'company.name': 'text', 
  jobDescription: 'text',
  notes: 'text'
});

const Application = mongoose.model('Application', applicationSchema);

module.exports = Application;
