// routes/ai.js — AI Automation & Shortlisting · ResumeIQ v4.0
const express = require('express');
const router  = express.Router();
const { getCol, nowUTC, toObjId } = require('../config/database');
const { ok, fail, requireHR } = require('../middleware/helpers');

/* POST /api/ai/shortlist — Batch process all 'applied' candidates */
router.post('/shortlist', async (req, res) => {
  try {
    const hr = await requireHR(req, res);
    if (!hr) return;

    const apps = await getCol('applications');
    const jobs = await getCol('jobs');
    
    // Find all 'applied' candidates (only for jobs relevant to this HR or system jobs)
    // For simplicity in this demo, we'll process all 'applied' candidates with score >= 85
    const candidates = await apps.find({ status: 'applied', score: { $gte: 85 } }).toArray();
    
    let processed = 0;
    for (const cand of candidates) {
      await apps.updateOne(
        { _id: cand._id },
        { $set: { status: 'shortlisted', updated_at: nowUTC(), ai_auto: true } }
      );
      processed++;
      
      // Emit socket notification if io is available
      const io = req.app.get('io');
      if (io) {
        io.emit('notification', {
          type: 'shortlisted',
          message: `Candidate ${cand.candidate_name} has been auto-shortlisted for ${cand.title}`,
          user_id: cand.user_id
        });
      }
    }

    return ok(res, { processed }, `Successfully auto-shortlisted ${processed} candidates.`);
  } catch (e) {
    console.error(e);
    return fail(res, "AI Shortlisting error", 500);
  }
});

/* GET /api/ai/shortlisted — List all auto-shortlisted candidates */
router.get('/shortlisted', async (req, res) => {
  try {
    const hr = await requireHR(req, res);
    if (!hr) return;
    const apps = await getCol('applications');
    const list = await apps.find({ ai_auto: true }).sort({ updated_at: -1 }).toArray();
    return ok(res, { candidates: list });
  } catch (e) {
    return fail(res, "Server error", 500);
  }
});

module.exports = router;
