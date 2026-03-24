// routes/interviews.js — Interview Scheduling & Rescheduling · ResumeIQ v3.0
//
// HR endpoints:
//   POST /api/interviews/schedule          → HR schedules interview
//   GET  /api/interviews/hr-list           → HR lists all interviews
//   POST /api/interviews/approve-reschedule→ HR approves/rejects reschedule
//   POST /api/interviews/cancel            → HR cancels interview
//
// User endpoints:
//   GET  /api/interviews/my                → user's interviews
//   POST /api/interviews/request-reschedule→ user requests reschedule

const express = require("express");
const router = express.Router();
const { getCol, toObjId, nowUTC, msToDate } = require("../config/database");
const { ok, fail, requireAuth, requireHR } = require("../middleware/helpers");

function fmtInterview(iv) {
  return {
    id: iv._id.toString(),
    application_id: iv.application_id || "",
    job_id: iv.job_id || "",
    user_id: iv.user_id || "",
    hr_id: iv.hr_id || "",
    job_title: iv.job_title || "",
    company: iv.company || "",
    candidate_name: iv.candidate_name || "",
    candidate_email: iv.candidate_email || "",
    date: iv.date || "",
    time: iv.time || "",
    mode: iv.mode || "online",
    meeting_link: iv.meeting_link || "",
    location: iv.location || "",
    notes: iv.notes || "",
    status: iv.status || "scheduled",
    reschedule_status: iv.reschedule_status || null,
    reschedule_reason: iv.reschedule_reason || "",
    reschedule_date: iv.reschedule_date || "",
    reschedule_time: iv.reschedule_time || "",
    created_at: msToDate(iv.created_at),
    updated_at: msToDate(iv.updated_at),
  };
}

/* ─────────────────── HR ROUTES ─────────────────────── */

/* HR: Schedule Interview */
router.post("/schedule", async (req, res) => {
  try {
    const hr = await requireHR(req, res);
    if (!hr) return;

    const {
      application_id = "",
      user_id = "",
      job_id = "",
      job_title = "",
      company = "",
      candidate_name = "",
      candidate_email = "",
      date = "",
      time = "",
      mode = "online",
      meeting_link = "",
      location = "",
      notes = "",
    } = req.body;

    if (!application_id) return fail(res, "application_id is required");
    if (!user_id) return fail(res, "user_id is required");
    if (!date) return fail(res, "Interview date is required");
    if (!time) return fail(res, "Interview time is required");
    if (!["online", "offline", "phone"].includes(mode))
      return fail(res, "Invalid mode");

    const interviews = await getCol("interviews");

    // Check if interview already exists for this application
    const existing = await interviews.findOne({
      application_id,
      status: { $ne: "cancelled" },
    });
    if (existing) {
      // Update existing instead
      await interviews.updateOne(
        { _id: existing._id },
        {
          $set: {
            date,
            time,
            mode,
            meeting_link,
            location,
            notes,
            status: "scheduled",
            updated_at: nowUTC(),
          },
        },
      );
      return ok(
        res,
        { interview_id: existing._id.toString() },
        "Interview updated successfully",
      );
    }

    const result = await interviews.insertOne({
      application_id,
      user_id,
      job_id: job_id || "",
      hr_id: hr._id.toString(),
      job_title,
      company,
      candidate_name,
      candidate_email,
      date,
      time,
      mode,
      meeting_link: meeting_link || "",
      location: location || "",
      notes: notes || "",
      status: "scheduled",
      reschedule_status: null,
      reschedule_reason: "",
      reschedule_date: "",
      reschedule_time: "",
      created_at: nowUTC(),
      updated_at: nowUTC(),
    });

    // Also update the application status to 'interview'
    try {
      const apps = await getCol("applications");
      await apps.updateOne(
        { _id: toObjId(application_id) },
        { $set: { status: "interview", updated_at: nowUTC() } },
      );
    } catch {}

    return ok(
      res,
      { interview_id: result.insertedId.toString() },
      "Interview scheduled successfully",
    );
  } catch (e) {
    console.error(e);
    return fail(res, "Server error", 500);
  }
});

/* HR: List all interviews */
router.get("/hr-list", async (req, res) => {
  try {
    const hr = await requireHR(req, res);
    if (!hr) return;
    const hrid = hr._id.toString();
    const { status = "" } = req.query;

    const filter = { hr_id: hrid };
    if (status && status !== "all") filter.status = status;

    const interviews = await getCol("interviews");
    const list = await interviews
      .find(filter)
      .sort({ date: 1, time: 1 })
      .toArray();
    return ok(res, { interviews: list.map(fmtInterview), total: list.length });
  } catch (e) {
    console.error(e);
    return fail(res, "Server error", 500);
  }
});

/* HR: Approve or Reject Reschedule Request */
router.post("/approve-reschedule", async (req, res) => {
  try {
    const hr = await requireHR(req, res);
    if (!hr) return;
    const { interview_id = "", action = "", hr_notes = "" } = req.body;
    if (!interview_id) return fail(res, "interview_id is required");
    if (!["approve", "reject"].includes(action))
      return fail(res, "action must be approve or reject");

    const interviews = await getCol("interviews");
    let iv;
    try {
      iv = await interviews.findOne({ _id: toObjId(interview_id) });
    } catch {
      return fail(res, "Invalid interview ID");
    }
    if (!iv) return fail(res, "Interview not found", 404);
    if (iv.hr_id !== hr._id.toString()) return fail(res, "Forbidden", 403);
    if (iv.reschedule_status !== "pending")
      return fail(res, "No pending reschedule request");

    const update =
      action === "approve"
        ? {
            reschedule_status: "approved",
            date: iv.reschedule_date,
            time: iv.reschedule_time,
            updated_at: nowUTC(),
          }
        : { reschedule_status: "rejected", updated_at: nowUTC() };

    await interviews.updateOne(
      { _id: toObjId(interview_id) },
      { $set: update },
    );
    return ok(
      res,
      {},
      action === "approve"
        ? "Reschedule approved — interview date updated"
        : "Reschedule request rejected",
    );
  } catch (e) {
    console.error(e);
    return fail(res, "Server error", 500);
  }
});

/* HR: Cancel Interview */
router.post("/cancel", async (req, res) => {
  try {
    const hr = await requireHR(req, res);
    if (!hr) return;
    const { interview_id = "" } = req.body;
    if (!interview_id) return fail(res, "interview_id is required");

    const interviews = await getCol("interviews");
    let r;
    try {
      r = await interviews.updateOne(
        { _id: toObjId(interview_id), hr_id: hr._id.toString() },
        { $set: { status: "cancelled", updated_at: nowUTC() } },
      );
    } catch {
      return fail(res, "Invalid ID");
    }
    if (r.matchedCount === 0)
      return fail(res, "Interview not found or access denied", 404);
    return ok(res, {}, "Interview cancelled");
  } catch (e) {
    console.error(e);
    return fail(res, "Server error", 500);
  }
});

/* ─────────────────── USER ROUTES ────────────────────── */

/* User: My Interviews */
router.get("/my", async (req, res) => {
  try {
    const u = await requireAuth(req, res);
    if (!u) return;
    const uid = u._id.toString();
    const interviews = await getCol("interviews");
    const list = await interviews
      .find({ user_id: uid })
      .sort({ date: 1 })
      .toArray();
    return ok(res, { interviews: list.map(fmtInterview), total: list.length });
  } catch (e) {
    console.error(e);
    return fail(res, "Server error", 500);
  }
});

/* User: Request Reschedule */
router.post("/request-reschedule", async (req, res) => {
  try {
    const u = await requireAuth(req, res);
    if (!u) return;
    const uid = u._id.toString();
    const {
      interview_id = "",
      reason = "",
      preferred_date = "",
      preferred_time = "",
    } = req.body;
    if (!interview_id) return fail(res, "interview_id is required");
    if (!reason.trim())
      return fail(res, "Please provide a reason for rescheduling");
    if (!preferred_date) return fail(res, "Preferred date is required");
    if (!preferred_time) return fail(res, "Preferred time is required");

    const interviews = await getCol("interviews");
    let iv;
    try {
      iv = await interviews.findOne({ _id: toObjId(interview_id) });
    } catch {
      return fail(res, "Invalid interview ID");
    }
    if (!iv) return fail(res, "Interview not found", 404);
    if (iv.user_id !== uid) return fail(res, "Forbidden", 403);
    if (iv.status === "cancelled")
      return fail(res, "This interview has been cancelled");
    if (iv.reschedule_status === "pending")
      return fail(res, "A reschedule request is already pending");

    await interviews.updateOne(
      { _id: toObjId(interview_id) },
      {
        $set: {
          reschedule_status: "pending",
          reschedule_reason: reason.trim(),
          reschedule_date: preferred_date,
          reschedule_time: preferred_time,
          updated_at: nowUTC(),
        },
      },
    );

    return ok(
      res,
      {},
      "Reschedule request submitted. HR will review and respond.",
    );
  } catch (e) {
    console.error(e);
    return fail(res, "Server error", 500);
  }
});

module.exports = router;
