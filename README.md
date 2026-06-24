# 🎓 Student Notes Hub — Full Stack

A complete AI-powered student learning platform. Features AI note generation, AI chatbot tutor, resume builder, code playground, study materials, and a personalized dashboard — all with real authentication and database storage.

---

## 🛠 Tech Stack

| Layer      | Technology                         |
|------------|------------------------------------|
| Frontend   | HTML5, CSS3, Vanilla JavaScript    |
| Backend    | Node.js + Express.js               |
| Database   | MongoDB Atlas (free)               |
| Auth       | JWT + bcrypt (no third-party)      |
| AI         | Google Gemini 1.5 Flash (free)     |
| Code Runner| Judge0 via RapidAPI (free tier)    |
| Hosting    | Render (backend) + Vercel (frontend) or Render for both |

---

## 📁 Project Structure

```
student-notes-hub/
├── server.js                   ← Main Express server
├── .env.example                ← Copy to .env and fill keys
├── .gitignore
├── package.json
│
├── config/
│   └── db.js                  ← MongoDB connection
│
├── middleware/
│   ├── auth.js                ← JWT route protection
│   └── errorHandler.js        ← Global error handling
│
├── models/
│   ├── User.js                ← User schema (name, email, password, stats)
│   ├── Note.js                ← Note schema (title, content, AI flag)
│   ├── Resume.js              ← Resume schema (all sections)
│   └── Activity.js            ← Activity log for dashboard
│
├── controllers/
│   ├── authController.js      ← Signup, login, profile
│   ├── notesController.js     ← CRUD + AI generation
│   ├── resumeController.js    ← CRUD + AI enhance
│   ├── dashboardController.js ← Dashboard stats
│   └── aiController.js        ← Chat + code runner
│
├── routes/
│   ├── auth.js
│   ├── notes.js
│   ├── resume.js
│   ├── dashboard.js
│   └── ai.js
│
└── public/                    ← All frontend HTML files
    ├── js/
    │   └── api.js             ← Shared API helper for all pages
    ├── index.html             ← Landing page
    ├── login.html             ← Login (connected to backend)
    ├── signup.html            ← Signup (connected to backend)
    ├── dashboard.html         ← Student dashboard ★
    ├── notes.html             ← AI Notes Generator
    ├── assistant.html         ← AI Chat Tutor
    ├── resume.html            ← Resume Builder
    ├── code.html              ← Code Playground
    ├── challenge.html         ← Daily Challenge
    └── studymaterial.html     ← Study Materials
```

---

## 🚀 Setup Guide (Step by Step)

### Step 1 — Install Node.js
Download from [nodejs.org](https://nodejs.org) (LTS version)

### Step 2 — Get your free API keys

**MongoDB Atlas (database):**
1. Go to [mongodb.com/atlas](https://www.mongodb.com/atlas/database)
2. Sign up → Create a free cluster → Click "Connect"
3. Choose "Connect your application" → Copy the connection string

**Google Gemini AI (AI features):**
1. Go to [aistudio.google.com](https://aistudio.google.com)
2. Sign in → Click "Get API Key" → Create API key
3. Copy the key

**Judge0 (code runner — optional):**
1. Go to [rapidapi.com](https://rapidapi.com)
2. Search "Judge0 CE" → Subscribe to free plan
3. Copy your RapidAPI key

### Step 3 — Set up environment

```bash
# Copy the example env file
cp .env.example .env
```

Open `.env` and fill in your values:
```
MONGO_URI=mongodb+srv://your_user:your_password@cluster.mongodb.net/student_notes_hub
JWT_SECRET=make_this_a_long_random_string_at_least_32_chars
GEMINI_API_KEY=your_gemini_key_here
JUDGE0_API_KEY=your_judge0_key_here   # optional
```

**Generate a secure JWT secret:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Step 4 — Install and run

```bash
npm install
npm run dev    # development (auto-restart on changes)
# OR
npm start      # production
```

Open your browser: **http://localhost:5000**

---

## 🌐 API Endpoints

### Authentication
| Method | Route | Description |
|--------|-------|-------------|
| POST | /api/auth/signup | Create account |
| POST | /api/auth/login | Login |
| GET | /api/auth/me | Get logged in user |
| PUT | /api/auth/profile | Update profile |
| GET | /api/auth/notifications | Get notifications |

### Notes
| Method | Route | Description |
|--------|-------|-------------|
| GET | /api/notes | Get all notes |
| POST | /api/notes | Create note |
| PUT | /api/notes/:id | Update note |
| DELETE | /api/notes/:id | Delete note |
| POST | /api/notes/generate | **AI generate note** |

### Resume
| Method | Route | Description |
|--------|-------|-------------|
| GET | /api/resume | Get resumes |
| POST | /api/resume | Save resume |
| PUT | /api/resume/:id | Update resume |
| DELETE | /api/resume/:id | Delete resume |
| POST | /api/resume/enhance | **AI enhance content** |

### AI & Code
| Method | Route | Description |
|--------|-------|-------------|
| GET | /api/dashboard | Dashboard data |
| POST | /api/ai/chat | AI chatbot |
| POST | /api/ai/run-code | Execute code |

---

## ☁️ Deploying for Free

### Backend → Render.com (free)
1. Push code to GitHub (`git push`)
2. Go to [render.com](https://render.com) → New → Web Service
3. Connect your GitHub repo
4. Set Build Command: `npm install`
5. Set Start Command: `npm start`
6. Add your `.env` variables in the "Environment" tab
7. Deploy → get URL like `https://your-app.onrender.com`

### Frontend → Vercel (free)
If you want to host frontend separately, just deploy the `/public` folder to [vercel.com](https://vercel.com).

Or serve everything from Render — the backend already serves your HTML files from `/public`.

---

## ✨ Features Added vs Original

| Feature | Status |
|---------|--------|
| Real JWT authentication | ✅ Added |
| Password encryption (bcrypt) | ✅ Added |
| MongoDB database | ✅ Added |
| Student dashboard with stats | ✅ Added |
| Activity tracking | ✅ Added |
| AI note generation (Gemini) | ✅ Connected |
| AI chatbot with history | ✅ Connected |
| AI resume enhancement | ✅ Connected |
| Live resume preview | ✅ Added |
| Code playground (Judge0) | ✅ Connected |
| Browser JS fallback | ✅ Added |
| Toast notifications | ✅ Added |
| Password strength indicator | ✅ Added |
| Loading states | ✅ Added |
| Sidebar navigation | ✅ Added |
| Search notes | ✅ Added |
| Favorite notes | ✅ Added |
| Profile editing | ✅ Added |
| Day streak tracking | ✅ Added |
| Fully responsive | ✅ Done |
| Rate limiting | ✅ Added |
| Security headers | ✅ Added |

---

## 🔑 Key Design Decisions

- **No Firebase** — authentication is handled with JWT + bcrypt, which is free and gives you full control
- **Gemini 1.5 Flash** — free tier is very generous (15 requests/minute, 1M tokens/day)
- **MongoDB Atlas free tier** — 512MB is plenty for a student project
- **Single server** — backend serves both the API and the frontend HTML files, so you only need one deployment

---

*Built with ❤️ for students who want to learn smarter*
