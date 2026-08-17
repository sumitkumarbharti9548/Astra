// services/twinAiService.js
const axios = require('axios');
const marketData = require('../data/marketDemand');

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

function cleanJson(text) {
  return text.replace(/```json/gi, '').replace(/```/g, '').trim();
}

async function callGemini(prompt) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not set in your .env file.');
  }

  const { data } = await axios.post(
    `${GEMINI_URL}?key=${process.env.GEMINI_API_KEY}`,
    { contents: [{ parts: [{ text: prompt }] }] },
    { headers: { 'Content-Type': 'application/json' } }
  );

  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Gemini returned an empty response.');
  return text;
}

/**
 * Core function: takes raw career signals plus target-role market data
 * and returns a structured Career Twin analysis.
 */
async function generateCareerTwin({ resumeText, projects, certifications, manualSkills, githubRepos, targetRole }) {
  const roleData = marketData.roles[targetRole] || null;
  const roleContext = roleData
    ? `Target role market data:\n${JSON.stringify(roleData, null, 2)}`
    : `No specific market data available for target role "${targetRole}". Use general industry knowledge.`;

  const prompt = `
You are the analysis engine for a "digital career twin" feature inside a student productivity platform called Astra AI.
Analyze the candidate data below and return ONLY valid JSON (no markdown, no commentary) matching this exact schema:

{
  "skills": [
    { "name": string, "category": "language"|"framework"|"tool"|"soft-skill"|"concept", "proficiency": number (0-100), "evidence": [string], "demandScore": number (0-100), "trend": "rising"|"stable"|"declining" }
  ],
  "strengths": [string],
  "gaps": [string],
  "roadmap": [
    { "skill": string, "reason": string, "priority": "high"|"medium"|"low", "estimatedWeeks": number, "resources": [string] }
  ],
  "readinessScore": number (0-100, how ready this candidate is for the target role right now),
  "predictedSalary": { "currency": "INR", "min": number, "max": number, "basis": string },
  "aiSummary": string (3-5 sentences, direct and specific, written to the candidate as "you")
}

Rules:
- Base proficiency estimates on actual evidence in the data (projects, repos, certifications), not assumptions.
- "gaps" and "roadmap" must be relative to the target role's market data provided below, where available.
- Be honest, not flattering. If the candidate is underprepared for the target role, the readinessScore and aiSummary should reflect that clearly and constructively.
- demandScore and trend for each skill should align with the market data where the skill overlaps with it; otherwise use reasonable industry judgment.
- predictedSalary should use the market data salary band as an anchor, adjusted up/down based on the candidate's actual readiness.
- Limit roadmap to the 5 most impactful next skills, ordered by priority.
- Limit skills array to the ~12 most relevant/demonstrated skills.

CANDIDATE DATA:
Target role: ${targetRole || 'Not specified - infer the most likely fit from the data'}
Resume text: ${resumeText || '(none provided)'}
Manually listed skills: ${(manualSkills || []).join(', ') || '(none)'}
Certifications: ${(certifications || []).join(', ') || '(none)'}
Projects: ${JSON.stringify(projects || [])}
GitHub repositories (name, description, primary language): ${JSON.stringify(githubRepos || [])}

${roleContext}

Return ONLY the JSON object.
`.trim();

  const raw = await callGemini(prompt);
  const cleaned = cleanJson(raw);

  try {
    return JSON.parse(cleaned);
  } catch (err) {
    throw new Error('AI returned malformed JSON: ' + raw.slice(0, 300));
  }
}

async function generateInterviewQuestion({ targetRole, skills }) {
  const prompt = `
You are an experienced technical interviewer for the role of "${targetRole || 'Software Developer'}".
Candidate's known skills: ${(skills || []).join(', ')}.
Ask ONE realistic interview question (technical or behavioral, your choice) appropriate for this candidate's level.
Return ONLY valid JSON: { "question": string, "type": "technical"|"behavioral", "difficulty": "easy"|"medium"|"hard" }
`.trim();

  const raw = await callGemini(prompt);
  return JSON.parse(cleanJson(raw));
}

async function scoreInterviewAnswer({ question, answer, targetRole }) {
  const prompt = `
You are an experienced technical interviewer for the role of "${targetRole || 'Software Developer'}".
Question asked: "${question}"
Candidate's answer: "${answer}"

Score the answer and return ONLY valid JSON matching:
{ "score": number (0-100), "feedback": string (2-4 sentences, direct and specific), "strengths": [string], "improvements": [string] }
`.trim();

  const raw = await callGemini(prompt);
  return JSON.parse(cleanJson(raw));
}

module.exports = {
  generateCareerTwin,
  generateInterviewQuestion,
  scoreInterviewAnswer
};
