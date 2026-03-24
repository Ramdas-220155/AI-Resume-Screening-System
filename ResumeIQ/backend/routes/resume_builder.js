// routes/resume_builder.js — Resume Builder API · ResumeIQ v3.0
// POST /api/resume/save       → save/update a resume draft
// GET  /api/resume/get        → get user's resume draft
// POST /api/resume/send-email → send resume via email (nodemailer)
const express = require("express");
const router = express.Router();
const { getCol, toObjId, nowUTC } = require("../config/database");
const { ok, fail, requireAuth } = require("../middleware/helpers");

/* ── SAVE / UPDATE RESUME ─────────────────────────────── */
router.post("/save", async (req, res) => {
  try {
    const u = await requireAuth(req, res);
    if (!u) return;
    const uid = u._id.toString();

    const {
      template = "classic",
      personal = {},
      summary = "",
      education = [],
      experience = [],
      skills = [],
      projects = [],
      certifications = [],
    } = req.body;

    const resumes = await getCol("resumes");
    const existing = await resumes.findOne({ user_id: uid });

    const doc = {
      user_id: uid,
      template,
      personal,
      summary,
      education,
      experience,
      skills,
      projects,
      certifications,
      updated_at: nowUTC(),
    };

    if (existing) {
      await resumes.updateOne({ user_id: uid }, { $set: doc });
    } else {
      doc.created_at = nowUTC();
      await resumes.insertOne(doc);
    }

    return ok(res, {}, "Resume saved successfully");
  } catch (e) {
    console.error(e);
    return fail(res, "Server error", 500);
  }
});

/* ── GET RESUME ───────────────────────────────────────── */
router.get("/get", async (req, res) => {
  try {
    const u = await requireAuth(req, res);
    if (!u) return;
    const uid = u._id.toString();
    const resumes = await getCol("resumes");
    const r = await resumes.findOne({ user_id: uid });
    return ok(res, {
      resume: r
        ? {
            template: r.template || "classic",
            personal: r.personal || {},
            summary: r.summary || "",
            education: r.education || [],
            experience: r.experience || [],
            skills: r.skills || [],
            projects: r.projects || [],
            certifications: r.certifications || [],
          }
        : null,
    });
  } catch (e) {
    console.error(e);
    return fail(res, "Server error", 500);
  }
});

/* ── SEND VIA EMAIL ───────────────────────────────────── */
router.post("/send-email", async (req, res) => {
  try {
    const u = await requireAuth(req, res);
    if (!u) return;
    const {
      to_email = "",
      subject = "My Resume",
      html_content = "",
    } = req.body;
    if (!to_email) return fail(res, "Recipient email is required");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to_email))
      return fail(res, "Invalid email address");

    // Store send record in DB
    const col = await getCol("resume_shares");
    await col.insertOne({
      user_id: u._id.toString(),
      to_email,
      subject,
      sent_at: nowUTC(),
    });

    const nodemailer = require('nodemailer');
    let transporter;
    
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });
    } else {
      console.log("No SMTP .env variables found. Creating ethereal test account...");
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false, 
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
    }

    const info = await transporter.sendMail({
      from: process.env.SMTP_USER ? `"ResumeIQ" <${process.env.SMTP_USER}>` : '"ResumeIQ Test" <test@resumeiq.local>',
      to: to_email,
      subject,
      html: html_content
    });

    if (!process.env.SMTP_USER) {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      console.log("TEST EMAIL SENT! Preview URL: " + previewUrl);
      return ok(res, { to: to_email, preview: previewUrl }, `Test email sent (No SMTP config)! Check server console for link.`);
    }

    return ok(res, { to: to_email }, `Resume sent successfully!`);
  } catch (e) {
    console.error("Email Error:", e);
    return fail(res, e.message || "Server error", 500);
  }
});

module.exports = router;
