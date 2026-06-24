// controllers/aiController.js — AI Chat + Code Runner
const axios = require('axios');
const User = require('../models/User');
const Activity = require('../models/Activity');

// ── POST /api/ai/chat — AI Chatbot via Gemini ─────────────────
exports.chat = async (req, res, next) => {
  try {
    const { message, history } = req.body;

    if (!message) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }

    // Build conversation history for context
    const contents = [];

    // Add history if provided
    if (history && Array.isArray(history)) {
      history.forEach(msg => {
        contents.push({
          role: msg.role, // 'user' or 'model'
          parts: [{ text: msg.text }]
        });
      });
    }

    // Add the new user message
    contents.push({
      role: 'user',
      parts: [{ text: message }]
    });

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        system_instruction: {
          parts: [{
            text: `You are StudyBot, an expert AI study assistant for students. You help with:
- Explaining complex concepts in simple terms
- Answering academic questions across all subjects
- Helping with homework and assignments
- Providing study tips and strategies
- Generating practice problems and quizzes
- Reviewing and explaining code

Be friendly, encouraging, and educational. Format your responses clearly using markdown when helpful.`
          }]
        },
        contents,
        generationConfig: {
          temperature: 0.8,
          maxOutputTokens: 2048
        }
      }
    );

    const reply = response.data.candidates[0].content.parts[0].text;

    // Update user stats
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { 'stats.aiChats': 1 }
    });

    res.json({ success: true, reply });
  } catch (error) {
    if (error.response?.status === 429) {
      return res.status(429).json({ success: false, message: 'AI is busy. Please try again in a moment.' });
    }
    next(error);
  }
};

// ── POST /api/ai/run-code — Execute code via Judge0 ──────────
exports.runCode = async (req, res, next) => {
  try {
    const { code, language_id, stdin } = req.body;

    if (!code || !language_id) {
      return res.status(400).json({ success: false, message: 'Code and language are required' });
    }

    // Submit code to Judge0
    const submitResponse = await axios.post(
      `${process.env.JUDGE0_BASE_URL}/submissions?base64_encoded=false&wait=true`,
      { source_code: code, language_id, stdin: stdin || '' },
      {
        headers: {
          'X-RapidAPI-Key':  process.env.JUDGE0_API_KEY,
          'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com',
          'Content-Type':    'application/json'
        }
      }
    );

    const result = submitResponse.data;

    // Update user stats
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { 'stats.codesRun': 1 }
    });

    await Activity.create({
      user: req.user._id,
      type: 'code_run',
      description: `Ran code in language ID ${language_id}`,
      metadata: { languageId: language_id, status: result.status?.description }
    });

    res.json({
      success: true,
      output:        result.stdout || '',
      error:         result.stderr || result.compile_output || '',
      status:        result.status?.description || 'Unknown',
      executionTime: result.time,
      memory:        result.memory
    });
  } catch (error) {
    if (error.response?.status === 429) {
      return res.status(429).json({ success: false, message: 'Code runner rate limit reached. Please wait.' });
    }
    next(error);
  }
};
