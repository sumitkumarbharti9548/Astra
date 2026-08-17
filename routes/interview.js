// routes/interview.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const interviewController = require('../controllers/interviewController');

router.use(protect);

router.post('/question', interviewController.getQuestion);
router.post('/score', interviewController.scoreAnswer);

module.exports = router;
