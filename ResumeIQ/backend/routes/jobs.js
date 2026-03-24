// routes/jobs.js — Jobs API (User browsing + HR management) · ResumeIQ v3.0
const express = require('express');
const router  = express.Router();
const { getCol, toObjId, nowUTC, msToDate } = require('../config/database');
const { ok, fail, requireAuth, requireHR }  = require('../middleware/helpers');

/* ── LIST (public) ─────────────────────────────────────── */
router.get('/list', async (req, res) => {
  try {
    const { q = '', type = '', loc = '', level = '' } = req.query;
    const jobs   = await getCol('jobs');
    const filter = { status: { $ne: 'closed' } };

    if (q) filter.$or = [
      { title:   { $regex: q, $options: 'i' } },
      { company: { $regex: q, $options: 'i' } },
      { skills:  { $elemMatch: { $regex: q, $options: 'i' } } },
    ];
    if (type  && type  !== 'all') filter.type  = type;
    if (loc   && loc   !== 'all') filter.loc   = loc;
    if (level && level !== 'all') filter.level = level;

    const cursor = await jobs.find(filter).sort({ posted_at: -1 }).limit(100).toArray();

    // Mark applied jobs for authenticated user
    let appliedIds = [];
    const uid = req.headers['x-user-id'];
    if (uid) {
      const appCol = await getCol('applications');
      const myApps = await appCol.find({ user_id: uid }, { projection: { job_id: 1 } }).toArray();
      appliedIds = myApps.map(a => a.job_id);
    }

    const appCol   = await getCol('applications');
    const results  = await Promise.all(cursor.map(async job => {
      const jid      = job._id.toString();
      const appCount = await appCol.countDocuments({ job_id: jid });
      return {
        id:          jid,
        title:       job.title,
        company:     job.company,
        logo_emoji:  job.logo_emoji  || '🏢',
        type:        job.type,
        loc:         job.loc,
        level:       job.level,
        salary:      job.salary      || '',
        skills:      job.skills      || [],
        score:       job.score       || Math.floor(Math.random() * 38) + 60,
        posted_at:   msToDate(job.posted_at),
        applied:     appliedIds.includes(jid),
        app_count:   appCount,
        status:      job.status      || 'active',
      };
    }));

    return ok(res, { jobs: results, total: results.length });
  } catch (e) {
    console.error(e);
    return fail(res, 'Server error', 500);
  }
});

/* ── GET single ────────────────────────────────────────── */
router.get('/get', async (req, res) => {
  try {
    const { id } = req.query;
    if (!id) return fail(res, 'id is required');
    const jobs = await getCol('jobs');
    let job;
    try { job = await jobs.findOne({ _id: toObjId(id) }); }
    catch { return fail(res, 'Invalid job ID'); }
    if (!job) return fail(res, 'Job not found', 404);
    return ok(res, { job: {
      id:          job._id.toString(),
      title:       job.title,
      company:     job.company,
      logo_emoji:  job.logo_emoji  || '🏢',
      type:        job.type,
      loc:         job.loc,
      level:       job.level,
      salary:      job.salary      || '',
      skills:      job.skills      || [],
      description: job.description || '',
      status:      job.status      || 'active',
      posted_at:   msToDate(job.posted_at),
    }});
  } catch (e) {
    console.error(e);
    return fail(res, 'Server error', 500);
  }
});

/* ── APPLY (user) ──────────────────────────────────────── */
router.post('/apply', async (req, res) => {
  try {
    const u = await requireAuth(req, res);
    if (!u) return;
    const uid  = u._id.toString();
    const { job_id = '' } = req.body;
    if (!job_id) return fail(res, 'job_id is required');

    const jobs = await getCol('jobs');
    let job;
    try { job = await jobs.findOne({ _id: toObjId(job_id) }); }
    catch { return fail(res, 'Invalid job ID'); }
    if (!job) return fail(res, 'Job not found', 404);
    if ((job.status || 'active') === 'closed') return fail(res, 'This job is no longer accepting applications', 410);

    const apps = await getCol('applications');
    if (await apps.findOne({ user_id: uid, job_id })) return fail(res, 'You have already applied for this job', 409);

    const result = await apps.insertOne({
      user_id:        uid,
      job_id,
      hr_id:          job.posted_by || null,
      title:          job.title,
      company:        job.company,
      logo_emoji:     job.logo_emoji     || '🏢',
      type:           job.type,
      loc:            job.loc,
      score:          job.score || Math.floor(Math.random() * 38) + 60,
      status:         'applied',
      notes:          '',
      applied_at:     nowUTC(),
      updated_at:     nowUTC(),
      candidate_name:  u.name,
      candidate_email: u.email,
      resume_name:    u.resume_name || null,
      resume_path:    u.resume_path || null,
    });

    return ok(res, {
      application_id: result.insertedId.toString(),
      job_title:      job.title,
      company:        job.company,
    }, 'Application submitted successfully!');
  } catch (e) {
    console.error(e);
    return fail(res, 'Server error', 500);
  }
});

/* ── CREATE (HR) ───────────────────────────────────────── */
router.post('/create', async (req, res) => {
  try {
    const hr = await requireHR(req, res);
    if (!hr) return;
    const { title = '', company = '', type = '', level = '', loc = '', salary = '',
            logo_emoji = '🏢', skills = [], description = '', openings = 1,
            deadline = null } = req.body;

    if (!title.trim())   return fail(res, 'Job title is required');
    if (!(company.trim() || hr.company)) return fail(res, 'Company name is required');
    if (!type.trim())    return fail(res, 'Job type is required');
    if (!level.trim())   return fail(res, 'Experience level is required');
    if (!loc.trim())     return fail(res, 'Location is required');

    const cleanSkills = (Array.isArray(skills) ? skills : []).map(s => s.trim()).filter(Boolean);
    if (cleanSkills.length === 0) return fail(res, 'At least one skill is required');

    const jobs   = await getCol('jobs');
    const result = await jobs.insertOne({
      title:       title.trim(),
      company:     (company.trim() || hr.company || '').trim(),
      logo_emoji:  (logo_emoji.trim() || '🏢'),
      type:        type.trim(),
      level:       level.trim(),
      loc:         loc.trim(),
      salary:      salary.trim(),
      skills:      cleanSkills,
      description: description.trim(),
      openings:    parseInt(openings) || 1,
      deadline:    deadline ? new Date(deadline) : null,
      score:       Math.floor(Math.random() * 35) + 60,
      status:      'active',
      posted_by:   hr._id.toString(),
      posted_at:   nowUTC(),
      updated_at:  nowUTC(),
    });

    return ok(res, { job_id: result.insertedId.toString(), title: title.trim() }, 'Job posted successfully!');
  } catch (e) {
    console.error(e);
    return fail(res, 'Server error', 500);
  }
});

/* ── MY JOBS (HR) ──────────────────────────────────────── */
router.get('/myjobs', async (req, res) => {
  try {
    const hr   = await requireHR(req, res);
    if (!hr) return;
    const hrid = hr._id.toString();
    const jobs = await getCol('jobs');
    const appCol = await getCol('applications');
    const cur  = await jobs.find({ posted_by: hrid }).sort({ posted_at: -1 }).toArray();

    const result = await Promise.all(cur.map(async j => {
      const jid      = j._id.toString();
      const appCount = await appCol.countDocuments({ job_id: jid });
      return {
        id:          jid,
        title:       j.title,
        company:     j.company,
        logo_emoji:  j.logo_emoji || '🏢',
        type:        j.type,
        loc:         j.loc,
        level:       j.level,
        salary:      j.salary    || '',
        status:      j.status    || 'active',
        app_count:   appCount,
        posted_at:   msToDate(j.posted_at),
      };
    }));

    return ok(res, { jobs: result, total: result.length });
  } catch (e) {
    console.error(e);
    return fail(res, 'Server error', 500);
  }
});

/* ── CLOSE (HR) ────────────────────────────────────────── */
router.post('/close', async (req, res) => {
  try {
    const hr  = await requireHR(req, res);
    if (!hr) return;
    const { job_id = '' } = req.body;
    if (!job_id) return fail(res, 'job_id is required');
    const jobs = await getCol('jobs');
    let r;
    try {
      r = await jobs.updateOne(
        { _id: toObjId(job_id), posted_by: hr._id.toString() },
        { $set: { status: 'closed', updated_at: nowUTC() } }
      );
    } catch { return fail(res, 'Invalid job ID'); }
    if (r.matchedCount === 0) return fail(res, 'Job not found or access denied', 404);
    return ok(res, {}, 'Job closed successfully');
  } catch (e) {
    console.error(e);
    return fail(res, 'Server error', 500);
  }
});

/* ── DELETE (HR) ───────────────────────────────────────── */
router.post('/delete', async (req, res) => {
  try {
    const hr  = await requireHR(req, res);
    if (!hr) return;
    const { job_id = '' } = req.body;
    if (!job_id) return fail(res, 'job_id is required');
    const jobs = await getCol('jobs');
    let r;
    try {
      r = await jobs.deleteOne({ _id: toObjId(job_id), posted_by: hr._id.toString() });
    } catch { return fail(res, 'Invalid job ID'); }
    if (r.deletedCount === 0) return fail(res, 'Job not found or access denied', 404);
    return ok(res, {}, 'Job deleted');
  } catch (e) {
    console.error(e);
    return fail(res, 'Server error', 500);
  }
});

/* ── SEED (dev) ────────────────────────────────────────── */
router.get('/seed', async (req, res) => {
  try {
    const jobs = await getCol('jobs');
    const count = await jobs.countDocuments({});
    if (count > 5) return ok(res, { count }, 'Jobs already seeded');

    const samples = [
      { title: 'Frontend Developer',    company: 'TechNova',     logo_emoji: '⚡', type: 'full-time',  loc: 'Hyderabad', level: 'mid',    salary: '₹8L–₹14L/yr',  skills: ['React','TypeScript','CSS','HTML'],             score: 92 },
      { title: 'UI/UX Designer',        company: 'PixelCraft',   logo_emoji: '🎨', type: 'full-time',  loc: 'Bangalore', level: 'mid',    salary: '₹7L–₹12L/yr',  skills: ['Figma','Sketch','Adobe XD','Prototyping'],     score: 78 },
      { title: 'React Engineer',        company: 'Velocity Labs',logo_emoji: '🚀', type: 'remote',     loc: 'Remote',    level: 'senior', salary: '₹18L–₹28L/yr', skills: ['React','Node.js','GraphQL','AWS'],              score: 85 },
      { title: 'Full Stack Developer',  company: 'NexaLabs',    logo_emoji: '🔬', type: 'full-time',  loc: 'Pune',      level: 'mid',    salary: '₹10L–₹18L/yr', skills: ['PHP','Laravel','Vue.js','MySQL'],               score: 88 },
      { title: 'Backend Engineer',      company: 'CloudBase',    logo_emoji: '☁️', type: 'remote',     loc: 'Remote',    level: 'senior', salary: '₹20L–₹35L/yr', skills: ['Node.js','Python','MongoDB','Docker'],          score: 74 },
      { title: 'Data Engineer',         company: 'DataForge',    logo_emoji: '📊', type: 'full-time',  loc: 'Chennai',   level: 'mid',    salary: '₹12L–₹20L/yr', skills: ['Python','Spark','Kafka','SQL'],                 score: 67 },
      { title: 'DevOps Engineer',       company: 'Streamline',   logo_emoji: '🔧', type: 'full-time',  loc: 'Hyderabad', level: 'senior', salary: '₹16L–₹26L/yr', skills: ['Kubernetes','Docker','Terraform','AWS'],        score: 81 },
      { title: 'Mobile Developer',      company: 'AppWave',      logo_emoji: '📱', type: 'full-time',  loc: 'Mumbai',    level: 'junior', salary: '₹5L–₹9L/yr',   skills: ['React Native','Flutter','iOS','Android'],       score: 70 },
      { title: 'ML Engineer',           company: 'NeuralEdge',   logo_emoji: '🧠', type: 'remote',     loc: 'Remote',    level: 'senior', salary: '₹25L–₹45L/yr', skills: ['Python','TensorFlow','PyTorch','MLOps'],        score: 90 },
      { title: 'Cloud Architect',       company: 'Nimbus',       logo_emoji: '⛅', type: 'full-time',  loc: 'Hyderabad', level: 'senior', salary: '₹30L–₹50L/yr', skills: ['AWS','Azure','GCP','Kubernetes'],               score: 83 },
      { title: 'Cybersecurity Analyst', company: 'SecureNet',    logo_emoji: '🔐', type: 'full-time',  loc: 'Delhi',     level: 'mid',    salary: '₹10L–₹18L/yr', skills: ['SIEM','Penetration Testing','Firewalls'],      score: 76 },
      { title: 'Junior PHP Developer',  company: 'WebCraft',     logo_emoji: '🌐', type: 'full-time',  loc: 'Hyderabad', level: 'junior', salary: '₹3.5L–₹6L/yr', skills: ['PHP','MySQL','Laravel','HTML','CSS'],           score: 69 },
      { title: 'Angular Developer',     company: 'FrontEdge',    logo_emoji: '🔺', type: 'contract',   loc: 'Pune',      level: 'mid',    salary: '₹9L–₹16L/yr',  skills: ['Angular','TypeScript','RxJS','REST API'],       score: 77 },
      { title: 'Intern — Software Dev', company: 'StartupNest',  logo_emoji: '🐣', type: 'internship', loc: 'Remote',    level: 'intern', salary: '₹15K–₹25K/mo', skills: ['JavaScript','Python','Git','REST API'],         score: 58 },
      { title: 'QA Automation Engineer',company: 'QualityFirst', logo_emoji: '✅', type: 'full-time',  loc: 'Bangalore', level: 'junior', salary: '₹4L–₹7L/yr',   skills: ['Selenium','Cypress','Jest','Postman'],          score: 63 },
      { title: 'Product Manager',       company: 'Launchpad',    logo_emoji: '🎯', type: 'full-time',  loc: 'Bangalore', level: 'senior', salary: '₹22L–₹40L/yr', skills: ['Agile','Jira','Analytics','Strategy'],          score: 72 },
    ];

    let inserted = 0;
    for (const s of samples) {
      const daysAgo = Math.floor(Math.random() * 20) + 1;
      const postedAt = new Date(Date.now() - daysAgo * 86400000);
      await jobs.insertOne({ ...s, posted_by: 'system', status: 'active', posted_at: postedAt, updated_at: nowUTC() });
      inserted++;
    }
    return ok(res, { seeded: inserted }, `Seeded ${inserted} jobs`);
  } catch (e) {
    console.error(e);
    return fail(res, 'Server error', 500);
  }
});

module.exports = router;
