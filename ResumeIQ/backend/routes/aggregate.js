// routes/aggregate.js — Job Aggregation API · ResumeIQ v3.0
const express = require('express');
const router  = express.Router();
const { getCol, nowUTC } = require('../config/database');
const { ok, fail, requireHR }  = require('../middleware/helpers');

/* ── AGGREGATE JOBS (HR ONLY) ──────────────────────────── */
router.post('/jobs', async (req, res) => {
  try {
    const hr = await requireHR(req, res);
    if (!hr) return;

    const jobs = await getCol('jobs');

    // Mocking an external API call to fetch jobs from Google Careers and others
    const externalJobs = [
      { 
        title: 'Software Engineer, Infrastructure, Quantum AI', 
        company: 'Google', 
        logo_emoji: '🔍', 
        type: 'full-time', 
        loc: 'Mountain View, CA', 
        level: 'mid', 
        salary: '$150K–$220K/yr', 
        skills: ['Python', 'Quantum Computing', 'C++', 'AI'],
        description: 'Develop next-generation infrastructure for Quantum AI at Google. Work on large-scale distributed systems and specialized hardware optimization.'
      },
      { 
        title: 'Senior Software Engineer, AI/ML, Google Ads', 
        company: 'Google', 
        logo_emoji: '📈', 
        type: 'full-time', 
        loc: 'New York, NY', 
        level: 'senior', 
        salary: '$180K–$260K/yr', 
        skills: ['TensorFlow', 'Java', 'Machine Learning', 'BigQuery'],
        description: 'Join the Google Ads team to build and deploy advanced ML models that impact global commerce and user experience at scale.'
      },
      { 
        title: 'Software Engineer III, Performance, AI and Infrastructure', 
        company: 'Google', 
        logo_emoji: '⚡', 
        type: 'full-time', 
        loc: 'Bangalore, India', 
        level: 'mid', 
        salary: '₹25L–₹45L/yr', 
        skills: ['Performance Tuning', 'Go', 'Linux', 'Distributed Systems'],
        description: 'Optimize the performance of Google’s AI infrastructure. Profile and enhance latency and throughput for global services.'
      },
      { 
        title: 'Software Engineer, Google Translate, Mobile, Android', 
        company: 'Google', 
        logo_emoji: '🌐', 
        type: 'remote', 
        loc: 'Remote', 
        level: 'mid', 
        salary: '$140K–$210K/yr', 
        skills: ['Android', 'Kotlin', 'Mobile NLP', 'Java'],
        description: 'Build the future of communication in the Google Translate team. Focus on mobile experience and real-time translation features.'
      },
      { 
        title: 'Staff Software Engineer, Supply Chain Intelligence', 
        company: 'Google', 
        logo_emoji: '📦', 
        type: 'full-time', 
        loc: 'Sunnyvale, CA', 
        level: 'senior', 
        salary: '$220K–$320K/yr', 
        skills: ['Supply Chain AI', 'Python', 'Strategy', 'Optimization'],
        description: 'Architect intelligent supply chain systems that power Google’s global hardware operations and logistics.'
      }
    ];

    let inserted = 0;
    for (const job of externalJobs) {
      // Avoid exact duplicates
      const exists = await jobs.findOne({ title: job.title, company: job.company });
      if (!exists) {
        await jobs.insertOne({
          ...job,
          openings: 1,
          deadline: new Date(Date.now() + 60 * 86400000), // 60 days duration
          score: Math.floor(Math.random() * 20) + 80, // Real high-tier jobs get high baseline scores
          status: 'active',
          posted_by: hr._id.toString(), 
          posted_at: nowUTC(),
          updated_at: nowUTC(),
          is_aggregated: true
        });
        inserted++;
      }
    }

    return ok(res, { aggregated: inserted }, `Successfully aggregated ${inserted} jobs`);
  } catch (e) {
    console.error(e);
    return fail(res, 'Server error during aggregation', 500);
  }
});

module.exports = router;
