/**
 * POST /api/auth/login
 * Body: { studentId, password }
 * Returns: { token, user: { studentId, name, role, xp, level, streak } }
 */

const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');

// ── CORS helper ────────────────────────────────────────────────────────────
function cors(res) {
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

// ── KV helper — returns null if KV not configured ─────────────────────────
let kv = null;
async function getKV() {
  if (kv) return kv;
  try {
    kv = require('@vercel/kv');
    return kv;
  } catch {
    return null;
  }
}

// ── Fallback user store (in-memory seed for local dev without KV) ──────────
// Real passwords are bcrypt hashes of the student IDs seeded via seed-users.js
const JWT_SECRET = process.env.JWT_SECRET || 'netcert-dev-secret';

module.exports = async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST')   return res.status(405).json({ error: 'Method not allowed' });

  const { studentId, password } = req.body || {};

  if (!studentId || !password) {
    return res.status(400).json({ error: 'studentId and password are required' });
  }

  try {
    const store = await getKV();

    if (!store) {
      // ── KV not available — check env var hint ───────────────────────────
      return res.status(503).json({
        error: 'Database not configured',
        setup: 'Please configure Vercel KV and run: npm run seed',
        docs:  'https://vercel.com/docs/storage/vercel-kv',
      });
    }

    // ── Load user from KV ─────────────────────────────────────────────────
    const user = await store.get(`user:${studentId}`);

    if (!user) {
      return res.status(401).json({ error: 'Invalid student ID or password' });
    }

    // ── Verify password ───────────────────────────────────────────────────
    const valid = await bcrypt.compare(String(password), user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid student ID or password' });
    }

    // ── Daily login XP bonus ──────────────────────────────────────────────
    const today = new Date().toISOString().slice(0, 10);
    let xpGained = 0;

    if (user.lastActiveDate !== today) {
      user.xp            = (user.xp || 0) + 20;
      xpGained           = 20;
      user.lastActiveDate = today;

      // Streak logic
      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
      if (user.lastActiveDate === yesterday) {
        user.streak = (user.streak || 0) + 1;
      } else if (user.lastActiveDate !== today) {
        user.streak = 1;
      }

      user.level = Math.floor((user.xp || 0) / 500) + 1;
      await store.set(`user:${studentId}`, user);
    }

    // ── Sign JWT ──────────────────────────────────────────────────────────
    const payload = {
      studentId: user.studentId,
      name:      user.name,
      role:      user.role,
    };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

    return res.status(200).json({
      token,
      xpGained,
      user: {
        studentId: user.studentId,
        name:      user.name,
        role:      user.role,
        xp:        user.xp    || 0,
        level:     user.level || 1,
        streak:    user.streak || 0,
        lastActiveDate: user.lastActiveDate,
      },
    });

  } catch (err) {
    console.error('[login] error:', err);
    return res.status(500).json({ error: 'Internal server error', detail: err.message });
  }
};
