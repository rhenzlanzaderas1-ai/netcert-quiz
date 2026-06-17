/**
 * js/auth.js — NetCert Authentication Module
 * ─────────────────────────────────────────────────────────────────────────────
 * Provides Auth.login(), Auth.logout(), Auth.currentUser(), etc.
 * Falls back gracefully when the API is unavailable.
 */

const Auth = (() => {
  const TOKEN_KEY = 'nc-jwt';
  const USER_KEY  = 'nc-user';
  const API_BASE  = '/api/auth';

  // ── Token storage ─────────────────────────────────────────────────────────

  function getToken() {
    return localStorage.getItem(TOKEN_KEY) || null;
  }

  function _setToken(token) {
    localStorage.setItem(TOKEN_KEY, token);
  }

  function _clearToken() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  // ── Parse JWT payload (no verification — trust the server) ────────────────

  function _parseJWT(token) {
    try {
      const payload = token.split('.')[1];
      return JSON.parse(atob(payload));
    } catch {
      return null;
    }
  }

  // ── isLoggedIn ────────────────────────────────────────────────────────────

  function isLoggedIn() {
    const token = getToken();
    if (!token) return false;
    const p = _parseJWT(token);
    if (!p || !p.exp) return false;
    // Check expiry
    return Date.now() / 1000 < p.exp;
  }

  // ── currentUser — returns cached user object ───────────────────────────────

  function currentUser() {
    const raw = localStorage.getItem(USER_KEY);
    if (raw) {
      try { return JSON.parse(raw); } catch { /* fall through */ }
    }
    // Fall back to JWT payload
    const token = getToken();
    return token ? _parseJWT(token) : null;
  }

  // ── requireAuth — redirect to login if not authenticated ─────────────────

  function requireAuth() {
    if (!isLoggedIn()) {
      // Show login view instead of redirect (SPA mode)
      const app = window.app;
      if (app && typeof app.showLogin === 'function') {
        app.showLogin();
      }
      return false;
    }
    return true;
  }

  // ── login ─────────────────────────────────────────────────────────────────

  async function login(studentId, password, remember = false) {
    const resp = await fetch(`${API_BASE}/login`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ studentId: String(studentId), password: String(password) }),
    });

    const data = await resp.json();

    if (!resp.ok) {
      throw new Error(data.error || 'Login failed');
    }

    // Store token
    _setToken(data.token);

    // Cache user object
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));

    if (!remember) {
      // Clear on browser close using sessionStorage mirror
      sessionStorage.setItem('nc-session-active', '1');
    }

    return data; // { token, user, xpGained }
  }

  // ── logout ────────────────────────────────────────────────────────────────

  function logout() {
    _clearToken();
    sessionStorage.removeItem('nc-session-active');
    // Show login view
    const app = window.app;
    if (app && typeof app.showLogin === 'function') {
      app.showLogin();
    } else {
      window.location.reload();
    }
  }

  // ── fetchMe — get fresh profile from server ───────────────────────────────

  async function fetchMe() {
    const token = getToken();
    if (!token) throw new Error('Not authenticated');

    const resp = await fetch(`${API_BASE}/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await resp.json();
    if (!resp.ok) throw new Error(data.error || 'Failed to load profile');

    // Update cache
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    return data.user;
  }

  // ── changePassword ────────────────────────────────────────────────────────

  async function changePassword(oldPassword, newPassword) {
    const token = getToken();
    if (!token) throw new Error('Not authenticated');

    const resp = await fetch(`${API_BASE}/change-password`, {
      method:  'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization:  `Bearer ${token}`,
      },
      body: JSON.stringify({ oldPassword, newPassword }),
    });

    const data = await resp.json();
    if (!resp.ok) throw new Error(data.error || 'Failed to change password');
    return data;
  }

  // ── updateCachedUser — merge partial updates into localStorage ────────────

  function updateCachedUser(partial) {
    const user = currentUser() || {};
    const merged = { ...user, ...partial };
    localStorage.setItem(USER_KEY, JSON.stringify(merged));
    return merged;
  }

  // ── getInitials — derive avatar initials from name ────────────────────────

  function getInitials(name) {
    if (!name) return '?';
    // Extract English name from parentheses if present
    const enMatch = name.match(/\(([^)]+)\)/);
    if (enMatch) {
      const parts = enMatch[1].trim().split(/\s+/);
      return parts.length >= 2
        ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
        : parts[0].slice(0, 2).toUpperCase();
    }
    // Chinese name: first 2 chars
    return name.slice(0, 2);
  }

  // ── Public API ────────────────────────────────────────────────────────────
  return {
    login,
    logout,
    fetchMe,
    changePassword,
    getToken,
    isLoggedIn,
    currentUser,
    requireAuth,
    updateCachedUser,
    getInitials,
  };
})();
