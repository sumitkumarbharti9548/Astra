// models/Resume.js — Schema for saved resumes
const mongoose = require('mongoose');

const ResumeSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    default: 'My Resume'
  },
  // Personal Info
  personalInfo: {
    name:     { type: String, default: '' },
    email:    { type: String, default: '' },
    phone:    { type: String, default: '' },
    location: { type: String, default: '' },
    linkedin: { type: String, default: '' },
    github:   { type: String, default: '' },
    website:  { type: String, default: '' },
    summary:  { type: String, default: '' }
  },
  // Education entries
  education: [{
    institution: String,
    degree:      String,
    field:       String,
    startYear:   String,
    endYear:     String,
    gpa:         String,
    description: String
  }],
  // Work experience
  experience: [{
    company:     String,
    position:    String,
    startDate:   String,
    endDate:     String,
    current:     Boolean,
    description: String
  }],
  // Skills list
  skills: [{
    category: String,  // e.g. "Programming Languages"
    items:    [String] // e.g. ["Python", "JavaScript"]
  }],
  // Projects
  projects: [{
    name:        String,
    description: String,
    techStack:   [String],
    link:        String,
    github:      String
  }],
  // Certifications
  certifications: [{
    name:         String,
    issuer:       String,
    date:         String,
    credentialId: String
  }],
  // AI-enhanced content
  aiEnhanced: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

ResumeSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Resume', ResumeSchema);
