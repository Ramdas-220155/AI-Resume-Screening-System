// routes/hr_dashboard.js — HR Dashboard · ResumeIQ v3.0
const express = require('express');
const router  = express.Router();
const { getCol, msToDate } = require('../config/database');
const { ok, fail, requireHR } = require('../middleware/helpers');

/* ── FULL DASHBOARD ────────────────────────────────────── */
router.get('/', async (req, res) => {
  try {
    const hr   = await requireHR(req, res);
    if (!hr) return;
    const hrid = hr._id.toString();
    const { action = 'dashboard' } = req.query;

    const jobs = await getCol('jobs');
    const apps = await getCol('applications');
    const jobList  = await jobs.find({ posted_by: hrid }, { projection: { _id: 1 } }).toArray();
    const hrJobIds = jobList.map(j => j._id.toString());

    /* ── CANDIDATES ── */
    if (action === 'candidates') {
      if (hrJobIds.length === 0) return ok(res, { applications: [] });
      const { q = '' } = req.query;
      const filter = { job_id: { $in: hrJobIds } };
      if (q) filter.$or = [
        { candidate_name:  { $regex: q, $options: 'i' } },
        { candidate_email: { $regex: q, $options: 'i' } },
        { title:           { $regex: q, $options: 'i' } },
      ];
      const cursor = await apps.find(filter).sort({ applied_at: -1 }).toArray();
      const result = cursor.map(a => ({
        id:              a._id.toString(),
        job_id:          (a.job_id || '').toString(),
        title:           a.title           || '',
        company:         a.company         || '',
        score:           parseInt(a.score) || 0,
        status:          a.status          || 'applied',
        applied_at:      msToDate(a.applied_at),
        candidate_name:  a.candidate_name  || 'Unknown',
        candidate_email: a.candidate_email || '',
        resume_name:     a.resume_name     || null,
      }));
      return ok(res, { applications: result, total: result.length });
    }

    /* ── DASHBOARD ── */
    const activeJobs  = await jobs.countDocuments({ posted_by: hrid, status: 'active' });
    const totalApps   = hrJobIds.length === 0 ? 0 : await apps.countDocuments({ job_id: { $in: hrJobIds } });
    const shortlisted = hrJobIds.length === 0 ? 0 : await apps.countDocuments({ job_id: { $in: hrJobIds }, status: 'shortlisted' });
    const hired       = hrJobIds.length === 0 ? 0 : await apps.countDocuments({ job_id: { $in: hrJobIds }, status: 'hired' });
    const todayStart  = new Date(); todayStart.setHours(0, 0, 0, 0);
    const newToday    = hrJobIds.length === 0 ? 0 : await apps.countDocuments({ job_id: { $in: hrJobIds }, applied_at: { $gte: todayStart } });

    const recentApps = [];
    if (hrJobIds.length > 0) {
      const rcur = await apps.find({ job_id: { $in: hrJobIds } }).sort({ applied_at: -1 }).limit(6).toArray();
      for (const a of rcur) {
        recentApps.push({
          id:              a._id.toString(),
          job_id:          (a.job_id || '').toString(),
          title:           a.title           || '',
          score:           parseInt(a.score) || 0,
          status:          a.status          || 'applied',
          applied_at:      msToDate(a.applied_at),
          candidate_name:  a.candidate_name  || 'Unknown',
          candidate_email: a.candidate_email || '',
        });
      }
    }

    const activeJobList = [];
    const ajcur = await jobs.find({ posted_by: hrid, status: 'active' }).sort({ posted_at: -1 }).limit(5).toArray();
    for (const j of ajcur) {
      const jid = j._id.toString();
      const ac  = await apps.countDocuments({ job_id: jid });
      activeJobList.push({
        id:          jid,
        title:       j.title,
        company:     j.company,
        logo_emoji:  j.logo_emoji || '🏢',
        type:        j.type,
        loc:         j.loc,
        status:      j.status     || 'active',
        app_count:   ac,
        posted_at:   msToDate(j.posted_at),
      });
    }

    return ok(res, {
      stats: { active_jobs: activeJobs, total_apps: totalApps, shortlisted, hired, new_today: newToday },
      recent_applications: recentApps,
      active_jobs:         activeJobList,
      hr: {
        name:     hr.name,
        initials: hr.initials || 'H',
        company:  hr.company  || '',
        plan:     hr.plan     || 'Free',
      },
    });
  } catch (e) {
    console.error(e);
    return fail(res, 'Server error', 500);
  }
});

module.exports = router;
