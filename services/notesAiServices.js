// services/notesAiService.js
// Same pattern as services/twinAiService.js — axios REST call to Gemini
// rather than the Gemini SDK, since axios is already a dependency.

const axios = require('axios');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

/**
 * Sends a prompt to Gemini and returns the generated text.
 * @param {string} prompt
 * @returns {Promise<string>}
 */
async function generateFromPrompt(prompt) {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not configured on the server');
  }

  const response = await axios.post(
    GEMINI_URL,
    {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 4096 }
    },
    { headers: { 'Content-Type': 'application/json' }, timeout: 30000 }
  );

  const text = response?.data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Empty response from Gemini');
  return text;
}

module.exports = { generateFromPrompt };