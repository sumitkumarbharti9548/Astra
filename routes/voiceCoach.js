const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth'); // adjust path to your actual middleware file
const {
  startSession,
  sendMessage,
  endSession,
  getSession,
  getMySessions
} = require('../controllers/voiceCoachController');

router.use(protect);

router.get('/', getMySessions);
router.post('/start', startSession);
router.get('/:sessionId', getSession);
router.post('/:sessionId/message', sendMessage);
router.post('/:sessionId/end', endSession);

module.exports = router;