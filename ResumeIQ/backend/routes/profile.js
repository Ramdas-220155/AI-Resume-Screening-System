// routes/profile.js — User & HR Profile Endpoints · ResumeIQ v3.0
const express = require('express');
const router  = express.Router();
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');
const bcrypt  = require('bcryptjs');
const { getCol, toObjId, nowUTC, msToDate, UPLOAD_DIR, MAX_FILE_SIZE, ALLOWED_EXTS } = require('../config/database');
const { ok, fail, requireAuth } = require('../middleware/helpers');

// Multer storage config
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename:    (req, file, cb) => {
    const uid = req.headers['x-user-id'] || 'unknown';
    const ext = path.extname(file.originalname).toLowerCase().slice(1);
    cb(null, `${uid}_${Date.now()}.${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase().slice(1);
    if (ALLOWED_EXTS.includes(ext)) cb(null, true);
    else cb(new Error('Only PDF, DOC, DOCX files are allowed'));
  },
});

/* ── GET PROFILE ───────────────────────────────────────── */
router.get('/', async (req, res) => {
  try {
    const u = await requireAuth(req, res);
    if (!u) return;
    const uid  = u._id.toString();
    const apps = await getCol('applications');
    const totalApps   = await apps.countDocuments({ user_id: uid });
    const shortlisted = await apps.countDocuments({ user_id: uid, status: 'shortlisted' });

    const fields = ['name','email','phone','location','bio','skills','linkedin','resume_path'];
    const filled = fields.filter(f => { const v = u[f]; return v && v !== '' && !(Array.isArray(v) && v.length === 0); }).length;
    const completeness = Math.round((filled / fields.length) * 100);

    return ok(res, { profile: {
      id:           uid,
      name:         u.name,
      email:        u.email,
      initials:     u.initials    || 'U',
      role:         u.role        || 'user',
      plan:         u.plan        || 'Free',
      company:      u.company     || '',
      phone:        u.phone       || '',
      location:     u.location    || '',
      bio:          u.bio         || '',
      skills:       u.skills      || [],
      linkedin:     u.linkedin    || '',
      github:       u.github      || '',
      website:      u.website     || '',
      resume_name:  u.resume_name || null,
      notif_prefs:  u.notif_prefs || {},
      completeness,
      stats: { total: totalApps, shortlisted },
    }});
  } catch (e) {
    console.error(e);
    return fail(res, 'Server error', 500);
  }
});

/* ── UPDATE PROFILE ────────────────────────────────────── */
router.post('/update', async (req, res) => {
  try {
    const u = await requireAuth(req, res);
    if (!u) return;
    const uid  = u._id.toString();
    const { name = u.name, phone = '', location = '', bio = '',
            linkedin = '', github = '', website = '', company = '', skills = [] } = req.body;

    const cleanName = name.trim();
    if (!cleanName) return fail(res, 'Name is required');

    const words    = cleanName.split(' ').filter(Boolean);
    const initials = words.map(w => w[0]).join('').toUpperCase().slice(0, 2);
    const cleanSkills = (Array.isArray(skills) ? skills : []).map(s => s.trim()).filter(Boolean);

    const users = await getCol('users');
    await users.updateOne({ _id: toObjId(uid) }, { $set: {
      name:       cleanName,
      initials,
      phone:      phone.trim(),
      location:   location.trim(),
      bio:        bio.trim(),
      linkedin:   linkedin.trim(),
      github:     github.trim(),
      website:    website.trim(),
      company:    company.trim() || (u.company || ''),
      skills:     cleanSkills,
      updated_at: nowUTC(),
    }});
    return ok(res, { initials }, 'Profile updated successfully');
  } catch (e) {
    console.error(e);
    return fail(res, 'Server error', 500);
  }
});

/* ── CHANGE PASSWORD ───────────────────────────────────── */
router.post('/password', async (req, res) => {
  try {
    const u = await requireAuth(req, res);
    if (!u) return;
    const { current_password = '', new_password = '', confirm_password = '' } = req.body;
    if (!current_password || !new_password) return fail(res, 'Current and new password are required');
    if (new_password !== confirm_password)  return fail(res, 'Passwords do not match');
    if (new_password.length < 6)            return fail(res, 'Password must be at least 6 characters');
    if (!(await bcrypt.compare(current_password, u.password))) return fail(res, 'Current password is incorrect', 401);

    const users = await getCol('users');
    await users.updateOne({ _id: toObjId(u._id.toString()) }, { $set: {
      password:   await bcrypt.hash(new_password, 10),
      updated_at: nowUTC(),
    }});
    return ok(res, {}, 'Password updated successfully');
  } catch (e) {
    console.error(e);
    return fail(res, 'Server error', 500);
  }
});

/* ── NOTIFICATION PREFS ────────────────────────────────── */
router.post('/notif', async (req, res) => {
  try {
    const u = await requireAuth(req, res);
    if (!u) return;
    const { new_match = false, status_update = false, weekly_digest = false, marketing = false } = req.body;
    const users = await getCol('users');
    await users.updateOne({ _id: toObjId(u._id.toString()) }, { $set: {
      notif_prefs: { new_match: !!new_match, status_update: !!status_update, weekly_digest: !!weekly_digest, marketing: !!marketing },
      updated_at: nowUTC(),
    }});
    return ok(res, {}, 'Notification preferences saved');
  } catch (e) {
    console.error(e);
    return fail(res, 'Server error', 500);
  }
});

/* ── RESUME UPLOAD ─────────────────────────────────────── */
router.post('/resume', upload.single('resume'), async (req, res) => {
  try {
    const u = await requireAuth(req, res);
    if (!u) return;
    if (!req.file) return fail(res, 'No file uploaded');

    // Remove old resume
    if (u.resume_path && fs.existsSync(u.resume_path)) {
      try { fs.unlinkSync(u.resume_path); } catch {}
    }

    const users = await getCol('users');
    await users.updateOne({ _id: toObjId(u._id.toString()) }, { $set: {
      resume_path: req.file.path,
      resume_name: req.file.originalname,
      updated_at:  nowUTC(),
    }});
    return ok(res, { resume_name: req.file.originalname }, 'Resume uploaded successfully');
  } catch (e) {
    if (e.code === 'LIMIT_FILE_SIZE') return fail(res, 'File too large (max 5 MB)');
    console.error(e);
    return fail(res, e.message || 'Server error', 500);
  }
});

module.exports = router;
