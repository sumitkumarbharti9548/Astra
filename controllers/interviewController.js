// controllers/interviewController.js
const CareerTwin = require('../models/CareerTwin');
const { generateInterviewQuestion, scoreInterviewAnswer } = require('../services/twinAiService');

// POST /api/interview/question
exports.getQuestion = async (req, res) => {
  try {
    const twin = await CareerTwin.findOne({ user: req.user._id });
    if (!twin) return res.status(404).json({ success: false, message: 'Build your Career Twin first.' });

    const question = await generateInterviewQuestion({
      targetRole: twin.targetRole,
      skills: twin.skills.map((s) => s.name)
    });
    res.json({ success: true, ...question });
  } catch (err) {
    console.error('[interviewController.getQuestion]', err);
    res.status(500).json({ success: false, message: 'Failed to generate interview question.' });
  }
};

// POST /api/interview/score
exports.scoreAnswer = async (req, res) => {
  try {
    const { question, answer } = req.body;
    if (!question || !answer) {
      return res.status(400).json({ success: false, message: 'Question and answer are required.' });
    }
    const twin = await CareerTwin.findOne({ user: req.user._id });
    const result = await scoreInterviewAnswer({
      question,
      answer,
      targetRole: twin ? twin.targetRole : ''
    });
    res.json({ success: true, ...result });
  } catch (err) {
    console.error('[interviewController.scoreAnswer]', err);
    res.status(500).json({ success: false, message: 'Failed to score answer.' });
  }
};
