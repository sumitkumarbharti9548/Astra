// controllers/notesController.js — CRUD for notes + AI generation
const Note = require('../models/Note');
const User = require('../models/User');
const Activity = require('../models/Activity');
const axios = require('axios');

// ── GET /api/notes — Get all notes for logged-in user ─────────
exports.getNotes = async (req, res, next) => {
  try {
    const { search, subject, favorite } = req.query;
    const query = { user: req.user._id };

    // Filter by search term
    if (search) {
      query.$or = [
        { title:   { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { tags:    { $regex: search, $options: 'i' } }
      ];
    }
    // Filter by subject
    if (subject) query.subject = subject;
    // Filter favorites
    if (favorite === 'true') query.isFavorite = true;

    const notes = await Note.find(query).sort({ updatedAt: -1 });

    res.json({ success: true, count: notes.length, notes });
  } catch (error) {
    next(error);
  }
};

// ── POST /api/notes — Create a new note ──────────────────────
exports.createNote = async (req, res, next) => {
  try {
    const { title, content, topic, tags, subject } = req.body;

    const note = await Note.create({
      user: req.user._id,
      title, content, topic,
      tags: tags || [],
      subject: subject || 'General'
    });

    // Update user stats
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { 'stats.notesGenerated': 1 }
    });

    await Activity.create({
      user: req.user._id,
      type: 'note_created',
      description: `Created note: "${title}"`,
      metadata: { noteId: note._id }
    });

    res.status(201).json({ success: true, note });
  } catch (error) {
    next(error);
  }
};

// ── PUT /api/notes/:id — Update a note ───────────────────────
exports.updateNote = async (req, res, next) => {
  try {
    let note = await Note.findOne({ _id: req.params.id, user: req.user._id });

    if (!note) {
      return res.status(404).json({ success: false, message: 'Note not found' });
    }

    note = await Note.findByIdAndUpdate(req.params.id, req.body, {
      new: true, runValidators: true
    });

    res.json({ success: true, note });
  } catch (error) {
    next(error);
  }
};

// ── DELETE /api/notes/:id — Delete a note ────────────────────
exports.deleteNote = async (req, res, next) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, user: req.user._id });

    if (!note) {
      return res.status(404).json({ success: false, message: 'Note not found' });
    }

    await note.deleteOne();
    res.json({ success: true, message: 'Note deleted' });
  } catch (error) {
    next(error);
  }
};

// ── POST /api/notes/generate — AI note generation via Gemini ──
exports.generateNote = async (req, res, next) => {
  try {
    const { topic, subject, style } = req.body;

    if (!topic) {
      return res.status(400).json({ success: false, message: 'Topic is required' });
    }

    const prompt = `You are an expert academic tutor. Generate comprehensive, well-structured study notes on the topic: "${topic}" for the subject: "${subject || 'General'}".

Style: ${style || 'detailed'}

Format the notes with:
# Main Topic Title
## Key Concepts
- Clear bullet points with explanations
## Important Definitions
- Term: Definition
## Key Formulas / Rules (if applicable)
## Summary Points
- 3-5 bullet points of the most important takeaways
## Practice Questions
- 2-3 questions to test understanding

Make the notes clear, concise, and student-friendly. Use simple language where possible.`;

    // Call Google Gemini API
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 2048 }
      }
    );

    const generatedContent = response.data.candidates[0].content.parts[0].text;

    // Auto-save the generated note to DB
    const note = await Note.create({
      user:          req.user._id,
      title:         `${topic} — AI Notes`,
      content:       generatedContent,
      topic,
      subject:       subject || 'General',
      isAIGenerated: true,
      tags:          ['AI Generated', subject || 'General', topic]
    });

    // Update stats
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { 'stats.notesGenerated': 1 }
    });

    await Activity.create({
      user: req.user._id,
      type: 'note_created',
      description: `Generated AI notes on "${topic}"`,
      metadata: { noteId: note._id, aiGenerated: true }
    });

    res.status(201).json({ success: true, note, content: generatedContent });
  } catch (error) {
    // Gemini API error handling
    if (error.response?.status === 400) {
      return res.status(400).json({ success: false, message: 'Invalid request to AI. Please check your topic.' });
    }
    if (error.response?.status === 429) {
      return res.status(429).json({ success: false, message: 'AI rate limit reached. Please wait a moment.' });
    }
    next(error);
  }
};
