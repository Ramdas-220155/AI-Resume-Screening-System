/* jobs.js — Browse Jobs Page with Apply Modal · ResumeIQ */
document.addEventListener("DOMContentLoaded", async () => {
  if (!Auth.requireLogin("user")) return;
  applyIdentityToDOM();

  const grid = document.getElementById("jobsGrid");
  const searchInput = document.getElementById("jobSearch");
  const typeFilter = document.getElementById("typeFilter");
  const locFilter = document.getElementById("locFilter");
  const levelFilter = document.getElementById("levelFilter");
  const resultCount = document.getElementById("resultCount");

  let allJobs = [];

  const typeClass = {
    "full-time": "jt-full",
    remote: "jt-remote",
    internship: "jt-intern",
    "part-time": "jt-part",
    contract: "jt-contract",
  };
  const typeLabel = {
    "full-time": "Full-time",
    remote: "Remote",
    internship: "Internship",
    "part-time": "Part-time",
    contract: "Contract",
  };

  function stripEmojis(str) {
    return (str || "").replace(
      /([\u2700-\u27BF]|[\uE000-\uF8FF]|[\uD83C-\uDBFF\uDC00-\uDFFF]|\u24C2|\uD83D[\uDC00-\uDE4F]|[\u2600-\u26FF])/g,
      "",
    );
  }

  /* ── BUILD JOB CARD ────────────────────────────────── */
  function buildCard(job) {
    const t = escHtml(stripEmojis(job.title));
    const co = escHtml(stripEmojis(job.company));
    const skills = (job.skills || [])
      .map((s) => `<span class="skill-tag">${escHtml(stripEmojis(s))}</span>`)
      .join("");
    const applyBtn = job.applied
      ? `<button class="btn btn-sm apply-btn applied" disabled><i class="fa-solid fa-check"></i> Applied</button>`
      : `<button class="btn btn-sm btn-primary apply-btn" data-id="${job.id}" data-title="${t}" data-company="${co}"><i class="fa-solid fa-paper-plane"></i> Apply</button>`;
    return `
    <div class="card job-card" data-id="${job.id}" data-type="${job.type}" data-loc="${stripEmojis(job.loc)}" data-level="${stripEmojis(job.level)}">
      <div class="jc-header">
        <div class="jc-title-wrap"><div class="jc-title">${t}</div><div class="jc-company">${co}</div></div>
        <span class="jc-type ${typeClass[job.type] || "jt-full"}">${typeLabel[job.type] || stripEmojis(job.type)}</span>
      </div>
      <div class="jc-meta">
        <span class="jc-meta-item"><i class="fa-solid fa-location-dot"></i>${stripEmojis(job.loc)}</span>
        <span class="jc-meta-item"><i class="fa-solid fa-layer-group"></i>${stripEmojis(job.level)}</span>
      </div>
      <div class="jc-skills">${skills}</div>
      ${job.salary ? `<div class="jc-salary">${stripEmojis(job.salary)}</div>` : ""}
      <div class="score-wrap">
        <div class="score-track"><div class="score-fill" data-score="${job.score}" style="width:0%"></div></div>
        <span class="score-pct">${job.score}%</span>
        <span style="font-size:11px;color:var(--clr-muted)">match</span>
      </div>
      <div class="jc-footer">
        <span class="jc-posted"><i class="fa-regular fa-clock"></i>${stripEmojis(job.posted_at)}</span>
        ${applyBtn}
      </div>
    </div>`;
  }

  function renderCards(jobs) {
    if (!grid) return;
    if (!jobs.length) {
      grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:60px;color:var(--clr-muted);"><i class="fa-solid fa-magnifying-glass" style="font-size:32px;display:block;margin-bottom:12px;"></i><div style="font-weight:700;color:var(--clr-head);">No jobs found</div><div style="font-size:13px;margin-top:5px;">Try adjusting your filters</div></div>`;
      if (resultCount) resultCount.textContent = "0 jobs";
      return;
    }
    grid.innerHTML = jobs.map(buildCard).join("");
    if (resultCount)
      resultCount.textContent = `${jobs.length} job${jobs.length !== 1 ? "s" : ""}`;
    animateScoreBars();
    bindApplyBtns();
  }

  function filterJobs() {
    const q = stripEmojis((searchInput?.value || "").toLowerCase());
    const type = typeFilter?.value || "all";
    const loc = stripEmojis(locFilter?.value || "all");
    const level = stripEmojis(levelFilter?.value || "all");
    renderCards(
      allJobs.filter((j) => {
        const mq =
          !q ||
          [j.title, j.company, ...(j.skills || [])].some((v) =>
            stripEmojis(v).toLowerCase().includes(q),
          );
        return (
          mq &&
          (type === "all" || j.type === type) &&
          (loc === "all" || j.loc === loc) &&
          (level === "all" || j.level === level)
        );
      }),
    );
  }

  /* ═══════════════════════════════════════════════════
     APPLY MODAL — injected into body once
  ═══════════════════════════════════════════════════ */
  document.body.insertAdjacentHTML(
    "beforeend",
    `
  <div id="applyModal" style="display:none;position:fixed;inset:0;z-index:900;background:rgba(0,0,0,0.65);backdrop-filter:blur(6px);align-items:center;justify-content:center;padding:20px;">
    <div style="background:var(--bg2);border:1px solid var(--gb);border-radius:16px;width:100%;max-width:490px;overflow:hidden;box-shadow:0 24px 60px rgba(0,0,0,0.65);animation:fadeUp 0.28s ease both;">

      <!-- Header -->
      <div style="display:flex;align-items:center;justify-content:space-between;padding:18px 24px;border-bottom:1px solid var(--gb);">
        <div>
          <div id="modalJobTitle" style="font-size:16px;font-weight:800;color:var(--clr-head);">Apply for Job</div>
          <div id="modalJobCompany" style="font-size:13px;color:var(--clr-muted);margin-top:2px;"></div>
        </div>
        <button id="applyModalClose" style="width:32px;height:32px;border-radius:8px;background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.22);color:#f87171;font-size:14px;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>

      <!-- Body -->
      <div style="padding:24px;">

        <!-- Error -->
        <div id="applyModalError" style="display:none;padding:10px 14px;border-radius:8px;margin-bottom:16px;background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.22);color:#f87171;font-size:13px;font-weight:600;align-items:center;gap:8px;">
          <i class="fa-solid fa-circle-exclamation" style="flex-shrink:0;"></i>
          <span id="applyModalErrorText"></span>
        </div>

        <!-- Name -->
        <div style="margin-bottom:16px;">
          <label style="display:block;font-size:11px;font-weight:700;color:var(--clr-muted);text-transform:uppercase;letter-spacing:0.6px;margin-bottom:7px;">Full Name <span style="color:var(--red);">*</span></label>
          <div style="position:relative;">
            <i class="fa-solid fa-user" style="position:absolute;left:13px;top:50%;transform:translateY(-50%);color:var(--clr-muted);font-size:13px;pointer-events:none;"></i>
            <input id="applyName" type="text" placeholder="Your full name"
              style="width:100%;background:var(--bg3);border:1px solid var(--gb);border-radius:9px;padding:11px 14px 11px 40px;color:var(--clr-head);font-family:var(--ff,'Plus Jakarta Sans',sans-serif);font-size:14px;outline:none;box-sizing:border-box;transition:border-color .25s,box-shadow .25s;"
              onfocus="this.style.borderColor='var(--p1)';this.style.boxShadow='0 0 0 3px rgba(13,148,136,0.14)'"
              onblur="this.style.borderColor='';this.style.boxShadow=''"/>
          </div>
        </div>

        <!-- Email -->
        <div style="margin-bottom:16px;">
          <label style="display:block;font-size:11px;font-weight:700;color:var(--clr-muted);text-transform:uppercase;letter-spacing:0.6px;margin-bottom:7px;">Email Address <span style="color:var(--red);">*</span></label>
          <div style="position:relative;">
            <i class="fa-solid fa-envelope" style="position:absolute;left:13px;top:50%;transform:translateY(-50%);color:var(--clr-muted);font-size:13px;pointer-events:none;"></i>
            <input id="applyEmail" type="email" placeholder="you@email.com"
              style="width:100%;background:var(--bg3);border:1px solid var(--gb);border-radius:9px;padding:11px 14px 11px 40px;color:var(--clr-head);font-family:var(--ff,'Plus Jakarta Sans',sans-serif);font-size:14px;outline:none;box-sizing:border-box;transition:border-color .25s,box-shadow .25s;"
              onfocus="this.style.borderColor='var(--p1)';this.style.boxShadow='0 0 0 3px rgba(13,148,136,0.14)'"
              onblur="this.style.borderColor='';this.style.boxShadow=''"/>
          </div>
        </div>

        <!-- Resume Upload -->
        <div>
          <label style="display:block;font-size:11px;font-weight:700;color:var(--clr-muted);text-transform:uppercase;letter-spacing:0.6px;margin-bottom:7px;">
            Resume <span style="color:var(--red);">*</span>
            <span style="color:var(--clr-muted);font-weight:400;text-transform:none;margin-left:4px;">(PDF, DOC, DOCX · max 5 MB)</span>
          </label>
          <div id="applyFileZone" style="border:2px dashed var(--gb);border-radius:10px;padding:22px 16px;text-align:center;cursor:pointer;transition:all .25s ease;">
            <i class="fa-solid fa-cloud-arrow-up" style="font-size:26px;color:var(--p1);display:block;margin-bottom:8px;"></i>
            <div style="font-size:14px;color:var(--clr-text);font-weight:600;">Drag &amp; drop or <strong style="color:var(--clr-accent);">click to browse</strong></div>
            <div style="font-size:12px;color:var(--clr-muted);margin-top:4px;">PDF, DOC, DOCX · Max 5 MB</div>
          </div>
          <input type="file" id="applyResumeFile" accept=".pdf,.doc,.docx" style="display:none;"/>
          <div id="applyFileInfo" style="display:none;margin-top:10px;padding:10px 14px;background:var(--glass);border:1px solid var(--gb);border-radius:8px;align-items:center;gap:10px;">
            <i class="fa-solid fa-file-pdf" style="color:var(--p1);font-size:18px;flex-shrink:0;"></i>
            <div style="flex:1;min-width:0;">
              <div id="applyFileName" style="font-size:13px;font-weight:700;color:var(--clr-head);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;"></div>
              <div id="applyFileSize" style="font-size:11px;color:var(--clr-muted);margin-top:1px;"></div>
            </div>
            <button id="applyFileRemove" style="background:none;border:none;color:var(--clr-muted);cursor:pointer;font-size:15px;flex-shrink:0;" title="Remove file"><i class="fa-solid fa-xmark"></i></button>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div style="padding:16px 24px;border-top:1px solid var(--gb);display:flex;gap:12px;">
        <button id="applySubmitBtn" style="flex:1;display:flex;align-items:center;justify-content:center;gap:8px;padding:12px;background:var(--grad);color:#fff;border:none;border-radius:9px;font-family:var(--ff,'Plus Jakarta Sans',sans-serif);font-size:14px;font-weight:700;cursor:pointer;transition:all .25s ease;">
          <i class="fa-solid fa-paper-plane"></i> Submit Application
        </button>
        <button id="applyCancelBtn" style="padding:12px 20px;background:transparent;border:1px solid var(--gb);border-radius:9px;color:var(--clr-text);font-family:var(--ff,'Plus Jakarta Sans',sans-serif);font-size:14px;font-weight:600;cursor:pointer;transition:all .25s ease;">
          Cancel
        </button>
      </div>
    </div>
  </div>`,
  );

  /* ── MODAL REFS ─────────────────────────────────────── */
  const modal = document.getElementById("applyModal");
  const nameInput = document.getElementById("applyName");
  const emailInput = document.getElementById("applyEmail");
  const fileZone = document.getElementById("applyFileZone");
  const fileInput = document.getElementById("applyResumeFile");
  const fileInfo = document.getElementById("applyFileInfo");
  const fileNameEl = document.getElementById("applyFileName");
  const fileSizeEl = document.getElementById("applyFileSize");
  const fileRemove = document.getElementById("applyFileRemove");
  const errorBox = document.getElementById("applyModalError");
  const errorText = document.getElementById("applyModalErrorText");
  const submitBtn = document.getElementById("applySubmitBtn");

  let currentJobId = null;
  let selectedFile = null;

  /* ── OPEN / CLOSE ───────────────────────────────────── */
  function openModal(jobId, title, company) {
    currentJobId = jobId;
    selectedFile = null;
    nameInput.value = Auth.userName || "";
    emailInput.value = localStorage.getItem("riq_email") || "";
    document.getElementById("modalJobTitle").textContent = title;
    document.getElementById("modalJobCompany").textContent = company;
    fileInput.value = "";
    fileInfo.style.display = "none";
    fileZone.style.display = "block";
    errorBox.style.display = "none";
    submitBtn.innerHTML =
      '<i class="fa-solid fa-paper-plane"></i> Submit Application';
    submitBtn.disabled = false;
    modal.style.display = "flex";
    document.body.style.overflow = "hidden";
    setTimeout(() => nameInput.focus(), 120);
  }
  function closeModal() {
    modal.style.display = "none";
    document.body.style.overflow = "";
    currentJobId = null;
    selectedFile = null;
  }
  function showErr(msg) {
    errorText.textContent = msg;
    errorBox.style.display = "flex";
  }
  function hideErr() {
    errorBox.style.display = "none";
  }

  function fmtBytes(b) {
    if (b < 1024) return b + "B";
    if (b < 1048576) return (b / 1024).toFixed(1) + "KB";
    return (b / 1048576).toFixed(2) + "MB";
  }

  function pickFile(file) {
    if (!file) return;
    const ext = file.name.split(".").pop().toLowerCase();
    if (!["pdf", "doc", "docx"].includes(ext)) {
      showErr("Only PDF, DOC, DOCX files are allowed.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showErr("File is too large — maximum size is 5 MB.");
      return;
    }
    hideErr();
    selectedFile = file;
    fileNameEl.textContent = file.name;
    fileSizeEl.textContent = fmtBytes(file.size);
    fileZone.style.display = "none";
    fileInfo.style.display = "flex";
  }

  /* File zone events */
  fileZone.addEventListener("click", () => fileInput.click());
  fileInput.addEventListener("change", () => pickFile(fileInput.files[0]));
  fileZone.addEventListener("dragover", (e) => {
    e.preventDefault();
    fileZone.style.borderColor = "var(--p1)";
    fileZone.style.background = "var(--glass)";
  });
  fileZone.addEventListener("dragleave", () => {
    fileZone.style.borderColor = "";
    fileZone.style.background = "";
  });
  fileZone.addEventListener("drop", (e) => {
    e.preventDefault();
    fileZone.style.borderColor = "";
    fileZone.style.background = "";
    pickFile(e.dataTransfer.files[0]);
  });
  fileRemove.addEventListener("click", () => {
    selectedFile = null;
    fileInput.value = "";
    fileInfo.style.display = "none";
    fileZone.style.display = "block";
  });

  /* Close events */
  document
    .getElementById("applyModalClose")
    .addEventListener("click", closeModal);
  document
    .getElementById("applyCancelBtn")
    .addEventListener("click", closeModal);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.style.display === "flex") closeModal();
  });

  /* ── SUBMIT ─────────────────────────────────────────── */
  submitBtn.addEventListener("click", async () => {
    hideErr();
    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    if (!name) {
      showErr("Please enter your full name.");
      nameInput.focus();
      return;
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showErr("Please enter a valid email address.");
      emailInput.focus();
      return;
    }
    if (!selectedFile) {
      showErr("Please upload your resume.");
      return;
    }

    submitBtn.innerHTML =
      '<i class="fa-solid fa-spinner fa-spin"></i> Uploading resume…';
    submitBtn.disabled = true;

    /* Step 1 — upload resume */
    const up = await ProfileAPI.uploadResume(selectedFile);
    if (!up.success) {
      showErr(up.error || "Resume upload failed. Please try again.");
      submitBtn.innerHTML =
        '<i class="fa-solid fa-paper-plane"></i> Submit Application';
      submitBtn.disabled = false;
      return;
    }

    /* Step 2 — submit application */
    submitBtn.innerHTML =
      '<i class="fa-solid fa-spinner fa-spin"></i> Submitting…';
    localStorage.setItem("riq_email", email);

    const res = await JobsAPI.apply(currentJobId);
    if (res.success) {
      // ✅ Save these BEFORE closeModal() clears currentJobId
      const appliedJobId = currentJobId;
      const title = document.getElementById("modalJobTitle").textContent;

      closeModal();
      showToast(`Applied to "${title}" successfully! ✓`, "success");

      /* Update card button using saved appliedJobId */
      const card = document.querySelector(
        `.job-card[data-id="${appliedJobId}"]`,
      );
      if (card) {
        const btn = card.querySelector(".apply-btn");
        if (btn) {
          btn.classList.add("applied");
          btn.innerHTML = '<i class="fa-solid fa-check"></i> Applied';
          btn.disabled = true;
          btn.style.background = "linear-gradient(135deg,#10b981,#059669)";
        }
      }
      const job = allJobs.find((j) => j.id === appliedJobId);
      if (job) job.applied = true;
    } else {
      submitBtn.innerHTML =
        '<i class="fa-solid fa-paper-plane"></i> Submit Application';
      submitBtn.disabled = false;
      showErr(res.error || "Application failed. Please try again.");
    }
  });

  /* ── BIND APPLY BUTTONS ─────────────────────────────── */
  function bindApplyBtns() {
    document.querySelectorAll(".apply-btn:not(.applied)").forEach((btn) => {
      btn.addEventListener("click", function () {
        openModal(this.dataset.id, this.dataset.title, this.dataset.company);
      });
    });
  }

  /* ── LOAD JOBS ──────────────────────────────────────── */
  if (grid)
    grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:60px;color:var(--clr-muted);"><i class="fa-solid fa-spinner fa-spin" style="font-size:28px;"></i></div>`;
  const res = await JobsAPI.list();
  if (res.success) {
    allJobs = res.jobs || [];
    renderCards(allJobs);
  } else {
    showToast(res.error || "Failed to load jobs", "error");
    if (grid)
      grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:60px;color:var(--clr-muted);">Failed to load jobs</div>`;
  }

  /* ── FILTER EVENTS ──────────────────────────────────── */
  let dt;
  searchInput?.addEventListener("input", () => {
    clearTimeout(dt);
    dt = setTimeout(filterJobs, 280);
  });
  typeFilter?.addEventListener("change", filterJobs);
  locFilter?.addEventListener("change", filterJobs);
  levelFilter?.addEventListener("change", filterJobs);
  document
    .getElementById("notifBtn")
    ?.addEventListener("click", () =>
      showToast("No new notifications", "info"),
    );
  document
    .querySelector(".chatbot-bubble")
    ?.addEventListener("click", () =>
      showToast("AI assistant coming soon ", "info"),
    );

  /* ── Auto Refresh (Real-time feel) ── */
  setInterval(async () => {
    const res = await JobsAPI.list();
    if (res.success) {
      allJobs = res.jobs || [];
      filterJobs(); // Re-render with current filters
    }
  }, 60000); 
});
