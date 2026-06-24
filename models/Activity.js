// models/Activity.js — Tracks recent user activity for dashboard
const mongoose = require('mongoose');

const ActivitySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['note_created', 'note_updated', 'resume_saved', 'code_run', 'ai_chat', 'challenge_completed', 'login'],
    required: true
  },
  description: {
    type: String,
    required: true
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed, // flexible extra data
    default: {}
  },
  createdAt: {
    type: Date,
    default: Date.now,
    // Auto-delete activity logs older than 30 days to save space
    expires: 60 * 60 * 24 * 30
  }
});

// Index for fast user activity queries
ActivitySchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Activity', ActivitySchema);
