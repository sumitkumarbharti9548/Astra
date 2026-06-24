// controllers/dashboardController.js — Dashboard stats and activity
const User = require('../models/User');
const Note = require('../models/Note');
const Resume = require('../models/Resume');
const Activity = require('../models/Activity');

// ── GET /api/dashboard — Full dashboard data ─────────────────
exports.getDashboard = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Run all queries in parallel for speed
    const [user, noteCount, resumeCount, recentActivity, recentNotes] = await Promise.all([
      User.findById(userId).select('-password'),
      Note.countDocuments({ user: userId }),
      Resume.countDocuments({ user: userId }),
      Activity.find({ user: userId }).sort({ createdAt: -1 }).limit(8),
      Note.find({ user: userId }).sort({ createdAt: -1 }).limit(4).select('title subject createdAt isAIGenerated')
    ]);

    res.json({
      success: true,
      dashboard: {
        user,
        stats: {
          ...user.stats,
          totalNotes:   noteCount,
          totalResumes: resumeCount
        },
        recentActivity,
        recentNotes,
        unreadNotifications: user.notifications.filter(n => !n.read).length
      }
    });
  } catch (error) {
    next(error);
  }
};
