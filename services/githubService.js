// services/githubService.js
const axios = require('axios');

/**
 * Pulls a lightweight signal set from a public GitHub profile:
 * repo names, descriptions, primary languages, star counts.
 * Kept shallow for MVP - no cloning/parsing of actual code yet.
 */
async function fetchGithubSignals(username) {
  if (!username) return [];

  const headers = { Accept: 'application/vnd.github+json' };
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  try {
    const { data: repos } = await axios.get(
      `https://api.github.com/users/${encodeURIComponent(username)}/repos?per_page=30&sort=updated`,
      { headers }
    );

    return repos
      .filter((r) => !r.fork)
      .map((r) => ({
        name: r.name,
        description: r.description || '',
        language: r.language || 'unknown',
        stars: r.stargazers_count,
        updatedAt: r.updated_at
      }));
  } catch (err) {
    console.warn(`[githubService] Could not fetch repos for "${username}": ${err.message}`);
    return [];
  }
}

module.exports = { fetchGithubSignals };
