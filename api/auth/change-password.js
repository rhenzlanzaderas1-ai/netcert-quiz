/**
 * POST /api/auth/change-password
 * Headers: Authorization: Bearer <token>
 * Body: { oldPassword, newPassword }
 * Returns: { success: true }
 */

const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');

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
const SALT_ROUNDS = 10;

module.exports = async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST')   return res.status(405).json({ error: 'Method not allowed' });

  // ── Auth check ────────────────────────────────────────────────────────────
  const auth = req.headers.authorization || '';
  if (!auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  const token = auth.slice(7);

  let decoded;
  try {
    decoded = jwt.verify(token, JWT_SECRET);
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  const { oldPassword, newPassword } = req.body || {};

  if (!oldPassword || !newPassword) {
    return res.status(400).json({ error: 'oldPassword and newPassword are required' });
  }
  if (String(newPassword).length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters' });
  }

  try {
    const store = await getKV();
    if (!store) {
      return res.status(503).json({
        error: 'Database not configured',
        setup: 'Please configure Vercel KV and run: npm run seed',
      });
    }

    const user = await store.get(`user:${decoded.studentId}`);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Verify old password
    const valid = await bcrypt.compare(String(oldPassword), user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: 'Incorrect current password' });
    }

    // Hash and save new password
    user.passwordHash = await bcrypt.hash(String(newPassword), SALT_ROUNDS);
    await store.set(`user:${decoded.studentId}`, user);

    return res.status(200).json({ success: true, message: 'Password updated successfully' });

  } catch (err) {
    console.error('[change-password] error:', err);
    return res.status(500).json({ error: 'Internal server error', detail: err.message });
  }
};
