// routes/auth.js — Register & Login (User + HR) + Google OAuth · ResumeIQ v3.0
//new
const crypto = require('crypto');
const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const { OAuth2Client } = require('google-auth-library');
const { getCol, nowUTC } = require('../config/database');
const { ok, fail } = require('../middleware/helpers');

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI =
  process.env.GOOGLE_REDIRECT_URI ||
  `http://localhost:${process.env.PORT || 5000}/api/auth/google/callback`;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || `http://localhost:${process.env.PORT || 5000}`;

/* one-time auth codes returned after OAuth callback */
const pendingCodes = new Map();
const CODE_TTL_MS = 5 * 60 * 1000;

function issueCode(payload) {
  const code = crypto.randomBytes(32).toString('hex');
  pendingCodes.set(code, { payload, exp: Date.now() + CODE_TTL_MS });
  for (const [k, v] of pendingCodes) {
    if (v.exp < Date.now()) pendingCodes.delete(k);
  }
  return code;
}

/* ── REGISTER ──────────────────────────────────────────── */
router.post('/register', async (req, res) => {
  try {
    const { name = '', email = '', password = '', role = 'user', company = '' } = req.body;

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanRole = ['user', 'hr'].includes(role) ? role : 'user';

    if (!cleanName || !cleanEmail || !password) {
      return fail(res, 'Name, email and password are required');
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return fail(res, 'Invalid email address');
    }

    if (password.length < 6) {
      return fail(res, 'Password must be at least 6 characters');
    }

    const users = await getCol('users');

    if (await users.findOne({ email: cleanEmail })) {
      return fail(res, 'An account with this email already exists', 409);
    }

    const words = cleanName.split(' ').filter(Boolean);
    const initials = words.map(w => w[0]).join('').toUpperCase().slice(0, 2);

    const hashed = await bcrypt.hash(password, 10);

    const doc = {
      name: cleanName,
      email: cleanEmail,
      password: hashed,
      initials,
      role: cleanRole,
      company: company.trim(),
      plan: 'Free',
      created_at: nowUTC(),
      updated_at: nowUTC(),
    };

    const result = await users.insertOne(doc);

    return ok(res, {
      user_id: result.insertedId.toString(),
      name: cleanName,
      email: cleanEmail,
      initials,
      plan: 'Free',
      role: cleanRole,
    }, 'Registration successful');

  } catch (e) {
    console.error(e);
    return fail(res, 'Server error', 500);
  }
});

/* ── LOGIN ─────────────────────────────────────────────── */
router.post('/login', async (req, res) => {
  try {
    const { email = '', password = '', role = 'user' } = req.body;

    const cleanEmail = email.trim().toLowerCase();
    const cleanRole = ['user', 'hr'].includes(role) ? role : 'user';

    if (!cleanEmail || !password) {
      return fail(res, 'Email and password are required');
    }

    const users = await getCol('users');
    const u = await users.findOne({ email: cleanEmail });

    if (!u || !(await bcrypt.compare(password, u.password))) {
      return fail(res, 'Invalid email or password', 401);
    }

    if ((u.role || 'user') !== cleanRole) {
      return fail(res, 'Incorrect login portal for this account', 401);
    }

    return ok(res, {
      user_id: u._id.toString(),
      name: u.name,
      email: u.email,
      initials: u.initials || u.name[0].toUpperCase(),
      plan: u.plan || 'Free',
      role: u.role || 'user',
      company: u.company || '',
    }, 'Login successful');

  } catch (e) {
    console.error(e);
    return fail(res, 'Server error', 500);
  }
});

/* ── GOOGLE OAUTH: REDIRECT ────────────────────────────── */
router.get('/google', (req, res) => {
  if (!CLIENT_ID || !CLIENT_SECRET) {
    return fail(res, 'Google OAuth is not configured on server', 500);
  }
  const role = ['user', 'hr'].includes(req.query.role) ? req.query.role : 'user';

  const client = new OAuth2Client(CLIENT_ID, CLIENT_SECRET);

  const url = client.generateAuthUrl({
    access_type: 'offline',
    scope: ['openid', 'email', 'profile'],
    state: role,
    prompt: 'select_account',
    redirect_uri: REDIRECT_URI // ✅ FIX
  });

  res.redirect(url);
});

/* ── GOOGLE OAUTH: CALLBACK ────────────────────────────── */
router.get('/google/callback', async (req, res) => {
  const { code, state, error } = req.query;

  if (error) {
    const loginPage = state === 'hr' ? '/hr/login.html' : '/user/login.html';
    return res.redirect(`${FRONTEND_ORIGIN}${loginPage}?oauth=fail`);
  }

  try {
    const role = ['user', 'hr'].includes(state) ? state : 'user';
    const client = new OAuth2Client(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

    // Exchange code
    const { tokens } = await client.getToken(code);
    client.setCredentials(tokens);

    // Get user info
    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: CLIENT_ID,
    });

    const payload = ticket.getPayload();

    const { email, name, sub: googleId, picture } = payload;

    const cleanEmail = email.trim().toLowerCase();
    const users = await getCol('users');
    let user = await users.findOne({ email: cleanEmail });

    if (user) {
      if ((user.role || 'user') !== role) {
        const loginPage = role === 'hr' ? '/hr/login.html' : '/user/login.html';
        return res.redirect(`${FRONTEND_ORIGIN}${loginPage}?oauth=wrongportal`);
      }

      if (!user.google_id) {
        await users.updateOne(
          { _id: user._id },
          { $set: { google_id: googleId, updated_at: nowUTC() } }
        );
      }

    } else {
      const words = (name || email).split(' ').filter(Boolean);
      const initials = words.map(w => w[0]).join('').toUpperCase().slice(0, 2);

      const doc = {
        name: name || email.split('@')[0],
        email: cleanEmail,
        password: null,
        initials,
        role,
        company: '',
        plan: 'Free',
        google_id: googleId,
        avatar: picture || null,
        created_at: nowUTC(),
        updated_at: nowUTC(),
      };

      const result = await users.insertOne(doc);
      user = { _id: result.insertedId, ...doc };
    }

    const responsePayload = {
      user_id: user._id.toString(),
      name: user.name,
      email: user.email,
      initials: user.initials || user.name[0].toUpperCase(),
      plan: user.plan || 'Free',
      role: user.role || role,
      company: user.company || '',
    };

    const oneTimeCode = issueCode(responsePayload);
    const successPath = role === 'hr' ? '/hr/oauth-callback.html' : '/user/oauth-callback.html';
    return res.redirect(`${FRONTEND_ORIGIN}${successPath}?code=${encodeURIComponent(oneTimeCode)}`);

  } catch (e) {
    console.error('❌ Google OAuth error:', e);

    const loginPage = state === 'hr' ? '/hr/login.html' : '/user/login.html';
    return res.redirect(`${FRONTEND_ORIGIN}${loginPage}?oauth=error`);
  }
});

/* ── GOOGLE OAUTH: EXCHANGE ONE-TIME CODE ─────────────── */
router.post('/oauth/complete', (req, res) => {
  const code = (req.body && req.body.code) || '';
  const row = pendingCodes.get(code);
  if (!row || row.exp < Date.now()) {
    return fail(res, 'Invalid or expired code', 400);
  }
  pendingCodes.delete(code);
  return ok(res, row.payload, 'OK');
});

module.exports = router;