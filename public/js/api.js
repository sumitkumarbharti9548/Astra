// public/js/api.js
// Shared API helper used by ALL pages

const API_BASE = "/api";

// ============================================================
// Token / Authentication Helpers
// ============================================================

const Auth = {
  getToken: () => {
    return localStorage.getItem("snhToken");
  },

  getUser: () => {
    return JSON.parse(localStorage.getItem("snhUser") || "null");
  },

  setSession: (token, user) => {
    localStorage.setItem("snhToken", token);
    localStorage.setItem("snhUser", JSON.stringify(user));
  },

  clearSession: () => {
    localStorage.removeItem("snhToken");
    localStorage.removeItem("snhUser");
  },

  isLoggedIn: () => {
    return !!localStorage.getItem("snhToken");
  },

  requireAuth: () => {
    if (!Auth.isLoggedIn()) {
      window.location.href = "/login.html";
      return false;
    }

    return true;
  },

  redirectIfLoggedIn: () => {
    if (Auth.isLoggedIn()) {
      window.location.href = "/index.html";
    }
  },
};


// ============================================================
// Core Fetch Wrapper
// ============================================================

async function apiFetch(endpoint, options = {}) {
  const token = Auth.getToken();

  const headers = {
    ...options.headers,
  };

  // Only set JSON content type when body is NOT FormData
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  // Add JWT token
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response;

  try {
    response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });
  } catch (error) {
    console.error("API Network Error:", error);
    throw new Error(
      "Unable to connect to server. Please check your internet connection."
    );
  }

  // Try to parse response
  let data;

  try {
    data = await response.json();
  } catch (error) {
    data = {};
  }

  // ==========================================================
  // Unauthorized
  // ==========================================================

  if (response.status === 401) {
    Auth.clearSession();

    if (!window.location.pathname.includes("login")) {
      window.location.href = "/login.html";
    }

    throw new Error("Session expired. Please login again.");
  }

  // ==========================================================
  // Other Errors
  // ==========================================================

  if (!response.ok) {
    throw new Error(
      data.message ||
      data.error ||
      "Something went wrong. Please try again."
    );
  }

  return data;
}


// ============================================================
// API Object
// ============================================================

const API = {

  // ==========================================================
  // Generic Methods
  // ==========================================================

  post: (url, data) =>
    apiFetch(url, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  get: (url) =>
    apiFetch(url),

  put: (url, data) =>
    apiFetch(url, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  delete: (url) =>
    apiFetch(url, {
      method: "DELETE",
    }),


  // ==========================================================
  // AUTH
  // ==========================================================

  signup: (data) =>
    apiFetch("/auth/signup", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  login: (data) =>
    apiFetch("/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getMe: () =>
    apiFetch("/auth/me"),

  updateProfile: (data) =>
    apiFetch("/auth/profile", {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  getNotifications: () =>
    apiFetch("/auth/notifications"),

  markNotifsRead: () =>
    apiFetch("/auth/notifications/read", {
      method: "PUT",
    }),

  forgotPassword: (data) =>
    apiFetch("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  resetPassword: (data) =>
    apiFetch("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify(data),
    }),


  // ==========================================================
  // DASHBOARD
  // ==========================================================

  getDashboard: () =>
    apiFetch("/dashboard"),


  // ==========================================================
  // NOTES
  // ==========================================================

  getNotes: (params = "") =>
    apiFetch(`/notes${params}`),

  createNote: (data) =>
    apiFetch("/notes", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateNote: (id, data) =>
    apiFetch(`/notes/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  deleteNote: (id) =>
    apiFetch(`/notes/${id}`, {
      method: "DELETE",
    }),

  generateNote: (data) =>
    apiFetch("/notes/generate", {
      method: "POST",
      body: JSON.stringify(data),
    }),


  // ==========================================================
  // RESUME
  // ==========================================================

  getResumes: () =>
    apiFetch("/resume"),

  saveResume: (data) =>
    apiFetch("/resume", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateResume: (id, data) =>
    apiFetch(`/resume/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  deleteResume: (id) =>
    apiFetch(`/resume/${id}`, {
      method: "DELETE",
    }),

  enhanceResume: (data) =>
    apiFetch("/resume/enhance", {
      method: "POST",
      body: JSON.stringify(data),
    }),


  // ==========================================================
  // AI
  // ==========================================================

  chat: (data) =>
    apiFetch("/ai/chat", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  runCode: (data) =>
    apiFetch("/ai/run-code", {
      method: "POST",
      body: JSON.stringify(data),
    }),


  // ==========================================================
  // CAREER TWIN
  // ==========================================================

  getTwinRoles: () =>
    apiFetch("/twin/roles"),

  getMyTwin: () =>
    apiFetch("/twin/me"),

  buildTwin: (data) =>
    apiFetch("/twin/build", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getTwinHistory: () =>
    apiFetch("/twin/history"),


  // ==========================================================
  // CAREER TWIN - PARSE RESUME
  // ==========================================================

  parseResume: async (file) => {

    if (!file) {
      throw new Error("Please select a resume file.");
    }

    const formData = new FormData();

    formData.append("resume", file);

    const token = Auth.getToken();

    let response;

    try {

      response = await fetch(`${API_BASE}/twin/parse-resume`, {
        method: "POST",

        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {},

        // IMPORTANT:
        // Do NOT manually set Content-Type here.
        // Browser automatically sets multipart/form-data boundary.
        body: formData,
      });

    } catch (error) {

      console.error("Resume Upload Error:", error);

      throw new Error(
        "Unable to connect to server. Please try again."
      );
    }


    // ========================================================
    // Parse Server Response
    // ========================================================

    let data;

    try {

      data = await response.json();

    } catch (error) {

      data = {};
    }


    // ========================================================
    // Unauthorized
    // ========================================================

    if (response.status === 401) {

      Auth.clearSession();

      if (!window.location.pathname.includes("login")) {
        window.location.href = "/login.html";
      }

      throw new Error(
        "Session expired. Please login again."
      );
    }


    // ========================================================
    // API Error
    // ========================================================

    if (!response.ok || data.success === false) {

      throw new Error(
        data.message ||
        data.error ||
        "Failed to parse resume."
      );
    }


    // ========================================================
    // Success
    // ========================================================

    return data;
  },


  // ==========================================================
  // MOCK INTERVIEW
  // ==========================================================

  getInterviewQuestion: () =>
    apiFetch("/interview/question", {
      method: "POST",
    }),

  scoreInterviewAnswer: (data) =>
    apiFetch("/interview/score", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};


// ============================================================
// Toast Helper
// ============================================================

function showToast(message, type = "info") {

  // Create container if it doesn't exist
  if (!document.getElementById("toast-container")) {

    const container = document.createElement("div");

    container.id = "toast-container";

    container.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 8px;
    `;

    document.body.appendChild(container);
  }


  // ==========================================================
  // Toast Colors
  // ==========================================================

  const colors = {

    success: "#00d9a6",

    error: "#ff5c8d",

    info: "#7c5cff",

    warning: "#ffb84d",

  };


  // ==========================================================
  // Create Toast
  // ==========================================================

  const toast = document.createElement("div");

  const toastColor =
    colors[type] || colors.info;


  toast.style.cssText = `
    background: #0f1115;
    border: 1px solid ${toastColor};
    color: #e6eef8;
    padding: 12px 18px;
    border-radius: 10px;
    font-family: Poppins, sans-serif;
    font-size: 14px;
    box-shadow: 0 8px 24px rgba(0,0,0,.4);
    border-left: 4px solid ${toastColor};
    animation: slideIn .3s ease;
    max-width: 350px;
    word-break: break-word;
  `;


  toast.innerText = message;


  // Add toast
  document
    .getElementById("toast-container")
    .appendChild(toast);


  // ==========================================================
  // Remove Toast
  // ==========================================================

  setTimeout(() => {

    toast.style.opacity = "0";

    toast.style.transform = "translateX(100%)";

    toast.style.transition = ".3s";

    setTimeout(() => {

      toast.remove();

    }, 300);

  }, 4000);
}


// ============================================================
// Toast Animation
// ============================================================

const toastStyle = document.createElement("style");

toastStyle.textContent = `

@keyframes slideIn {

  from {

    transform: translateX(100%);

    opacity: 0;

  }

  to {

    transform: translateX(0);

    opacity: 1;

  }

}

`;

document.head.appendChild(toastStyle);
