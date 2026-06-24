const express = require('express');
const router  = express.Router();
const {
  signup, login, getMe, updateProfile, changePassword,
  getNotifications, markNotificationsRead, getRole
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/signup',               signup);
router.post('/login',                login);
router.get('/me',                    protect, getMe);
router.get('/role',                  protect, getRole);   // ← new: quick role check
router.put('/profile',               protect, updateProfile);
router.put('/change-password',       protect, changePassword);
router.get('/notifications',         protect, getNotifications);
router.put('/notifications/read',    protect, markNotificationsRead);

module.exports = router;
