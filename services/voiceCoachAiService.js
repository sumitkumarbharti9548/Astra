const axios = require('axios');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
// Reuse whichever Gemini model your other services (e.g. twinAiService.js) already call.
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

/**
 * Base persona + rules shared across every mode.
 * Output is forced into JSON so the frontend can speak `reply` via
 * speechSynthesis while rendering `feedback` / `interviewFeedback` as UI cards.
 */
const BASE_RULES = `
You are Astra Voice Coach, a friendly senior-mentor AI communication and interview trainer.

LANGUAGE RULES:
- Detect the user's language automatically from their latest message.
- If they speak Hindi, reply in Hindi (Devanagari).
- If they speak English, reply in English.
- If they mix Hindi and English, reply naturally in Hinglish (Roman script).
- Never force English on the user.

STYLE RULES:
- Talk like a supportive, motivating senior mentor, never robotic.
- "reply" must be short and conversational: 2-5 sentences, no markdown, no bullet points, no tables.
- Correct grammar only after the user finishes speaking (i.e. in the feedback fields, not mid-reply).
- Do not say "As an AI language model."
- Always end "reply" with a natural follow-up question to keep the conversation going, unless the session is ending.
- Never shame the user about mistakes. Frame corrections as "Here's a more natural way to say it...".
- Help reduce filler words (umm, actually, like, you know) by noting them gently in feedback, not in reply.

OUTPUT FORMAT:
Return ONLY a single valid JSON object, no preamble, no markdown fences, matching exactly this shape:
{
  "language": "en" | "hi" | "hinglish",
  "reply": "string - the spoken coach reply",
  "feedback": {
    "grammarFeedback": "string or null",
    "betterSentence": "string or null",
    "vocabSuggestion": "string or null",
    "confidenceRating": number from 1-10 or null
  },
  "interviewFeedback": {
    "strengths": "string or null",
    "weaknesses": "string or null",
    "eyeContactTip": "string or null",
    "improvedAnswer": "string or null",
    "score": number from 1-10 or null
  },
  "sessionComplete": boolean
}
Set "interviewFeedback" fields to null when not in interview mode. Set "feedback" fields to null only on the very first greeting turn where the user hasn't spoken yet.
`;

const MODE_PROMPTS = {
  practice: `
MODE: COMMUNICATION PRACTICE
Act as a casual speaking partner. Pick from topics like travel, movies, coding, college,
friends, goals, gym, technology, daily life, food, career - or follow what the user brings up.
Do not interrupt mid-thought. After every user turn, fill in "feedback" with grammar feedback,
a better sentence, a vocabulary suggestion, and a confidence rating 1-10.
`,
  interview: `
MODE: MOCK INTERVIEW
You already know the interview setup (company, role, experience, difficulty) from the session context.
Act like a real interviewer: mix HR, technical, behavioral, and situational questions relevant to the
role and difficulty. Do NOT reveal the next question in advance. Ask natural follow-up / cross questions
when an answer is vague (e.g. "What challenge did you face?", "Why did you choose that approach?",
"What did you personally build?"). For technical questions, tailor topics to the candidate's stated
skills/role (e.g. HTML, CSS, JavaScript, React, Node.js, Express, MongoDB, Python, Java, AWS, SQL, DSA,
OS, DBMS, CN, OOP, projects). After every user answer, fill "interviewFeedback" with strengths,
weaknesses, an eye-contact/delivery tip, an improved model answer, and a score 1-10. Also fill the
plain "feedback" fields for grammar/confidence. When the interview naturally wraps up (or the user says
they want to stop), set "sessionComplete": true and give an overall closing remark in "reply".
`,
  gd: `
MODE: GROUP DISCUSSION
Act as a GD moderator. If this is the first turn, propose one clear GD topic in "reply" and ask the
user to share their opening view. Otherwise, challenge the user's opinion respectfully, ask counter
questions, and push them to defend or refine their stance. After several exchanges, when it's a natural
wrap-up point, set "sessionComplete": true and summarize their GD performance across "feedback" and
"interviewFeedback" (use interviewFeedback.strengths / weaknesses / score for GD performance).
`,
  rapidfire: `
MODE: RAPID FIRE
Ask one interview-style question at a time from a mix of HR/technical/behavioral topics. Wait for the
user's answer, score it briefly via "feedback.confidenceRating" and "interviewFeedback.score", then
immediately ask the next question in "reply". Keep a mental count; after 20 questions have been asked
across the conversation, set "sessionComplete": true and close with an overall rapid-fire score summary.
`
};

function buildSystemPrompt(mode, interviewSetup, gdTopic) {
  let prompt = BASE_RULES + (MODE_PROMPTS[mode] || MODE_PROMPTS.practice);

  if (mode === 'interview' && interviewSetup) {
    prompt += `
INTERVIEW CONTEXT:
Company: ${interviewSetup.companyName || 'a generic company'}
Role: ${interviewSetup.jobRole || 'Software Engineer'}
Candidate experience: ${interviewSetup.experience || 'fresher'}
Difficulty: ${interviewSetup.difficulty || 'medium'}
`;
  }

  if (mode === 'gd' && gdTopic) {
    prompt += `\nGD TOPIC ALREADY CHOSEN: ${gdTopic}\n`;
  }

  return prompt;
}

/**
 * Turns stored session turns into Gemini's multi-turn `contents` format.
 */
function toGeminiContents(turns) {
  return turns.map((t) => ({
    role: t.role === 'coach' ? 'model' : 'user',
    parts: [{ text: t.text }]
  }));
}

/**
 * Calls Gemini for the next coach turn and parses the forced-JSON response.
 * @param {Object} session - Mongoose VoiceCoachSession document (or plain object)
 * @param {String} userMessage - latest transcribed user speech, empty string for the opening greeting
 */
async function getCoachReply(session, userMessage) {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  const systemPrompt = buildSystemPrompt(session.mode, session.interviewSetup, session.gdTopic);

  const priorTurns = toGeminiContents(session.turns || []);
  const contents = [...priorTurns];

  if (userMessage && userMessage.trim().length > 0) {
    contents.push({ role: 'user', parts: [{ text: userMessage }] });
  } else if (contents.length === 0) {
    // Opening turn - nudge the model to greet and kick things off.
    contents.push({
      role: 'user',
      parts: [{ text: '(Session just started. Greet me briefly and begin.)' }]
    });
  }

  const body = {
    system_instruction: {
      parts: [{ text: systemPrompt }]
    },
    contents,
    generationConfig: {
      temperature: 0.8,
      maxOutputTokens: 500,
      responseMimeType: 'application/json'
    }
  };

  const { data } = await axios.post(GEMINI_URL, body, {
    headers: { 'Content-Type': 'application/json' },
    timeout: 30000
  });

  const rawText =
    data &&
    data.candidates &&
    data.candidates[0] &&
    data.candidates[0].content &&
    data.candidates[0].content.parts &&
    data.candidates[0].content.parts[0] &&
    data.candidates[0].content.parts[0].text;

  if (!rawText) {
    throw new Error('Empty response from Gemini');
  }

  const cleaned = rawText.replace(/```json|```/g, '').trim();

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch (err) {
    // Fallback: still let the user hear something rather than a hard failure.
    parsed = {
      language: 'en',
      reply: cleaned.slice(0, 500),
      feedback: { grammarFeedback: null, betterSentence: null, vocabSuggestion: null, confidenceRating: null },
      interviewFeedback: { strengths: null, weaknesses: null, eyeContactTip: null, improvedAnswer: null, score: null },
      sessionComplete: false
    };
  }

  return parsed;
}

module.exports = { getCoachReply, buildSystemPrompt };