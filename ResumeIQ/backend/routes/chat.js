// routes/chat.js — AI Chatbot API · ResumeIQ v4.0
const express = require('express');
const router  = express.Router();
const { getCol } = require('../config/database');
const { ok, fail, requireAuth } = require('../middleware/helpers');

router.post('/', async (req, res) => {
  try {
    const u = await requireAuth(req, res);
    if (!u) return;
    const { message = "" } = req.body;
    if (!message.trim()) return fail(res, "Message is empty");

    const msg = message.toLowerCase();
    let response = "I'm your ResumeIQ Assistant. How can I help you today?";
    let action = null;

    // ── Simple NLP / Rule-based Logic ──
    
    if (msg.includes("job") || msg.includes("role") || msg.includes("opening")) {
      const jobs = await getCol('jobs');
      const latest = await jobs.find({ status: 'active' }).sort({ posted_at: -1 }).limit(3).toArray();
      const titles = latest.map(j => `• ${j.title} at ${j.company}`).join("\n");
      response = `We have some exciting new roles! Here are the latest ones:\n${titles}\n\nYou can find more in the Browse Jobs section.`;
      action = "navigate_jobs";
    }
    else if (msg.includes("status") || msg.includes("application") || msg.includes("my app")) {
      const apps = await getCol('applications');
      const myApps = await apps.find({ user_id: u._id.toString() }).sort({ updated_at: -1 }).limit(3).toArray();
      if (myApps.length > 0) {
        const statuses = myApps.map(a => `• ${a.title}: ${a.status.toUpperCase()}`).join("\n");
        response = `Sure, here is the status of your recent applications:\n${statuses}`;
      } else {
        response = "You haven't applied to any jobs yet. Would you like to see some recommendations?";
      }
      action = "navigate_applications";
    }
    else if (msg.includes("interview") || msg.includes("schedule")) {
      const interviews = await getCol('interviews'); // Re-using existing interviews logic if any
      // Simple lookup
      response = "To manage your interviews, please head to the Applications page, where you can accept invites or request reschedules.";
      action = "navigate_applications";
    }
    else if (msg.includes("hi") || msg.includes("hello") || msg.includes("hey")) {
      response = `Hi ${u.name.split(' ')[0]}! I can help you search for jobs, check your application status, or find interview details. What's on your mind?`;
    }
    else if (msg.includes("thank")) {
      response = "You're very welcome! I'm always here to help you land your dream job. Good luck!";
    }
    else {
      response = "I'm still learning, but I can help you with job searches and application status. Try asking 'What are the latest jobs?' or 'Check my application status'.";
    }

    return ok(res, { 
      reply: response,
      action: action,
      sender: "AI"
    });

  } catch (e) {
    console.error(e);
    return fail(res, "Chat error", 500);
  }
});

module.exports = router;
