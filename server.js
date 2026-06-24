// server.js — Main Express server entry point
require('dotenv').config(); // Load .env variables first

const express  = require('express');
const cors     = require('cors');
const helmet   = require('helmet');
const morgan   = require('morgan');
const rateLimit = require('express-rate-limit');
const path     = require('path');

const connectDB    = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// ── Connect to MongoDB ────────────────────────────────────────
connectDB();

const app = express();

// ── Security & Performance Middleware ────────────────────────
app.use(helmet({
  contentSecurityPolicy: false // Allow CDN resources from our HTML files
}));

app.use(cors({
  origin: process.env.CLIENT_URL || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting — prevent abuse (100 requests per 15 minutes)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter);

// Stricter limit for auth routes (10 attempts per 15 min)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many login attempts. Please try again in 15 minutes.' }
});
app.use('/api/auth/login',  authLimiter);
app.use('/api/auth/signup', authLimiter);

// ── Body Parser ───────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Logging (only in development) ────────────────────────────
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ── Serve Static Frontend Files ───────────────────────────────
// All your HTML/CSS/JS files go in the /public folder
app.use(express.static(path.join(__dirname, 'public')));

// ── API Routes ────────────────────────────────────────────────
app.use('/api/auth',      require('./routes/auth'));
app.use('/api/notes',     require('./routes/notes'));
app.use('/api/resume',    require('./routes/resume'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/ai',        require('./routes/ai'));
app.use('/api/study',     require('./routes/studymaterial'));

// ── Health Check ─────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Student Notes Hub API is running 🚀',
    timestamp: new Date().toISOString()
  });
});

// ── Catch-all: Serve frontend for any non-API route ──────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ── Global Error Handler (must be last) ──────────────────────
app.use(errorHandler);

// ── Start Server ──────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚀 Server running on http://localhost:${PORT}`);
  console.log(`📁 Serving frontend from /public`);
  console.log(`🔌 Environment: ${process.env.NODE_ENV || 'development'}\n`);
});
