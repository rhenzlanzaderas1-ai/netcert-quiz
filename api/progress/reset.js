/**
 * POST /api/progress/reset
 * Headers: Authorization: Bearer <token>
 * Returns: { success: true }
 *
 * Deletes the progress map and resets user XP/level to zero.
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
  if (req.method !== 'POST')   return res.status(405).json({ error: 'Method not allowed' });

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

    const sid  = decoded.studentId;
    const user = await store.get(`user:${sid}`);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Reset progress map
    await store.set(`progress:${sid}`, {});

    // Reset XP and level, keep streak and name etc
    user.xp    = 0;
    user.level = 1;
    user.streak = 0;
    await store.set(`user:${sid}`, user);

    return res.status(200).json({
      success: true,
      message: 'Progress and XP have been reset',
    });

  } catch (err) {
    console.error('[progress/reset] error:', err);
    return res.status(500).json({ error: 'Internal server error', detail: err.message });
  }
};
