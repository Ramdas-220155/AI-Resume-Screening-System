// routes/contact.js — Contact Form API · ResumeIQ v3.0
const express = require('express');
const router  = express.Router();
const { getCol, toObjId, nowUTC, msToDate } = require('../config/database');
const { ok, fail, requireHR } = require('../middleware/helpers');

/* ── SEND ──────────────────────────────────────────────── */
router.post('/send', async (req, res) => {
  try {
    const { name = '', email = '', subject = 'General Inquiry', message = '' } = req.body;
    if (!name.trim())    return fail(res, 'Name is required');
    if (!email.trim())   return fail(res, 'Email is required');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return fail(res, 'Invalid email address');
    if (!message.trim()) return fail(res, 'Message is required');
    if (message.trim().length < 10) return fail(res, 'Message is too short (min 10 characters)');

    const contacts = await getCol('contacts');
    const result   = await contacts.insertOne({
      name:       name.trim(),
      email:      email.trim(),
      subject:    subject.trim(),
      message:    message.trim(),
      status:     'new',
      ip:         req.ip || '',
      user_agent: req.headers['user-agent'] || '',
      created_at: nowUTC(),
    });

    return ok(res, { id: result.insertedId.toString(), name: name.trim() },
      `Thank you ${name.trim()}! We'll get back to you within 24 hours.`);
  } catch (e) {
    console.error(e);
    return fail(res, 'Server error', 500);
  }
});

/* ── LIST (HR/Admin) ───────────────────────────────────── */
router.get('/list', async (req, res) => {
  try {
    const hr = await requireHR(req, res);
    if (!hr) return;
    const contacts = await getCol('contacts');
    const cursor   = await contacts.find({}).sort({ created_at: -1 }).limit(100).toArray();
    const msgs     = cursor.map(m => ({
      id:         m._id.toString(),
      name:       m.name       || '',
      email:      m.email      || '',
      subject:    m.subject    || '',
      message:    m.message    || '',
      status:     m.status     || 'new',
      created_at: msToDate(m.created_at),
    }));
    return ok(res, { messages: msgs, total: msgs.length });
  } catch (e) {
    console.error(e);
    return fail(res, 'Server error', 500);
  }
});

/* ── MARK AS READ ──────────────────────────────────────── */
router.post('/mark_read', async (req, res) => {
  try {
    const hr = await requireHR(req, res);
    if (!hr) return;
    const { id = '' } = req.body;
    if (!id) return fail(res, 'id is required');
    const contacts = await getCol('contacts');
    try { await contacts.updateOne({ _id: toObjId(id) }, { $set: { status: 'read' } }); }
    catch { return fail(res, 'Invalid ID'); }
    return ok(res, {}, 'Marked as read');
  } catch (e) {
    console.error(e);
    return fail(res, 'Server error', 500);
  }
});

module.exports = router;
