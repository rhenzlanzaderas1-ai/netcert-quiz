/**
 * Firebase Progress & Gamification tracking
 */

window.Progress = {
  data: {}, // Local cache: { questionId: { state, correctCount, wrongCount } }
  stats: { studied: 0, mastered: 0, hard: 0, completedToday: 0 },

  async loadAll() {
    const user = Auth.currentUser();
    if (!user) return { data: {}, stats: this.stats };

    try {
      const snap = await db.collection("users").doc(user.uid).collection("progress").get();
      this.data = {};
      let studied = 0, mastered = 0, hard = 0;

      snap.forEach(doc => {
        const qData = doc.data();
        this.data[doc.id] = qData;
        
        if (qData.state !== 'unseen') studied++;
        if (qData.state === 'mastered') mastered++;
        if (qData.wrongCount >= 2 && qData.state !== 'mastered') hard++;
      });

      this.stats = { studied, mastered, hard, completedToday: 0 };
      
      const userSnap = await db.collection("users").doc(user.uid).get();
      return { 
        data: this.data, 
        stats: this.stats, 
        user: userSnap.data() 
      };
    } catch (e) {
      console.error("Progress load failed:", e);
      return { data: {}, stats: this.stats };
    }
  },

  async saveAnswer(questionId, correct, category) {
    const user = Auth.currentUser();
    if (!user) return null;

    let p = this.data[questionId] || {
      state: 'unseen',
      correctCount: 0,
      wrongCount: 0,
    };

    let xpGain = 0;

    if (correct) {
      if (p.state === 'unseen') xpGain += 10;
      else if (p.state !== 'mastered') xpGain += 5;

      p.correctCount++;
      if (p.correctCount >= 3 && p.state !== 'mastered') {
        p.state = 'mastered';
        p.masteredAt = Date.now();
        xpGain += 25; // Mastery bonus
      } else if (p.state === 'unseen') {
        p.state = 'learning';
      }
    } else {
      p.wrongCount++;
      p.correctCount = 0; // Reset streak for this question
      if (p.state === 'mastered') {
        p.state = 'learning';
      }
    }

    // Update local cache
    this.data[questionId] = p;
    
    // Update local user object XP
    if (xpGain > 0) {
      user.xp = (user.xp || 0) + xpGain;
      user.level = Math.floor(user.xp / 500) + 1;
      user.streak = (user.streak || 0) + (correct ? 1 : 0);
    } else if (!correct) {
      user.streak = 0;
    }

    // Sync to Firestore (async, fire-and-forget to keep UI snappy)
    try {
      db.collection("users").doc(user.uid).collection("progress").doc(String(questionId)).set(p);
      if (xpGain > 0 || !correct) {
        db.collection("users").doc(user.uid).update({
          xp: user.xp,
          level: user.level,
          streak: user.streak
        });
      }
    } catch (e) {
      console.warn("Failed to sync progress to Firestore", e);
    }

    return {
      xpGain,
      newState: p.state,
      totalXP: user.xp,
      level: user.level,
      streak: user.streak
    };
  },

  getStats() {
    const user = Auth.currentUser() || { xp: 0, level: 1, streak: 0 };
    return {
      ...this.stats,
      xp: user.xp || 0,
      level: user.level || 1,
      streak: user.streak || 0,
      levelProgress: ((user.xp || 0) % 500) / 500 * 100
    };
  },

  getHardQuestions() {
    return Object.entries(this.data)
      .filter(([_, p]) => p.wrongCount >= 2 && p.state !== 'mastered')
      .map(([id]) => Number(id));
  },

  getReviewQueue() {
    return Object.entries(this.data)
      .filter(([_, p]) => p.wrongCount > 0 && p.state !== 'mastered')
      .map(([id]) => Number(id));
  },

  getRecentlyStudied() {
    const learning = Object.entries(this.data)
      .filter(([_, p]) => p.state === 'learning')
      .map(([id]) => Number(id));
    return learning.slice(0, 20);
  },

  getCategoryProgress(category) {
    const questions = ALL_QUESTIONS.filter(q => q.category === category);
    const total = questions.length;
    let mastered = 0;
    let seen = 0;

    questions.forEach(q => {
      // Use index as questionId since that's how we structured it
      const qIndex = ALL_QUESTIONS.indexOf(q);
      const p = this.data[qIndex];
      if (p) {
        if (p.state !== 'unseen') seen++;
        if (p.state === 'mastered') mastered++;
      }
    });

    return {
      total,
      mastered,
      seen,
      percentage: total > 0 ? Math.round((mastered / total) * 100) : 0
    };
  }
};
