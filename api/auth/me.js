/**
 * GET /api/auth/me
 * Headers: Authorization: Bearer <token>
 * Returns: full user profile from KV
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

  // ── Auth check ────────────────────────────────────────────────────────────
  const auth = req.headers.authorization || '';
  if (!auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  const token = auth.slice(7);

  let decoded;
  try {
    decoded = jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  try {
    const store = await getKV();
    if (!store) {
      // Return decoded JWT payload when KV is unavailable
      return res.status(200).json({ user: decoded, source: 'jwt-only' });
    }

    const user = await store.get(`user:${decoded.studentId}`);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Never return the password hash to the client
    const { passwordHash: _pw, ...safeUser } = user;
    return res.status(200).json({ user: safeUser });

  } catch (err) {
    console.error('[me] error:', err);
    return res.status(500).json({ error: 'Internal server error', detail: err.message });
  }
};
