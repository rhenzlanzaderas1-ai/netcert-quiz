# NetC 網路認證複習系統

A premium full-stack quiz application for Taiwan Networking Certification (17200 網路架設 - 丙級學科) exam prep — with Firebase authentication, XP/level gamification, persistent progress tracking, and an Admin dashboard.

**Theme:** Black `#080507` & Maroon `#c4334a` — premium dark UI with binary rain background, glassmorphism cards, and smooth micro-animations.

---

## ✨ Features

- 🔐 **Firebase Authentication** — Seamless login system with persistent sessions.
- 📊 **Progress Tracking** — Automatically saves your quiz progress to `localStorage` and syncs with Firestore. Resume where you left off at any time.
- 👑 **Admin Dashboard** — Built-in admin panel (for user `s25115410`) to view all registered students, their Levels, total XP, and account creation dates.
- 💡 **Mistake Explanations** — Pauses the timer and provides a detailed explanation box when you answer a question incorrectly.
- ⭐ **XP System** — Earn XP for correct answers and streaks.
- 🏆 **Level System** — Level up as you learn.
- 🔥 **Streak Tracking** — Keeps track of your correct answer streaks.
- 🎯 **Smart Review** — Dedicated review mode for Hard questions, recently studied questions, and your personal review queue.
- 📱 **Mobile Responsive App** — Built like a native mobile app with a clean Bottom Tab UI, strict non-draggable layout, and optimal spacing.
- 🌐 **Bilingual Support** — Traditional Chinese & English translation toggle.
- 🌧 **Interactive Animations** — Confetti for high scores, shaking buttons for wrong answers, and a dynamic binary rain canvas.

---

## 🚀 Quick Start

Since this project now uses **Firebase Firestore** and is hosted on **GitHub Pages**, there is no need for a complex backend setup.

### 1. View Live Deployment

The app is automatically deployed via GitHub Pages:
🔗 **[https://rhenzlanzaderas1-ai.github.io/netcert-quiz/](https://rhenzlanzaderas1-ai.github.io/netcert-quiz/)**

### 2. Run Locally

```bash
# Clone the repository
git clone https://github.com/rhenzlanzaderas1-ai/netcert-quiz.git

# Navigate to directory
cd netcert-quiz

# Serve the static files (using any simple HTTP server)
npx serve .
# Opens at http://localhost:3000
```

---

## 🗄️ Database Architecture (Firebase)

This application uses **Firebase Firestore** as a serverless backend database. 

### Collections Schema

1. **`users` Collection**
   - Document ID: `username`
   - Fields: `username`, `password`, `name`, `level`, `xp`, `streak`, `createdAt`, `testsTaken`

2. **`progress` Collection**
   - Document ID: `username`
   - Fields: Map of Question IDs to objects containing `{ state, correctCount, wrongCount, correctStreak, lastSeen, masteredAt, category }`

*(Note: The client-side logic securely handles saving and loading these documents upon authentication).*

---

## ⭐ XP Rules

| Action | XP |
|--------|----|
| Correct answer (first time) | +10 XP |
| Correct answer (retry) | +5 XP |
| Streak of 3 | +15 XP |
| Streak of 5 | +30 XP |
| Streak of 10 | +60 XP |

**Level formula:** `Level = Math.floor(XP / 500) + 1`

---

## 📄 Credits & Disclaimer

- **Creator:** s25115410
- **Source Material:** The educational materials and networking concepts used in this application are sourced from the official testing materials: [https://owinform.wdasec.gov.tw/](https://owinform.wdasec.gov.tw/) - 17200 網路架設 - 丙 級學科.
- **Disclaimer:** This application is strictly for personal review and educational purposes. All intellectual property belongs to the rightful owners and certification bodies.
