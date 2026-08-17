// routes/twin.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');
const twinController = require('../controllers/twinController');

router.use(protect);

router.get('/roles', twinController.getRoles);
router.get('/me', twinController.getMyTwin);
router.post('/build', twinController.buildTwin);
router.get('/history', twinController.getHistory);
router.post('/parse-resume', upload.resumeUpload.single('resume'), twinController.parseResume);

module.exports = router;