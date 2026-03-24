// routes/applications.js — Applications API (User + HR) · ResumeIQ v3.0
const express = require('express');
const router  = express.Router();
const { getCol, toObjId, nowUTC, msToDate } = require('../config/database');
const { ok, fail, requireAuth, requireHR }  = require('../middleware/helpers');

function appRow(a) {
  return {
    id:              a._id.toString(),
    job_id:          (a.job_id   || '').toString(),
    title:           a.title            || '',
    company:         a.company          || '',
    logo_emoji:      a.logo_emoji       || '🏢',
    score:           parseInt(a.score)  || 0,
    status:          a.status           || 'applied',
    applied_at:      msToDate(a.applied_at),
    notes:           a.notes            || '',
    candidate_name:  a.candidate_name   || 'Unknown',
    candidate_email: a.candidate_email  || '',
    resume_name:     a.resume_name      || null,
    resume_path:     a.resume_path      || null,
  };
}

/* ── USER: LIST ────────────────────────────────────────── */
router.get('/list', async (req, res) => {
  try {
    const u = await requireAuth(req, res);
    if (!u) return;
    const uid    = u._id.toString();
    const { q = '', status = '' } = req.query;
    const apps   = await getCol('applications');
    const filter = { user_id: uid };
    if (q) filter.$or = [
      { title:   { $regex: q, $options: 'i' } },
      { company: { $regex: q, $options: 'i' } },
    ];
    if (status && status !== 'all') filter.status = status;

    const cursor = await apps.find(filter).sort({ applied_at: -1 }).toArray();
    const result = cursor.map(a => ({
      id:         a._id.toString(),
      job_id:     (a.job_id || '').toString(),
      title:      a.title      || '',
      company:    a.company    || '',
      logo_emoji: a.logo_emoji || '🏢',
      type:       a.type       || '',
      loc:        a.loc        || '',
      score:      parseInt(a.score) || 0,
      status:     a.status     || 'applied',
      applied_at: msToDate(a.applied_at),
      notes:      a.notes      || '',
    }));

    return ok(res, {
      applications: result,
      stats: {
        total:       await apps.countDocuments({ user_id: uid }),
        shortlisted: await apps.countDocuments({ user_id: uid, status: 'shortlisted' }),
        pending:     await apps.countDocuments({ user_id: uid, status: 'applied' }),
        rejected:    await apps.countDocuments({ user_id: uid, status: 'rejected' }),
      },
    });
  } catch (e) {
    console.error(e);
    return fail(res, 'Server error', 500);
  }
});

/* ── USER: WITHDRAW ────────────────────────────────────── */
router.post('/withdraw', async (req, res) => {
  try {
    const u = await requireAuth(req, res);
    if (!u) return;
    const uid    = u._id.toString();
    const { app_id = '' } = req.body;
    if (!app_id) return fail(res, 'app_id is required');
    const apps = await getCol('applications');
    let r;
    try { r = await apps.deleteOne({ _id: toObjId(app_id), user_id: uid }); }
    catch { return fail(res, 'Invalid application ID'); }
    if (r.deletedCount === 0) return fail(res, 'Application not found', 404);
    return ok(res, {}, 'Application withdrawn');
  } catch (e) {
    console.error(e);
    return fail(res, 'Server error', 500);
  }
});

/* ── USER: STATS ───────────────────────────────────────── */
router.get('/stats', async (req, res) => {
  try {
    const u = await requireAuth(req, res);
    if (!u) return;
    const uid  = u._id.toString();
    const apps = await getCol('applications');
    return ok(res, { stats: {
      total:       await apps.countDocuments({ user_id: uid }),
      shortlisted: await apps.countDocuments({ user_id: uid, status: 'shortlisted' }),
      pending:     await apps.countDocuments({ user_id: uid, status: 'applied' }),
      rejected:    await apps.countDocuments({ user_id: uid, status: 'rejected' }),
    }});
  } catch (e) {
    console.error(e);
    return fail(res, 'Server error', 500);
  }
});

/* ── HR: APPS FOR A SPECIFIC JOB ───────────────────────── */
router.get('/for_job', async (req, res) => {
  try {
    const hr = await requireHR(req, res);
    if (!hr) return;
    const { job_id = '' } = req.query;
    if (!job_id) return fail(res, 'job_id is required');
    const apps   = await getCol('applications');
    const cursor = await apps.find({ job_id }).sort({ score: -1, applied_at: -1 }).toArray();
    return ok(res, { applications: cursor.map(appRow), total: cursor.length });
  } catch (e) {
    console.error(e);
    return fail(res, 'Server error', 500);
  }
});

/* ── HR: ALL APPLICATIONS FOR HR'S JOBS ────────────────── */
router.get('/all_hr', async (req, res) => {
  try {
    const hr   = await requireHR(req, res);
    if (!hr) return;
    const hrid = hr._id.toString();
    const jobs = await getCol('jobs');
    const jobList = await jobs.find({ 
      $or: [
        { posted_by: hrid },
        { posted_by: 'system' },
        { is_aggregated: true }
      ]
    }, { projection: { _id: 1 } }).toArray();
    const hrJobIds = jobList.map(j => j._id.toString());

    if (hrJobIds.length === 0) return ok(res, { applications: [], stats: { total: 0, new_today: 0, shortlisted: 0, hired: 0 } });

    const { q = '', status = '' } = req.query;
    const apps   = await getCol('applications');
    const filter = { job_id: { $in: hrJobIds } };
    if (q) filter.$or = [
      { title:          { $regex: q, $options: 'i' } },
      { candidate_name: { $regex: q, $options: 'i' } },
    ];
    if (status && status !== 'all') filter.status = status;

    const cursor   = await apps.find(filter).sort({ score: -1, applied_at: -1 }).toArray();
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);

    return ok(res, {
      applications: cursor.map(appRow),
      stats: {
        total:       await apps.countDocuments({ job_id: { $in: hrJobIds } }),
        new_today:   await apps.countDocuments({ job_id: { $in: hrJobIds }, applied_at: { $gte: todayStart } }),
        shortlisted: await apps.countDocuments({ job_id: { $in: hrJobIds }, status: 'shortlisted' }),
        hired:       await apps.countDocuments({ job_id: { $in: hrJobIds }, status: 'hired' }),
      },
    });
  } catch (e) {
    console.error(e);
    return fail(res, 'Server error', 500);
  }
});

/* ── HR: UPDATE STATUS ─────────────────────────────────── */
router.post('/update_status', async (req, res) => {
  try {
    const hr   = await requireHR(req, res);
    if (!hr) return;
    const hrid = hr._id.toString();
    const { app_id = '', status = '', notes = '' } = req.body;
    const allowed = ['applied', 'shortlisted', 'interview', 'hired', 'rejected'];
    if (!app_id)              return fail(res, 'app_id is required');
    if (!allowed.includes(status)) return fail(res, 'Invalid status value');

    const apps = await getCol('applications');
    let app;
    try { app = await apps.findOne({ _id: toObjId(app_id) }); }
    catch { return fail(res, 'Invalid application ID'); }
    if (!app) return fail(res, 'Application not found', 404);

    const jobs = await getCol('jobs');
    const job  = await jobs.findOne({ _id: toObjId(app.job_id.toString()) });
    if (!job) return fail(res, 'Job not found', 404);
    
    // Check if HR has permission (own job, system job, or aggregated job)
    const isAllowed = job.posted_by.toString() === hrid || job.posted_by === 'system' || job.is_aggregated;
    if (!isAllowed) return fail(res, 'Forbidden — not your job', 403);

    await apps.updateOne({ _id: toObjId(app_id) }, { $set: { status, notes: notes.trim(), updated_at: nowUTC() } });
    
    // 📡 Real-time: Notify User about status change
    const io = req.app.get('io');
    if (io && app.user_id) {
      io.emit('notification', {
        type: 'status_update',
        message: `Your application for "${job.title}" is now ${status.toUpperCase()}`,
        status: status,
        user_id: app.user_id.toString()
      });
    }

    // 📧 Standard Email logic...
    try {
      const { sendStatusEmail } = require('../utils/mailer');
      sendStatusEmail(app.candidate_email, app.candidate_name, job.title, job.company, status, notes.trim());
    } catch(err) { console.error("Email failed:", err); }

    return ok(res, { new_status: status }, 'Status updated to ' + status.charAt(0).toUpperCase() + status.slice(1));
  } catch (e) {
    console.error(e);
    return fail(res, 'Server error', 500);
  }
});

/* ── HR: STATS ─────────────────────────────────────────── */
router.get('/hr_stats', async (req, res) => {
  try {
    const hr   = await requireHR(req, res);
    if (!hr) return;
    const hrid = hr._id.toString();
    const jobs = await getCol('jobs');
    const jobList = await jobs.find({ 
      $or: [
        { posted_by: hrid },
        { posted_by: 'system' },
        { is_aggregated: true }
      ]
    }, { projection: { _id: 1 } }).toArray();
    const hrJobIds = jobList.map(j => j._id.toString());
    if (hrJobIds.length === 0) return ok(res, { stats: { total: 0, new_today: 0, shortlisted: 0, hired: 0 } });

    const apps = await getCol('applications');
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    return ok(res, { stats: {
      total:       await apps.countDocuments({ job_id: { $in: hrJobIds } }),
      new_today:   await apps.countDocuments({ job_id: { $in: hrJobIds }, applied_at: { $gte: todayStart } }),
      shortlisted: await apps.countDocuments({ job_id: { $in: hrJobIds }, status: 'shortlisted' }),
      hired:       await apps.countDocuments({ job_id: { $in: hrJobIds }, status: 'hired' }),
    }});
  } catch (e) {
    console.error(e);
    return fail(res, 'Server error', 500);
  }
});

module.exports = router;
