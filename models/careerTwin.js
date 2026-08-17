// models/CareerTwin.js
const mongoose = require('mongoose');

const SkillSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    category: { type: String, default: 'general' }, // language | framework | tool | soft-skill | concept
    proficiency: { type: Number, min: 0, max: 100, default: 50 },
    evidence: [{ type: String }],
    demandScore: { type: Number, min: 0, max: 100, default: 50 },
    trend: { type: String, enum: ['rising', 'stable', 'declining'], default: 'stable' }
  },
  { _id: false }
);

const RoadmapItemSchema = new mongoose.Schema(
  {
    skill: { type: String, required: true },
    reason: { type: String },
    priority: { type: String, enum: ['high', 'medium', 'low'], default: 'medium' },
    estimatedWeeks: { type: Number, default: 4 },
    resources: [{ type: String }]
  },
  { _id: false }
);

const CareerTwinSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },

    sources: {
      resumeText: { type: String, default: '' },
      githubUsername: { type: String, default: '' },
      manualSkills: [{ type: String }],
      certifications: [{ type: String }],
      projects: [
        {
          title: String,
          description: String,
          techStack: [String],
          link: String
        }
      ]
    },

    skills: [SkillSchema],
    strengths: [{ type: String }],
    gaps: [{ type: String }],
    roadmap: [RoadmapItemSchema],

    targetRole: { type: String, default: '' },
    readinessScore: { type: Number, min: 0, max: 100, default: 0 },
    predictedSalary: {
      currency: { type: String, default: 'INR' },
      min: { type: Number, default: 0 },
      max: { type: Number, default: 0 },
      basis: { type: String, default: '' }
    },
    aiSummary: { type: String, default: '' },

    history: [
      {
        date: { type: Date, default: Date.now },
        readinessScore: Number,
        skillCount: Number,
        note: String
      }
    ],

    lastAnalyzedAt: { type: Date }
  },
  { timestamps: true }
);

module.exports = mongoose.model('CareerTwin', CareerTwinSchema);
