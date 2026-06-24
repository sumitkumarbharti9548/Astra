// routes/resume.js
const express = require('express');
const router = express.Router();
const { getResumes, saveResume, updateResume, deleteResume, enhanceResume } = require('../controllers/resumeController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.route('/').get(getResumes).post(saveResume);
router.route('/:id').put(updateResume).delete(deleteResume);
router.post('/enhance', enhanceResume);

module.exports = router;
