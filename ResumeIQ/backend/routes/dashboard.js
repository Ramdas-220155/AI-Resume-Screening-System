// routes/dashboard.js — User Home Dashboard Stats · ResumeIQ v3.0
const express = require('express');
const router  = express.Router();
const { getCol, msToDate } = require('../config/database');
const { ok, fail, requireAuth } = require('../middleware/helpers');

router.get('/', async (req, res) => {
  try {
    const u   = await requireAuth(req, res);
    if (!u) return;
    const uid = u._id.toString();

    const apps = await getCol('applications');
    const jobs = await getCol('jobs');

    const total     = await apps.countDocuments({ user_id: uid });
    const short     = await apps.countDocuments({ user_id: uid, status: 'shortlisted' });
    const rejected  = await apps.countDocuments({ user_id: uid, status: 'rejected' });
    const interview = await apps.countDocuments({ user_id: uid, status: 'interview' });
    const totalJobs = await jobs.countDocuments({ status: { $ne: 'closed' } });

    const skillCnt  = (u.skills || []).length;
    const hasResume = !!u.resume_path;
    const hasPhone  = !!u.phone;
    const hasBio    = !!u.bio;
    const aiScore   = Math.min(99, 50 + (skillCnt * 5) + (hasResume ? 12 : 0) + (hasPhone ? 4 : 0) + (hasBio ? 7 : 0) + Math.min(total * 2, 16));

    const recent = [];
    const cursor = await apps.find({ user_id: uid }).sort({ applied_at: -1 }).limit(5).toArray();
    for (const a of cursor) {
      recent.push({
        id:          a._id.toString(),
        title:       a.title,
        company:     a.company,
        logo_emoji:  a.logo_emoji || '🏢',
        type:        a.type       || '',
        score:       parseInt(a.score) || 0,
        status:      a.status,
        applied_at:  msToDate(a.applied_at),
      });
    }

    return ok(res, {
      stats: {
        total_apps:     total,
        shortlisted:    short,
        rejected,
        interview,
        jobs_available: totalJobs,
        ai_score:       Math.round(aiScore),
      },
      recent_applications: recent,
      user: {
        name:     u.name,
        initials: u.initials || 'U',
        plan:     u.plan     || 'Free',
      },
    });
  } catch (e) {
    console.error(e);
    return fail(res, 'Server error', 500);
  }
});

module.exports = router;
