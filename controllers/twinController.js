// controllers/twinController.js
const fs = require('fs/promises');
const path = require('path');
const { PDFParse } = require('pdf-parse');
const mammoth = require('mammoth');

const CareerTwin = require('../models/CareerTwin');
const marketData = require('../data/marketDemand');
const { generateCareerTwin } = require('../services/twinAiService');
const { fetchGithubSignals } = require('../services/githubService');

// GET /api/twin/roles
exports.getRoles = (req, res) => {
  res.json({ success: true, roles: Object.keys(marketData.roles) });
};

// GET /api/twin/me
exports.getMyTwin = async (req, res) => {
  const twin = await CareerTwin.findOne({ user: req.user._id });
  if (!twin) {
    return res.status(404).json({ success: false, message: 'No Career Twin yet. Build one first.' });
  }
  res.json({ success: true, twin });
};

// POST /api/twin/build
exports.buildTwin = async (req, res) => {
  try {
    const { resumeText, manualSkills, certifications, projects, githubUsername, targetRole } = req.body;

    if (!targetRole) {
      return res.status(400).json({ success: false, message: 'A target role is required to build your Career Twin.' });
    }

    const githubRepos = githubUsername ? await fetchGithubSignals(githubUsername) : [];

    const analysis = await generateCareerTwin({
      resumeText,
      manualSkills,
      certifications,
      projects,
      githubRepos,
      targetRole
    });

    let twin = await CareerTwin.findOne({ user: req.user._id });
    const historyEntry = {
      date: new Date(),
      readinessScore: analysis.readinessScore,
      skillCount: (analysis.skills || []).length,
      note: twin ? 'Twin updated' : 'Twin created'
    };

    if (twin) {
      twin.sources = { resumeText, githubUsername, manualSkills, certifications, projects };
      twin.skills = analysis.skills;
      twin.strengths = analysis.strengths;
      twin.gaps = analysis.gaps;
      twin.roadmap = analysis.roadmap;
      twin.targetRole = targetRole;
      twin.readinessScore = analysis.readinessScore;
      twin.predictedSalary = analysis.predictedSalary;
      twin.aiSummary = analysis.aiSummary;
      twin.lastAnalyzedAt = new Date();
      twin.history.push(historyEntry);
      await twin.save();
    } else {
      twin = await CareerTwin.create({
        user: req.user._id,
        sources: { resumeText, githubUsername, manualSkills, certifications, projects },
        skills: analysis.skills,
        strengths: analysis.strengths,
        gaps: analysis.gaps,
        roadmap: analysis.roadmap,
        targetRole,
        readinessScore: analysis.readinessScore,
        predictedSalary: analysis.predictedSalary,
        aiSummary: analysis.aiSummary,
        lastAnalyzedAt: new Date(),
        history: [historyEntry]
      });
    }

    res.json({ success: true, twin });
  } catch (err) {
    console.error('[twinController.buildTwin]', err);
    res.status(500).json({ success: false, message: err.message || 'Failed to build Career Twin.' });
  }
};

// GET /api/twin/history
exports.getHistory = async (req, res) => {
  const twin = await CareerTwin.findOne({ user: req.user._id }).select('history');
  if (!twin) return res.status(404).json({ success: false, message: 'No Career Twin yet.' });
  res.json({ success: true, history: twin.history });
};

// POST /api/twin/parse-resume
exports.parseResume = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded.' });
  }

  const filePath = req.file.path;
  const ext = path.extname(req.file.originalname).toLowerCase();
  let parser = null;

  try {
    const buffer = await fs.readFile(filePath);
    let text = '';

    if (ext === '.pdf') {
      parser = new PDFParse({ data: buffer });
      const result = await parser.getText();
      text = result.text;
    } else {
      // .doc / .docx
      const result = await mammoth.extractRawText({ buffer });
      text = result.value;
    }

    text = text.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();

    if (!text || text.length < 20) {
      return res.status(422).json({
        success: false,
        message: 'Could not extract readable text from this file. Try pasting your resume text manually instead.'
      });
    }

    res.json({ success: true, text, filename: req.file.originalname });
  } catch (err) {
    console.error('[twinController.parseResume]', err);
    res.status(500).json({ success: false, message: err.message || 'Failed to parse resume.' });
  } finally {
    if (parser) await parser.destroy().catch(() => {});
    fs.unlink(filePath).catch(() => {});
  }
};