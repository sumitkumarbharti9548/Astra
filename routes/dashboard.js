// routes/dashboard.js
const express = require('express');
const router = express.Router();
const { getDashboard } = require('../controllers/dashboardController');
const { protect } = require('../middleware/auth');
router.get('/', protect, getDashboard);
module.exports = router;

// ────────────────────────────────────────────────────────────────
// Save this as routes/ai.js
// ────────────────────────────────────────────────────────────────
