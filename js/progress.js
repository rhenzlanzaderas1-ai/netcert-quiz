/**
 * js/progress.js — NetCert Progress Tracking Module
 * ─────────────────────────────────────────────────────────────────────────────
 * Manages per-question progress with local cache + server sync.
 * Falls back to localStorage-only mode if the API is unavailable.
 */

const Progress = (() => {
  const API_BASE       = '/api/progress';
  const CACHE_KEY      = 'nc-progress';
  const CACHE_USER_KEY = 'nc-progress-user';

  // ── Local cache ───────────────────────────────────────────────────────────

  let _cache     = null; // { [questionId]: QuestionProgress }
  let _userCache = null; // { xp, level, streak, ... }

  function _readCache() {
    if (_cache) return _cache;
    try {
      _cache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
    } catch {
      _cache = {};
    }
    return _cache;
  }

  function _readUserCache() {
    if (_userCache) return _userCache;
    try {
      _userCache = JSON.parse(localStorage.getItem(CACHE_USER_KEY) || 'null');
    } catch {
      _userCache = null;
    }
    return _userCache;
  }

  function _writeCache() {
    localStorage.setItem(CACHE_KEY, JSON.stringify(_cache || {}));
  }

  function _writeUserCache() {
    localStorage.setItem(CACHE_USER_KEY, JSON.stringify(_userCache || {}));
  }

  // ── loadAll — fetch from server and update local cache ────────────────────

  async function loadAll() {
    const token = Auth.getToken();
    if (!token) {
      // Offline mode — return local cache
      return { user: Auth.currentUser(), progress: _readCache() };
    }

    try {
      const resp = await fetch(`${API_BASE}/load`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!resp.ok) {
        // Server unavailable — return cached data silently
        console.warn('[Progress] Server unavailable, using local cache');
        return { user: _readUserCache() || Auth.currentUser(), progress: _readCache() };
      }

      const data = await resp.json();

      // Update caches
      _cache     = data.progress || {};
      _userCache = data.user     || null;
      _writeCache();
      _writeUserCache();

      // Sync user cache in Auth as well
      if (data.user) Auth.updateCachedUser(data.user);

      return data;

    } catch (err) {
      console.warn('[Progress] Load failed, using local cache:', err.message);
      return { user: _readUserCache() || Auth.currentUser(), progress: _readCache() };
    }
  }

  // ── saveAnswer — record answer locally and sync to server ─────────────────

  async function saveAnswer(questionId, correct, category, sessionStreak = 0) {
    const qKey = String(questionId);
    const prog = _readCache();

    // ── Update local cache immediately ────────────────────────────────────
    const prev = prog[qKey] || {
      state:         'unseen',
      correctCount:  0,
      wrongCount:    0,
      correctStreak: 0,
      lastSeen:      null,
      masteredAt:    null,
    };

    const wasUnseen = prev.correctCount === 0 && prev.wrongCount === 0;
    let localXp = 0;

    if (correct) {
      prev.correctCount++;
      prev.correctStreak = (prev.correctStreak || 0) + 1;
      localXp += wasUnseen ? 10 : 5;
      if (prev.correctStreak === 3 && !prev.masteredAt) {
        localXp += 25;
        prev.masteredAt = new Date().toISOString();
      }
    } else {
      prev.wrongCount++;
      prev.correctStreak = 0;
    }

    // Session streak bonuses (local)
    if (correct) {
      if      (sessionStreak === 3)  localXp += 15;
      else if (sessionStreak === 5)  localXp += 30;
      else if (sessionStreak === 10) localXp += 60;
    }

    prev.lastSeen = new Date().toISOString();
    prev.state    = _computeState(prev);
    if (category) prev.category = category;

    prog[qKey] = prev;
    _cache     = prog;
    _writeCache();

    // Update local user XP
    if (_userCache) {
      _userCache.xp    = (_userCache.xp || 0) + localXp;
      _userCache.level = Math.floor(_userCache.xp / 500) + 1;
      _writeUserCache();
      Auth.updateCachedUser({ xp: _userCache.xp, level: _userCache.level });
    }

    // ── Sync to server (fire-and-forget) ──────────────────────────────────
    const token = Auth.getToken();
    if (token) {
      try {
        const resp = await fetch(`${API_BASE}/save`, {
          method:  'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization:  `Bearer ${token}`,
          },
          body: JSON.stringify({ questionId, correct, category, sessionStreak }),
        });

        if (resp.ok) {
          const data = await resp.json();
          // Reconcile server's authoritative XP
          if (_userCache && data.newXP !== undefined) {
            _userCache.xp    = data.newXP;
            _userCache.level = data.newLevel || _userCache.level;
            _writeUserCache();
            Auth.updateCachedUser({ xp: _userCache.xp, level: _userCache.level });
          }
          return { xpGained: data.xpGained, progress: data.progress };
        }
      } catch (err) {
        console.warn('[Progress] Save sync failed (offline mode):', err.message);
      }
    }

    return { xpGained: localXp, progress: prev };
  }

  // ── reset — clear all progress ────────────────────────────────────────────

  async function reset() {
    _cache     = {};
    _userCache = Object.assign(_userCache || {}, { xp: 0, level: 1, streak: 0 });
    _writeCache();
    _writeUserCache();

    const token = Auth.getToken();
    if (token) {
      try {
        await fetch(`${API_BASE}/reset`, {
          method:  'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (err) {
        console.warn('[Progress] Reset sync failed:', err.message);
      }
    }
  }

  // ── getStats ──────────────────────────────────────────────────────────────

  function getStats() {
    const prog = _readCache();
    const user = _readUserCache() || Auth.currentUser() || {};

    const today = new Date().toISOString().slice(0, 10);

    let studied = 0, mastered = 0, hard = 0, completedToday = 0;

    for (const [, p] of Object.entries(prog)) {
      if (p.state && p.state !== 'unseen') studied++;
      if (p.state === 'mastered')          mastered++;
      if (p.wrongCount >= 2 && p.state !== 'mastered') hard++;
      if (p.lastSeen && p.lastSeen.startsWith(today))   completedToday++;
    }

    const xp        = user.xp    || 0;
    const level     = user.level || 1;
    const streak    = user.streak || 0;
    const xpInLevel = xp % 500;
    const xpToNext  = 500;

    return {
      studied,
      mastered,
      hard,
      completedToday,
      xp,
      level,
      streak,
      levelProgress: Math.round((xpInLevel / xpToNext) * 100),
      xpInLevel,
      xpToNext,
    };
  }

  // ── getHardQuestions — wrongCount >= 2 and not mastered ───────────────────

  function getHardQuestions() {
    const prog = _readCache();
    return Object.entries(prog)
      .filter(([, p]) => p.wrongCount >= 2 && p.state !== 'mastered')
      .sort((a, b) => (b[1].wrongCount || 0) - (a[1].wrongCount || 0))
      .map(([id, p]) => ({ id, ...p }));
  }

  // ── getReviewQueue — answered wrong at least once, not mastered ───────────

  function getReviewQueue() {
    const prog = _readCache();
    return Object.entries(prog)
      .filter(([, p]) => p.wrongCount >= 1 && p.state !== 'mastered')
      .sort((a, b) => {
        // Sort by least recently seen
        const ta = a[1].lastSeen ? new Date(a[1].lastSeen).getTime() : 0;
        const tb = b[1].lastSeen ? new Date(b[1].lastSeen).getTime() : 0;
        return ta - tb;
      })
      .map(([id, p]) => ({ id, ...p }));
  }

  // ── getRecentlyStudied — last 20 questions by lastSeen ────────────────────

  function getRecentlyStudied() {
    const prog = _readCache();
    return Object.entries(prog)
      .filter(([, p]) => p.lastSeen)
      .sort((a, b) => {
        const ta = new Date(a[1].lastSeen).getTime();
        const tb = new Date(b[1].lastSeen).getTime();
        return tb - ta;
      })
      .slice(0, 20)
      .map(([id, p]) => ({ id, ...p }));
  }

  // ── getCategoryProgress ───────────────────────────────────────────────────

  function getCategoryProgress(category, allCategoryQuestions) {
    const prog = _readCache();
    const total = allCategoryQuestions ? allCategoryQuestions.length : 0;

    let seen = 0, mastered = 0;

    if (allCategoryQuestions) {
      allCategoryQuestions.forEach(q => {
        const p = prog[String(q.id || q.question_id)];
        if (!p) return;
        if (p.state === 'mastered') { mastered++; seen++; }
        else if (p.state !== 'unseen') seen++;
      });
    } else {
      // Fallback: iterate progress by category tag
      for (const [, p] of Object.entries(prog)) {
        if (p.category !== category) continue;
        if (p.state === 'mastered') { mastered++; seen++; }
        else if (p.state !== 'unseen') seen++;
      }
    }

    const percentage = total > 0 ? Math.round((mastered / total) * 100) : 0;

    return { total, seen, mastered, percentage };
  }

  // ── getQuestionProgress — single question ─────────────────────────────────

  function getQuestionProgress(questionId) {
    return _readCache()[String(questionId)] || null;
  }

  // ── helpers ───────────────────────────────────────────────────────────────

  function _computeState(p) {
    if (!p || (p.correctCount === 0 && p.wrongCount === 0)) return 'unseen';
    if (p.correctStreak >= 3) return 'mastered';
    if (p.correctCount  >= 1) return 'learning';
    return 'seen';
  }

  // ── Expose ────────────────────────────────────────────────────────────────
  return {
    loadAll,
    saveAnswer,
    reset,
    getStats,
    getHardQuestions,
    getReviewQueue,
    getRecentlyStudied,
    getCategoryProgress,
    getQuestionProgress,
  };
})();
