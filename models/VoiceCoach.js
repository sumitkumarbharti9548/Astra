const mongoose = require('mongoose');

const turnSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ['user', 'coach'],
      required: true
    },
    text: {
      type: String,
      required: true
    },
    language: {
      type: String,
      enum: ['en', 'hi', 'hinglish'],
      default: 'en'
    },
    feedback: {
      grammarFeedback: String,
      betterSentence: String,
      vocabSuggestion: String,
      confidenceRating: Number
    },
    interviewFeedback: {
      strengths: String,
      weaknesses: String,
      eyeContactTip: String,
      improvedAnswer: String,
      score: Number
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  },
  { _id: false }
);

const voiceCoachSessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    mode: {
      type: String,
      enum: ['practice', 'interview', 'gd', 'rapidfire'],
      required: true
    },
    // Only populated when mode === 'interview'
    interviewSetup: {
      companyName: String,
      jobRole: String,
      experience: String,
      difficulty: {
        type: String,
        enum: ['easy', 'medium', 'hard'],
        default: 'medium'
      }
    },
    // Only populated when mode === 'gd'
    gdTopic: String,
    turns: [turnSchema],
    status: {
      type: String,
      enum: ['active', 'completed'],
      default: 'active'
    },
    summary: {
      overallScore: Number,
      strengths: String,
      areasToImprove: String,
      fillerWordCount: Number
    },
    startedAt: {
      type: Date,
      default: Date.now
    },
    completedAt: Date
  },
  { timestamps: true }
);

voiceCoachSessionSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('VoiceCoachSession', voiceCoachSessionSchema);