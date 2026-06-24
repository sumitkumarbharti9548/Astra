// routes/ai.js
const express = require('express');
const router = express.Router();
const { chat, runCode } = require('../controllers/aiController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.post('/chat',     chat);
router.post('/run-code', runCode);

module.exports = router;
