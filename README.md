# NetCert 網路認證複習系統

A full-stack quiz application for Taiwan Networking Certification (NetCert) exam prep — with authentication, XP/level gamification, per-student progress tracking, and Vercel deployment.

**Theme:** Black `#080507` & Maroon `#c4334a` — premium dark UI with binary rain background, glassmorphism cards, and smooth animations.

---

## ✨ Features

- 🔐 **JWT Authentication** — 30 pre-seeded students, default password = student ID
- 📊 **Progress Tracking** — per-question state: unseen → learning → mastered
- ⭐ **XP System** — earn XP for correct answers, streaks, and daily logins
- 🏆 **Level System** — Level = floor(XP / 500) + 1
- 🔥 **Streak Tracking** — daily login and answer streaks
- 🎯 **Smart Review** — hard questions, review queue, recently studied
- 📱 **Mobile Responsive** — works on all screen sizes
- 🌐 **Bilingual** — Traditional Chinese / English toggle
- 🌧 **Binary Rain** — animated background on all views including login

---

## 🚀 Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env.local
# Edit .env.local with your Vercel KV credentials
```

### 3. Seed users

```bash
# Dry run (preview without writing)
npm run seed:dry

# Seed to Vercel KV
npm run seed
```

### 4. Run locally

```bash
npm run dev
# Opens at http://localhost:3000
```

---

## 🗄️ Vercel KV Setup

1. Go to [vercel.com](https://vercel.com) → your project → **Storage** tab
2. Click **Create Database** → select **KV**
3. Copy the credentials shown
4. Run `vercel env pull .env.local` to get credentials locally
5. Run `npm run seed` to populate user data

### KV Data Schema

| Key | Value |
|-----|-------|
| `user:{studentId}` | `{ studentId, name, role, passwordHash, xp, level, streak, lastActiveDate, createdAt }` |
| `progress:{studentId}` | `{ [questionId]: { state, correctCount, wrongCount, correctStreak, lastSeen, masteredAt, category } }` |

---

## 📦 API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/auth/login` | ❌ | Login → returns JWT |
| `GET`  | `/api/auth/me` | ✅ | Get current user profile |
| `POST` | `/api/auth/change-password` | ✅ | Change password |
| `POST` | `/api/progress/save` | ✅ | Save answer + award XP |
| `GET`  | `/api/progress/load` | ✅ | Load all progress data |
| `POST` | `/api/progress/reset` | ✅ | Reset all progress + XP |

---

## ⭐ XP Rules

| Action | XP |
|--------|----|
| Correct answer (first time) | +10 XP |
| Correct answer (retry) | +5 XP |
| Master a question (3 correct in a row) | +25 XP bonus |
| Streak of 3 | +15 XP |
| Streak of 5 | +30 XP |
| Streak of 10 | +60 XP |
| Daily login | +20 XP |

**Level formula:** `Level = Math.floor(XP / 500) + 1`

---

## 🚢 Deploy to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel

# Set environment variables in Vercel dashboard, then:
vercel env add KV_REST_API_URL
vercel env add KV_REST_API_TOKEN
vercel env add JWT_SECRET
```

After deploying, seed the production database:
```bash
vercel env pull .env.local
npm run seed
```

---

## 👥 Adding New Users

Edit `scripts/seed-users.js` and add to the `USERS` array:

```js
{ studentId: '25115999', name: '新生(NEW STUDENT)', role: '學生', password: '25115999' },
```

Then re-run:
```bash
npm run seed
```

---

## 🗂️ Project Structure

```
/
├── api/
│   ├── auth/
│   │   ├── login.js           # POST — JWT login
│   │   ├── me.js              # GET  — user profile
│   │   └── change-password.js # POST — update password
│   └── progress/
│       ├── save.js            # POST — save answer + XP
│       ├── load.js            # GET  — load all progress
│       └── reset.js           # POST — reset progress
├── css/
│   └── styles.css             # All styles (original + auth/gamification)
├── data/
│   ├── questions.js           # Question bank 1
│   └── questions_pdf.js       # Question bank 2 (PDF-extracted)
├── js/
│   ├── auth.js                # Auth module (login, logout, JWT)
│   ├── progress.js            # Progress tracking module
│   └── app.js                 # Main SPA controller
├── scripts/
│   └── seed-users.js          # User seeding script
├── index.html                 # Main SPA shell
├── vercel.json                # Vercel deployment config
├── package.json               # Dependencies
└── .env.example               # Environment variable template
```

---

## 🎓 Student Credentials

Default login: **Student ID = Password**

Example: Student ID `25115410` → Password `25115410`

Students can change their password after logging in via the change-password API.

---

## 🔒 Security Notes

- Passwords are hashed with **bcryptjs** (10 salt rounds) — never stored plain
- JWT expires in **7 days** — set `JWT_SECRET` to a strong random string
- All API endpoints validate the Bearer token before accessing KV
- CORS headers are set on all API responses
- The frontend works in **offline/local mode** if the API is unavailable (localStorage cache)
