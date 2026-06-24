// models/Note.js — Schema for AI-generated and user notes
const mongoose = require('mongoose');

const NoteSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Note title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  content: {
    type: String,
    required: [true, 'Note content is required']
  },
  topic: {
    type: String,
    trim: true,
    default: ''
  },
  tags: [{
    type: String,
    trim: true
  }],
  subject: {
    type: String,
    default: 'General'
  },
  isAIGenerated: {
    type: Boolean,
    default: false
  },
  isFavorite: {
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

// Update the updatedAt timestamp before saving
NoteSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Note', NoteSchema);
