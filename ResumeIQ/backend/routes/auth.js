// routes/auth.js — Register & Login (User + HR) · ResumeIQ v3.0
const express = require('express');
const bcrypt  = require('bcryptjs');
const router  = express.Router();
const { getCol, nowUTC } = require('../config/database');
const { ok, fail }       = require('../middleware/helpers');

/* ── REGISTER ──────────────────────────────────────────── */
router.post('/register', async (req, res) => {
  try {
    const { name = '', email = '', password = '', role = 'user', company = '' } = req.body;
    const cleanName  = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanRole  = ['user', 'hr'].includes(role) ? role : 'user';

    if (!cleanName || !cleanEmail || !password) return fail(res, 'Name, email and password are required');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) return fail(res, 'Invalid email address');
    if (password.length < 6) return fail(res, 'Password must be at least 6 characters');

    const users = await getCol('users');
    if (await users.findOne({ email: cleanEmail })) return fail(res, 'An account with this email already exists', 409);

    const words    = cleanName.split(' ').filter(Boolean);
    const initials = words.map(w => w[0]).join('').toUpperCase().slice(0, 2);
    const hashed   = await bcrypt.hash(password, 10);

    const doc = {
      name:       cleanName,
      email:      cleanEmail,
      password:   hashed,
      initials,
      role:       cleanRole,
      company:    company.trim(),
      plan:       'Free',
      created_at: nowUTC(),
      updated_at: nowUTC(),
    };

    const result = await users.insertOne(doc);
    return ok(res, {
      user_id:  result.insertedId.toString(),
      name:     cleanName,
      email:    cleanEmail,
      initials,
      plan:     'Free',
      role:     cleanRole,
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
    const cleanRole  = ['user', 'hr'].includes(role) ? role : 'user';

    if (!cleanEmail || !password) return fail(res, 'Email and password are required');

    const users = await getCol('users');
    const u     = await users.findOne({ email: cleanEmail });

    if (!u || !(await bcrypt.compare(password, u.password))) return fail(res, 'Invalid email or password', 401);
    if ((u.role || 'user') !== cleanRole) return fail(res, 'Incorrect login portal for this account', 401);

    return ok(res, {
      user_id:  u._id.toString(),
      name:     u.name,
      email:    u.email,
      initials: u.initials || u.name[0].toUpperCase(),
      plan:     u.plan     || 'Free',
      role:     u.role     || 'user',
      company:  u.company  || '',
    }, 'Login successful');
  } catch (e) {
    console.error(e);
    return fail(res, 'Server error', 500);
  }
});

module.exports = router;
