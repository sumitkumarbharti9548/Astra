// public/js/api.js — Shared API helper used by ALL pages
// ─────────────────────────────────────────────────────────────

const API_BASE = '/api';

// ── Token helpers ─────────────────────────────────────────────
const Auth = {
  getToken:    ()     => localStorage.getItem('snhToken'),
  getUser:     ()     => JSON.parse(localStorage.getItem('snhUser') || 'null'),
  setSession:  (token, user) => {
    localStorage.setItem('snhToken', token);
    localStorage.setItem('snhUser', JSON.stringify(user));
  },
  clearSession: () => {
    localStorage.removeItem('snhToken');
    localStorage.removeItem('snhUser');
  },
  isLoggedIn:  () => !!localStorage.getItem('snhToken'),
  // Redirect to login if not authenticated
  requireAuth: () => {
    if (!Auth.isLoggedIn()) {
      window.location.href = '/login.html';
      return false;
    }
    return true;
  },
  // Redirect away from login/signup if already authenticated
  redirectIfLoggedIn: () => {
    if (Auth.isLoggedIn()) {
      window.location.href = '/index.html';
    }
  }
};

// ── Core fetch wrapper ────────────────────────────────────────
async function apiFetch(endpoint, options = {}) {
  const token = Auth.getToken();
  const headers = { 'Content-Type': 'application/json', ...options.headers };

  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  const data = await response.json();

  // If token expired, clear session and redirect
  if (response.status === 401) {
    Auth.clearSession();
    if (!window.location.pathname.includes('login')) {
      window.location.href = '/login.html';
    }
  }

  if (!response.ok) {
    throw new Error(data.message || 'Something went wrong');
  }

  return data;
}

// ── API functions ─────────────────────────────────────────────
const API = {
  // Auth
  signup:  (data)   => apiFetch('/auth/signup',  { method: 'POST', body: JSON.stringify(data) }),
  login:   (data)   => apiFetch('/auth/login',   { method: 'POST', body: JSON.stringify(data) }),
  getMe:   ()       => apiFetch('/auth/me'),
  updateProfile: (data) => apiFetch('/auth/profile', { method: 'PUT', body: JSON.stringify(data) }),
  getNotifications: () => apiFetch('/auth/notifications'),
  markNotifsRead:   () => apiFetch('/auth/notifications/read', { method: 'PUT' }),

  // Dashboard
  getDashboard: () => apiFetch('/dashboard'),

  // Notes
  getNotes:     (params = '') => apiFetch(`/notes${params}`),
  createNote:   (data) => apiFetch('/notes',          { method: 'POST', body: JSON.stringify(data) }),
  updateNote:   (id, data) => apiFetch(`/notes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteNote:   (id) => apiFetch(`/notes/${id}`,      { method: 'DELETE' }),
  generateNote: (data) => apiFetch('/notes/generate', { method: 'POST', body: JSON.stringify(data) }),

  // Resume
  getResumes:   () => apiFetch('/resume'),
  saveResume:   (data) => apiFetch('/resume',          { method: 'POST', body: JSON.stringify(data) }),
  updateResume: (id, data) => apiFetch(`/resume/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteResume: (id) => apiFetch(`/resume/${id}`,      { method: 'DELETE' }),
  enhanceResume: (data) => apiFetch('/resume/enhance', { method: 'POST', body: JSON.stringify(data) }),

  // AI
  chat:    (data) => apiFetch('/ai/chat',     { method: 'POST', body: JSON.stringify(data) }),
  runCode: (data) => apiFetch('/ai/run-code', { method: 'POST', body: JSON.stringify(data) }),
};

// ── Toast notification helper ─────────────────────────────────
function showToast(message, type = 'info') {
  const existing = document.getElementById('toast-container');
  if (!existing) {
    const container = document.createElement('div');
    container.id = 'toast-container';
    container.style.cssText = 'position:fixed;top:20px;right:20px;z-index:9999;display:flex;flex-direction:column;gap:8px;';
    document.body.appendChild(container);
  }

  const colors = {
    success: '#00d9a6',
    error:   '#ff5c8d',
    info:    '#7c5cff',
    warning: '#ffb84d'
  };

  const toast = document.createElement('div');
  toast.style.cssText = `
    background: #0f1115;
    border: 1px solid ${colors[type] || colors.info};
    color: #e6eef8;
    padding: 12px 18px;
    border-radius: 10px;
    font-family: 'Poppins', sans-serif;
    font-size: 0.9rem;
    box-shadow: 0 8px 24px rgba(0,0,0,0.4);
    animation: slideIn 0.3s ease;
    max-width: 320px;
    border-left: 3px solid ${colors[type] || colors.info};
  `;
  toast.textContent = message;

  const container = document.getElementById('toast-container');
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// Add toast animation CSS
const toastStyle = document.createElement('style');
toastStyle.textContent = `@keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }`;
document.head.appendChild(toastStyle);
