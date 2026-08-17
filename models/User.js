// models/User.js
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name: {
    type:      String,
    required:  [true, 'Name is required'],
    trim:      true,
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  email: {
    type:      String,
    required:  [true, 'Email is required'],
    unique:    true,
    lowercase: true,
    trim:      true,
    match:     [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  password: {
    type:      String,
    required:  [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select:    false
  },
  role: {
    type:    String,
    enum:    ['student', 'admin'],
    default: 'student'
  },
  avatar:     { type: String,  default: '' },
  bio:        { type: String,  maxlength: [200, 'Bio cannot exceed 200 characters'], default: '' },
  university: { type: String,  default: '' },
  course:     { type: String,  default: '' },

  // ── Password reset ────────────────────────────────────────
  resetPasswordTokenHash: { type: String, default: null },
  resetPasswordExpires:   { type: Date,   default: null },

  // ── Stats ─────────────────────────────────────────────────
  stats: {
    notesGenerated: { type: Number, default: 0 },
    resumesBuilt:   { type: Number, default: 0 },
    challengesDone: { type: Number, default: 0 },
    codesRun:       { type: Number, default: 0 },
    aiChats:        { type: Number, default: 0 },
    streak:         { type: Number, default: 0 },
    lastActiveDate: { type: Date,   default: Date.now }
  },

  notifications: [{
    message:   { type: String },
    type:      { type: String, enum: ['info', 'success', 'warning'], default: 'info' },
    read:      { type: Boolean, default: false },
    createdAt: { type: Date,   default: Date.now }
  }],

  createdAt: { type: Date, default: Date.now }
});

// ── Hash password before saving ───────────────────────────────
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ── Compare password ──────────────────────────────────────────
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// ── Update streak ─────────────────────────────────────────────
UserSchema.methods.updateStreak = function () {
  const today      = new Date().toDateString();
  const lastActive = new Date(this.stats.lastActiveDate).toDateString();
  const yesterday  = new Date(Date.now() - 86400000).toDateString();
  if (lastActive === today)      return;
  if (lastActive === yesterday)  this.stats.streak += 1;
  else                           this.stats.streak  = 1;
  this.stats.lastActiveDate = Date.now();
};

module.exports = mongoose.model('User', UserSchema);