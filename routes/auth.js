// routes/auth.js
const express = require('express');
const router  = express.Router();
const {
  signup, login, getMe, updateProfile, changePassword,
  getNotifications, markNotificationsRead, getRole,
  forgotPassword, resetPassword
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/signup',            signup);
router.post('/login',             login);
router.get('/me',                 protect, getMe);
router.get('/role',               protect, getRole);
router.put('/profile',            protect, updateProfile);
router.put('/change-password',    protect, changePassword);
router.get('/notifications',      protect, getNotifications);
router.put('/notifications/read', protect, markNotificationsRead);

// Forgot / reset password — public, no auth required
router.post('/forgot-password',   forgotPassword);
router.post('/reset-password',    resetPassword);

module.exports = router;