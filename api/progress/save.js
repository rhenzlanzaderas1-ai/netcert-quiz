/**
 * POST /api/progress/save
 * Headers: Authorization: Bearer <token>
 * Body: { questionId, correct, category }
 * Returns: { xpGained, newXP, newLevel, progress: { state, correctCount, wrongCount } }
 *
 * XP Rules:
 *   Correct first try    → +10 XP
 *   Correct on retry     → +5  XP
 *   Master bonus (3 in a row correct) → +25 XP
 *   Streak bonuses: 3/5/10 → +15/+30/+60 XP
 *   Daily login          → +20 XP (handled in login)
 */

const jwt = require('jsonwebtoken');

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

let kv = null;
async function getKV() {
  if (kv) return kv;
  try { kv = require('@vercel/kv'); return kv; } catch { return null; }
}

const JWT_SECRET = process.env.JWT_SECRET || 'netcert-dev-secret';

function computeState(p) {
  if (!p || p.correctCount === 0) return 'unseen';
  if (p.correctStreak >= 3)        return 'mastered';
  if (p.correctCount >= 1)         return 'learning';
  return 'seen';
}

module.exports = async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST')   return res.status(405).json({ error: 'Method not allowed' });

  // ── Auth ─────────────────────────────────────────────────────────────────
  const auth = req.headers.authorization || '';
  if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: 'No token provided' });
  const token = auth.slice(7);

  let decoded;
  try { decoded = jwt.verify(token, JWT_SECRET); }
  catch { return res.status(401).json({ error: 'Invalid or expired token' }); }

  const { questionId, correct, category, sessionStreak } = req.body || {};
  if (questionId === undefined || correct === undefined) {
    return res.status(400).json({ error: 'questionId and correct are required' });
  }

  try {
    const store = await getKV();
    if (!store) {
      return res.status(503).json({
        error: 'Database not configured',
        setup: 'Please configure Vercel KV and run: npm run seed',
      });
    }

    const sid = decoded.studentId;

    // ── Load existing data ────────────────────────────────────────────────
    const [user, progressMap] = await Promise.all([
      store.get(`user:${sid}`),
      store.get(`progress:${sid}`),
    ]);

    if (!user) return res.status(404).json({ error: 'User not found' });

    const progress = progressMap || {};
    const qKey     = String(questionId);
    const prev     = progress[qKey] || {
      state:         'unseen',
      correctCount:  0,
      wrongCount:    0,
      correctStreak: 0,
      lastSeen:      null,
      masteredAt:    null,
    };

    let xpGained = 0;
    const wasUnseen = prev.correctCount === 0 && prev.wrongCount === 0;

    if (correct) {
      prev.correctCount++;
      prev.correctStreak = (prev.correctStreak || 0) + 1;
      xpGained += wasUnseen ? 10 : 5;

      // Master bonus
      if (prev.correctStreak === 3 && !prev.masteredAt) {
        xpGained   += 25;
        prev.masteredAt = new Date().toISOString();
      }
    } else {
      prev.wrongCount++;
      prev.correctStreak = 0;
    }

    // Session streak bonus
    const ss = Number(sessionStreak) || 0;
    if (correct) {
      if      (ss === 3)  xpGained += 15;
      else if (ss === 5)  xpGained += 30;
      else if (ss === 10) xpGained += 60;
    }

    prev.lastSeen = new Date().toISOString();
    prev.state    = computeState(prev);
    if (category)  prev.category = category;

    progress[qKey] = prev;

    // ── Update user XP ────────────────────────────────────────────────────
    user.xp    = (user.xp || 0) + xpGained;
    user.level = Math.floor(user.xp / 500) + 1;

    // Save both in parallel
    await Promise.all([
      store.set(`user:${sid}`, user),
      store.set(`progress:${sid}`, progress),
    ]);

    return res.status(200).json({
      xpGained,
      newXP:    user.xp,
      newLevel: user.level,
      progress: prev,
    });

  } catch (err) {
    console.error('[progress/save] error:', err);
    return res.status(500).json({ error: 'Internal server error', detail: err.message });
  }
};
