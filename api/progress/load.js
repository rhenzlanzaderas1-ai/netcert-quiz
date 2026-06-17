/**
 * GET /api/progress/load
 * Headers: Authorization: Bearer <token>
 * Returns: {
 *   user: { studentId, name, role, xp, level, streak, lastActiveDate },
 *   progress: { [questionId]: { state, correctCount, wrongCount, correctStreak, lastSeen, masteredAt, category } }
 * }
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

module.exports = async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET')    return res.status(405).json({ error: 'Method not allowed' });

  // ── Auth ─────────────────────────────────────────────────────────────────
  const auth = req.headers.authorization || '';
  if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: 'No token provided' });
  const token = auth.slice(7);

  let decoded;
  try { decoded = jwt.verify(token, JWT_SECRET); }
  catch { return res.status(401).json({ error: 'Invalid or expired token' }); }

  try {
    const store = await getKV();
    if (!store) {
      return res.status(503).json({
        error: 'Database not configured',
        setup: 'Please configure Vercel KV and run: npm run seed',
      });
    }

    const sid = decoded.studentId;
    const [user, progressMap] = await Promise.all([
      store.get(`user:${sid}`),
      store.get(`progress:${sid}`),
    ]);

    if (!user) return res.status(404).json({ error: 'User not found' });

    // Strip password hash
    const { passwordHash: _pw, ...safeUser } = user;

    return res.status(200).json({
      user:     safeUser,
      progress: progressMap || {},
    });

  } catch (err) {
    console.error('[progress/load] error:', err);
    return res.status(500).json({ error: 'Internal server error', detail: err.message });
  }
};
