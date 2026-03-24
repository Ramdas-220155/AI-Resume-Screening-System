/* hr-interviews.js — HR Interview Management · ResumeIQ v3.0 */

let allInterviews = [];

document.addEventListener("DOMContentLoaded", async () => {
  if (!Auth.requireLogin("hr")) return;
  applyIdentityToDOM();
  await loadInterviews();
});

async function loadInterviews() {
  try {
    const res = await InterviewAPI.hrList();
    if (!res.success) {
      showToast(res.error || "Failed to load", "error");
      return;
    }
    allInterviews = res.interviews || [];
    renderStats();
    renderRescheduleAlerts();
    renderList(allInterviews);
  } catch (e) {
    showToast("Connection error", "error");
  }
}

function renderStats() {
  const total = allInterviews.length;
  const upcoming = allInterviews.filter(
    (iv) => iv.status === "scheduled",
  ).length;
  const reschedule = allInterviews.filter(
    (iv) => iv.reschedule_status === "pending",
  ).length;
  animateCount(document.getElementById("statTotal"), total);
  animateCount(document.getElementById("statUpcoming"), upcoming);
  animateCount(document.getElementById("statReschedule"), reschedule);
}

function renderRescheduleAlerts() {
  const pending = allInterviews.filter(
    (iv) => iv.reschedule_status === "pending",
  );
  const container = document.getElementById("rescheduleAlerts");
  if (!pending.length) {
    container.style.display = "none";
    return;
  }
  container.style.display = "block";
  container.innerHTML = pending
    .map(
      (iv) => `
    <div class="iv-alert-card">
      <div class="iv-alert-info">
        <strong><i class="fa-solid fa-rotate"></i> Reschedule Request</strong>
        <span>${escHtml(iv.candidate_name)} — ${escHtml(iv.job_title)} · Requested: ${iv.reschedule_date} at ${iv.reschedule_time}</span>
      </div>
      <div class="iv-alert-actions">
        <button class="btn btn-outline btn-sm" onclick="openReview('${iv.id}')"><i class="fa-solid fa-eye"></i> Review</button>
      </div>
    </div>`,
    )
    .join("");
}

function filterInterviews() {
  const val = document.getElementById("ivFilter").value;
  const filtered =
    val === "all"
      ? allInterviews
      : allInterviews.filter((iv) => iv.status === val);
  renderList(filtered);
}

function renderList(list) {
  const container = document.getElementById("ivList");
  if (!list.length) {
    container.innerHTML = `<div class="iv-empty"><i class="fa-solid fa-calendar-plus"></i><p>No interviews scheduled yet.<br>Click "Schedule Interview" to get started.</p></div>`;
    return;
  }
  const modeIcon = {
    online: "fa-video",
    phone: "fa-phone",
    offline: "fa-building",
  };
  const modeLabel = { online: "Online", phone: "Phone", offline: "In-Person" };

  container.innerHTML = list
    .map((iv) => {
      const statusCls =
        iv.status === "cancelled" ? "badge-cancelled" : "badge-scheduled";
      const rBanner =
        iv.reschedule_status === "pending"
          ? `<div class="iv-reschedule-banner"><i class="fa-solid fa-rotate"></i> Reschedule requested — ${iv.reschedule_date} at ${iv.reschedule_time} — <a href="#" onclick="openReview('${iv.id}');return false" style="color:#fbbf24;text-decoration:underline">Review Request</a></div>`
          : "";

      return `<div class="iv-card">
      <div class="iv-card-top">
        <div class="iv-card-left">
          <div class="iv-card-icon">🎤</div>
          <div>
            <div class="iv-card-company">${escHtml(iv.company)}</div>
            <div class="iv-card-title">${escHtml(iv.job_title)}</div>
            <div class="iv-card-candidate"><i class="fa-solid fa-user" style="font-size:10px;margin-right:4px"></i>${escHtml(iv.candidate_name)} · ${escHtml(iv.candidate_email)}</div>
          </div>
        </div>
        <div class="iv-card-right">
          <span class="badge ${statusCls}">${capitalize(iv.status)}</span>
          ${iv.status !== "cancelled" ? `<button class="btn btn-danger btn-xs" onclick="cancelInterview('${iv.id}')"><i class="fa-solid fa-ban"></i></button>` : ""}
        </div>
      </div>
      <div class="iv-card-details">
        <div class="iv-detail"><i class="fa-solid fa-calendar"></i>${iv.date}</div>
        <div class="iv-detail"><i class="fa-solid fa-clock"></i>${iv.time}</div>
        <div class="iv-detail"><i class="fa-solid ${modeIcon[iv.mode] || "fa-video"}"></i>${modeLabel[iv.mode] || iv.mode}</div>
        ${iv.meeting_link ? `<div class="iv-detail"><i class="fa-solid fa-link"></i><a href="${iv.meeting_link}" target="_blank">Meeting Link</a></div>` : ""}
        ${iv.location ? `<div class="iv-detail"><i class="fa-solid fa-location-dot"></i>${escHtml(iv.location)}</div>` : ""}
      </div>
      ${rBanner}
    </div>`;
    })
    .join("");
}

/* ── Schedule Interview Modal ────────────────────────── */
function openScheduleModal() {
  document.getElementById("scheduleModal").classList.add("open");
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  document.getElementById("sch-date").min = tomorrow
    .toISOString()
    .split("T")[0];
}

function toggleModeFields() {
  const mode = document.getElementById("sch-mode").value;
  document.getElementById("sch-linkField").style.display =
    mode === "offline" ? "none" : "block";
  document.getElementById("sch-locationField").style.display =
    mode === "offline" ? "block" : "none";
}

async function lookupApplication() {
  const appId = document.getElementById("sch-appId").value.trim();
  const info = document.getElementById("sch-appInfo");
  if (appId.length < 20) {
    info.textContent = "";
    return;
  }
  info.textContent = "Looking up…";
  try {
    // fetch application details from applications API
    const res = await apiFetch(
      `applications/for_job?job_id=dummy&app_id=${appId}`,
    );
    // Simpler: just show the ID is set and let HR fill manually
    info.innerHTML = `<span style="color:var(--green)"><i class="fa-solid fa-check"></i> Application ID set. Fill candidate details below.</span>`;
  } catch {
    info.textContent = "";
  }
}

async function scheduleInterview() {
  const appId = document.getElementById("sch-appId").value.trim();
  const userId = document.getElementById("sch-userId").value.trim();
  const date = document.getElementById("sch-date").value;
  const time = document.getElementById("sch-time").value;
  const mode = document.getElementById("sch-mode").value;

  if (!appId) {
    showToast("Application ID is required", "error");
    return;
  }
  if (!date) {
    showToast("Date is required", "error");
    return;
  }
  if (!time) {
    showToast("Time is required", "error");
    return;
  }

  const payload = {
    application_id: appId,
    user_id: document.getElementById("sch-userId").value.trim() || "unknown",
    job_id: document.getElementById("sch-jobId").value.trim(),
    job_title: document.getElementById("sch-jobTitle").value.trim(),
    company: Auth.plan ? "" : "",
    candidate_name: document.getElementById("sch-candidateName").value.trim(),
    candidate_email: document.getElementById("sch-candidateEmail").value.trim(),
    date,
    time,
    mode,
    meeting_link: document.getElementById("sch-link").value.trim(),
    location: document.getElementById("sch-location").value.trim(),
    notes: document.getElementById("sch-notes").value.trim(),
  };

  const res = await InterviewAPI.schedule(payload);
  if (res.success) {
    showToast("Interview scheduled ✓", "success");
    document.getElementById("scheduleModal").classList.remove("open");
    await loadInterviews();
  } else {
    showToast(res.error || "Failed to schedule", "error");
  }
}

async function cancelInterview(id) {
  if (!confirm("Cancel this interview?")) return;
  const res = await InterviewAPI.cancel(id);
  if (res.success) {
    showToast("Interview cancelled", "info");
    await loadInterviews();
  } else showToast(res.error || "Failed", "error");
}

/* ── Reschedule Review ───────────────────────────────── */
function openReview(id) {
  const iv = allInterviews.find((i) => i.id === id);
  if (!iv) return;
  document.getElementById("reviewIvId").value = id;
  document.getElementById("reviewContent").innerHTML = `
    <div class="rv-row"><span class="rv-label">Candidate</span><span class="rv-val">${escHtml(iv.candidate_name)}</span></div>
    <div class="rv-row"><span class="rv-label">Job</span><span class="rv-val">${escHtml(iv.job_title)}</span></div>
    <div class="rv-row"><span class="rv-label">Current Date</span><span class="rv-val">${iv.date} at ${iv.time}</span></div>
    <div class="rv-row"><span class="rv-label">Requested Date</span><span class="rv-val" style="color:#fbbf24">${iv.reschedule_date} at ${iv.reschedule_time}</span></div>
    <div style="margin-top:10px"><span class="rv-label">Reason</span><div class="rv-val" style="margin-top:4px;color:var(--clr-text)">${escHtml(iv.reschedule_reason)}</div></div>`;
  document.getElementById("rescheduleReviewModal").classList.add("open");
}

async function handleReschedule(action) {
  const id = document.getElementById("reviewIvId").value;
  const res = await InterviewAPI.approveReschedule({
    interview_id: id,
    action,
  });
  if (res.success) {
    showToast(
      action === "approve" ? "Reschedule approved ✓" : "Request rejected",
      action === "approve" ? "success" : "info",
    );
    document.getElementById("rescheduleReviewModal").classList.remove("open");
    await loadInterviews();
  } else {
    showToast(res.error || "Failed", "error");
  }
}
