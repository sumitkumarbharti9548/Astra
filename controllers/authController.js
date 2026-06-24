// controllers/authController.js
const jwt      = require('jsonwebtoken');
const User     = require('../models/User');
const Activity = require('../models/Activity');

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '7d' });

// ── FIXED: role field was missing — upload button needs it ────
const sendTokenResponse = (user, statusCode, res) => {
  const token = generateToken(user._id);
  const userData = {
    _id:        user._id,
    name:       user.name,
    email:      user.email,
    role:       user.role,       // ← THIS was missing! fixed now
    avatar:     user.avatar,
    bio:        user.bio,
    university: user.university,
    course:     user.course,
    stats:      user.stats,
    createdAt:  user.createdAt
  };
  res.status(statusCode).json({ success: true, token, user: userData });
};

// POST /api/auth/signup
exports.signup = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (await User.findOne({ email }))
      return res.status(400).json({ success: false, message: 'Email already registered' });

    // Auto-assign admin role if email matches ADMIN_EMAIL in .env
    const role = email.toLowerCase() === (process.env.ADMIN_EMAIL || '').toLowerCase()
      ? 'admin' : 'student';

    const user = await User.create({ name, email, password, role });

    await Activity.create({
      user: user._id, type: 'login',
      description: 'Created account and joined Student Notes Hub 🎉'
    });

    user.notifications.push({
      message: `Welcome to Student Notes Hub, ${name}! ${role === 'admin' ? '👑 Admin access granted.' : 'Start by generating your first AI note.'}`,
      type: 'success'
    });
    await user.save();

    sendTokenResponse(user, 201, res);
  } catch (error) { next(error); }
};

// POST /api/auth/login
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, message: 'Please provide email and password' });

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.matchPassword(password)))
      return res.status(401).json({ success: false, message: 'Invalid email or password' });

    // ── FIXED: auto-promote if ADMIN_EMAIL matches but role wasn't set ──
    if (
      email.toLowerCase() === (process.env.ADMIN_EMAIL || '').toLowerCase() &&
      user.role !== 'admin'
    ) {
      user.role = 'admin';
      console.log(`✅ Promoted ${email} to admin (matched ADMIN_EMAIL)`);
    }

    // Update streak
    const today = new Date().toDateString();
    const last  = new Date(user.stats.lastActiveDate || user.stats.lastActive || Date.now()).toDateString();
    const yest  = new Date(Date.now() - 86400000).toDateString();
    if (last !== today) {
      user.stats.streak = last === yest ? (user.stats.streak || 0) + 1 : 1;
      user.stats.lastActiveDate = Date.now();
    }

    await user.save();

    await Activity.create({
      user: user._id, type: 'login',
      description: `Logged in — Day ${user.stats.streak || 1} streak 🔥`
    });

    sendTokenResponse(user, 200, res);
  } catch (error) { next(error); }
};

// GET /api/auth/me
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({ success: true, user });
  } catch (error) { next(error); }
};

// PUT /api/auth/profile
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, bio, university, course, avatar } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, bio, university, course, avatar },
      { new: true, runValidators: true }
    );
    res.json({ success: true, user });
  } catch (error) { next(error); }
};

// PUT /api/auth/change-password
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');
    if (!(await user.matchPassword(currentPassword)))
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    user.password = newPassword;
    await user.save();
    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) { next(error); }
};

// GET /api/auth/notifications
exports.getNotifications = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('notifications');
    const sorted = user.notifications.sort((a, b) => b.createdAt - a.createdAt).slice(0, 20);
    res.json({ success: true, notifications: sorted });
  } catch (error) { next(error); }
};

// PUT /api/auth/notifications/read
exports.markNotificationsRead = async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { $set: { 'notifications.$[].read': true } });
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) { next(error); }
};

// GET /api/auth/role — quick role check for frontend
exports.getRole = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('role email name');
    res.json({ success: true, role: user.role, name: user.name, email: user.email });
  } catch (error) { next(error); }
};
