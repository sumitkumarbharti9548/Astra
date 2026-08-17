const VoiceCoachSession = require('../models/VoiceCoach');
const { getCoachReply } = require('../services/voiceCoachAiService');

// @desc    Start a new voice coach session (practice / interview / gd / rapidfire)
// @route   POST /api/voice-coach/start
// @access  Private
exports.startSession = async (req, res) => {
  try {
    const { mode, companyName, jobRole, experience, difficulty, gdTopic } = req.body;

    const validModes = ['practice', 'interview', 'gd', 'rapidfire'];
    if (!validModes.includes(mode)) {
      return res.status(400).json({
        success: false,
        message: `mode must be one of: ${validModes.join(', ')}`
      });
    }

    const session = await VoiceCoachSession.create({
      user: req.user._id,
      mode,
      interviewSetup:
        mode === 'interview'
          ? { companyName, jobRole, experience, difficulty: difficulty || 'medium' }
          : undefined,
      gdTopic: mode === 'gd' ? gdTopic : undefined,
      turns: []
    });

    const aiResult = await getCoachReply(session, '');

    session.turns.push({
      role: 'coach',
      text: aiResult.reply,
      language: aiResult.language || 'en',
      feedback: aiResult.feedback || undefined,
      interviewFeedback: aiResult.interviewFeedback || undefined
    });
    await session.save();

    return res.status(201).json({
      success: true,
      message: 'Voice coach session started',
      data: {
        sessionId: session._id,
        mode: session.mode,
        reply: aiResult.reply,
        language: aiResult.language
      }
    });
  } catch (error) {
    console.error('startSession error:', error.message);
    return res.status(500).json({ success: false, message: 'Failed to start voice coach session' });
  }
};

// @desc    Send a transcribed user turn and get the coach's next reply + feedback
// @route   POST /api/voice-coach/:sessionId/message
// @access  Private
exports.sendMessage = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: 'text is required' });
    }

    const session = await VoiceCoachSession.findOne({ _id: sessionId, user: req.user._id });
    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }
    if (session.status === 'completed') {
      return res.status(400).json({ success: false, message: 'This session has already ended' });
    }

    // Record the user's turn first (without feedback yet - filled in by the AI's response).
    session.turns.push({ role: 'user', text: text.trim() });

    const aiResult = await getCoachReply(session, text.trim());

    // Attach the AI-generated feedback to the user's turn we just pushed.
    const lastUserTurn = session.turns[session.turns.length - 1];
    lastUserTurn.language = aiResult.language || 'en';
    lastUserTurn.feedback = aiResult.feedback || undefined;
    lastUserTurn.interviewFeedback = aiResult.interviewFeedback || undefined;

    session.turns.push({
      role: 'coach',
      text: aiResult.reply,
      language: aiResult.language || 'en'
    });

    if (aiResult.sessionComplete) {
      session.status = 'completed';
      session.completedAt = new Date();
      session.summary = buildSummary(session);
    }

    await session.save();

    return res.status(200).json({
      success: true,
      message: 'Reply generated',
      data: {
        reply: aiResult.reply,
        language: aiResult.language,
        feedback: aiResult.feedback,
        interviewFeedback: aiResult.interviewFeedback,
        sessionComplete: !!aiResult.sessionComplete,
        summary: session.status === 'completed' ? session.summary : undefined
      }
    });
  } catch (error) {
    console.error('sendMessage error:', error.message);
    return res.status(500).json({ success: false, message: 'Failed to get coach reply' });
  }
};

// @desc    Manually end a session (user hits "stop") and compute a summary
// @route   POST /api/voice-coach/:sessionId/end
// @access  Private
exports.endSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await VoiceCoachSession.findOne({ _id: sessionId, user: req.user._id });
    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    session.status = 'completed';
    session.completedAt = new Date();
    session.summary = buildSummary(session);
    await session.save();

    return res.status(200).json({ success: true, message: 'Session ended', data: { summary: session.summary } });
  } catch (error) {
    console.error('endSession error:', error.message);
    return res.status(500).json({ success: false, message: 'Failed to end session' });
  }
};

// @desc    Get a single session's full transcript
// @route   GET /api/voice-coach/:sessionId
// @access  Private
exports.getSession = async (req, res) => {
  try {
    const session = await VoiceCoachSession.findOne({ _id: req.params.sessionId, user: req.user._id });
    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }
    return res.status(200).json({ success: true, message: 'Session fetched', data: session });
  } catch (error) {
    console.error('getSession error:', error.message);
    return res.status(500).json({ success: false, message: 'Failed to fetch session' });
  }
};

// @desc    List the user's past sessions (used for dashboard stats/history)
// @route   GET /api/voice-coach
// @access  Private
exports.getMySessions = async (req, res) => {
  try {
    const sessions = await VoiceCoachSession.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .select('mode status summary startedAt completedAt interviewSetup gdTopic')
      .limit(50);

    return res.status(200).json({ success: true, message: 'Sessions fetched', data: sessions });
  } catch (error) {
    console.error('getMySessions error:', error.message);
    return res.status(500).json({ success: false, message: 'Failed to fetch sessions' });
  }
};

function buildSummary(session) {
  const userTurns = session.turns.filter((t) => t.role === 'user');
  const scores = userTurns
    .map((t) => (t.interviewFeedback && t.interviewFeedback.score) || (t.feedback && t.feedback.confidenceRating))
    .filter((s) => typeof s === 'number');

  const overallScore = scores.length ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10 : null;

  const strengths = userTurns
    .map((t) => t.interviewFeedback && t.interviewFeedback.strengths)
    .filter(Boolean)
    .slice(-3)
    .join(' ');

  const areasToImprove = userTurns
    .map((t) => (t.interviewFeedback && t.interviewFeedback.weaknesses) || (t.feedback && t.feedback.grammarFeedback))
    .filter(Boolean)
    .slice(-3)
    .join(' ');

  return {
    overallScore,
    strengths: strengths || 'Keep practicing to build a track record here.',
    areasToImprove: areasToImprove || 'No major issues flagged - nice work.',
    fillerWordCount: null // Reserved: fill in on the client if you tally filler words from the raw transcript.
  };
}