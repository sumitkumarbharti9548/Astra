// controllers/resumeController.js — Resume CRUD + AI enhancement
const Resume = require('../models/Resume');
const User = require('../models/User');
const Activity = require('../models/Activity');
const axios = require('axios');

// ── GET /api/resume — Get user's resumes ─────────────────────
exports.getResumes = async (req, res, next) => {
  try {
    const resumes = await Resume.find({ user: req.user._id }).sort({ updatedAt: -1 });
    res.json({ success: true, count: resumes.length, resumes });
  } catch (error) {
    next(error);
  }
};

// ── POST /api/resume — Save a new resume ─────────────────────
exports.saveResume = async (req, res, next) => {
  try {
    const resumeData = { ...req.body, user: req.user._id };
    const resume = await Resume.create(resumeData);

    await User.findByIdAndUpdate(req.user._id, {
      $inc: { 'stats.resumesBuilt': 1 }
    });

    await Activity.create({
      user: req.user._id,
      type: 'resume_saved',
      description: `Saved resume: "${resume.title || 'My Resume'}"`,
      metadata: { resumeId: resume._id }
    });

    res.status(201).json({ success: true, resume });
  } catch (error) {
    next(error);
  }
};

// ── PUT /api/resume/:id — Update a resume ────────────────────
exports.updateResume = async (req, res, next) => {
  try {
    let resume = await Resume.findOne({ _id: req.params.id, user: req.user._id });
    if (!resume) {
      return res.status(404).json({ success: false, message: 'Resume not found' });
    }

    resume = await Resume.findByIdAndUpdate(req.params.id, req.body, {
      new: true, runValidators: true
    });

    res.json({ success: true, resume });
  } catch (error) {
    next(error);
  }
};

// ── DELETE /api/resume/:id — Delete a resume ─────────────────
exports.deleteResume = async (req, res, next) => {
  try {
    const resume = await Resume.findOne({ _id: req.params.id, user: req.user._id });
    if (!resume) {
      return res.status(404).json({ success: false, message: 'Resume not found' });
    }
    await resume.deleteOne();
    res.json({ success: true, message: 'Resume deleted' });
  } catch (error) {
    next(error);
  }
};

// ── POST /api/resume/enhance — AI enhance resume content ──────
exports.enhanceResume = async (req, res, next) => {
  try {
    const { section, content, jobTitle } = req.body;

    const prompt = `You are a professional resume writer. Improve the following ${section} section for a ${jobTitle || 'student'} resume. Make it more impactful, use action verbs, quantify achievements where possible, and keep it professional.

Original content:
${content}

Return ONLY the improved text, no explanation. Keep the same format (bullet points if the original had them).`;

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.6, maxOutputTokens: 1024 }
      }
    );

    const enhanced = response.data.candidates[0].content.parts[0].text;

    res.json({ success: true, enhanced });
  } catch (error) {
    next(error);
  }
};
