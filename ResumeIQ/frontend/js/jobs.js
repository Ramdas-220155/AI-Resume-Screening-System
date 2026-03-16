/* jobs.js — Browse Jobs Page */
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

  // =========================
  // Emoji removal function
  // =========================
  function stripEmojis(str) {
    return (str || "").replace(
      /([\u2700-\u27BF]|[\uE000-\uF8FF]|[\uD83C-\uDBFF\uDC00-\uDFFF]|\u24C2|\uD83D[\uDC00-\uDE4F]|[\u2600-\u26FF])/g,
      "",
    );
  }

  function buildCard(job) {
    const cleanTitle = stripEmojis(job.title);
    const cleanCompany = stripEmojis(job.company);
    const skills = (job.skills || [])
      .map((s) => `<span class="skill-tag">${stripEmojis(s)}</span>`)
      .join("");

    const applyBtn = job.applied
      ? `<button class="btn btn-sm apply-btn applied" disabled><i class="fa-solid fa-check"></i> Applied</button>`
      : `<button class="btn btn-sm btn-primary apply-btn" data-id="${job.id}" data-title="${cleanTitle}"><i class="fa-solid fa-paper-plane"></i> Apply</button>`;

    return `<div class="card job-card" data-id="${job.id}" data-title="${cleanTitle.toLowerCase()}" data-company="${cleanCompany.toLowerCase()}" data-skills="${(job.skills || []).map(stripEmojis).join(",").toLowerCase()}" data-type="${job.type}" data-loc="${stripEmojis(job.loc)}" data-level="${stripEmojis(job.level)}">
      <div class="jc-header">
        <div class="jc-title-wrap">
          <div class="jc-title">${cleanTitle}</div>
          <div class="jc-company">${cleanCompany}</div>
        </div>
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
        <span style="font-size:11px;color:var(--clr-muted);font-family:var(--ff-head);">match</span>
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
      grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:60px 20px;color:var(--clr-muted);">
        <i class="fa-solid fa-magnifying-glass" style="font-size:32px;margin-bottom:12px;display:block;"></i>
        <div style="font-family:var(--ff-head);font-weight:700;font-size:16px;color:var(--clr-head);margin-bottom:6px;">No jobs found</div>
        <div>Try adjusting your search or filters</div>
      </div>`;
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
    const loc = stripEmojis(typeFilter?.value || "all");
    const level = stripEmojis(levelFilter?.value || "all");

    const filtered = allJobs.filter((j) => {
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
    });
    renderCards(filtered);
  }

  function bindApplyBtns() {
    document.querySelectorAll(".apply-btn:not(.applied)").forEach((btn) => {
      btn.addEventListener("click", async function () {
        const id = this.dataset.id;
        const title = stripEmojis(this.dataset.title);
        this.disabled = true;
        this.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
        const res = await JobsAPI.apply(id);
        if (res.success) {
          this.classList.add("applied");
          this.innerHTML = '<i class="fa-solid fa-check"></i> Applied';
          showToast(`Applied to "${title}"`, "success");
          const j = allJobs.find((j) => j.id === id);
          if (j) j.applied = true;
        } else {
          this.disabled = false;
          this.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Apply';
          showToast(res.error || "Could not apply", "error");
        }
      });
    });
  }

  // Skeleton placeholders
  if (grid)
    grid.innerHTML = Array(6)
      .fill(0)
      .map(
        () =>
          `<div class="card job-card skeleton-card" style="padding:22px;">
            <div class="sk-block" style="width:44px;height:44px;border-radius:11px;"></div>
            <div class="sk-block" style="width:70%;height:16px;margin-top:12px;"></div>
            <div class="sk-block" style="width:45%;height:13px;margin-top:6px;"></div>
            <div class="sk-block" style="width:90%;height:38px;margin-top:12px;border-radius:8px;"></div>
          </div>`,
      )
      .join("");

  const res = await JobsAPI.list();
  if (res.success) {
    allJobs = res.jobs || [];
    renderCards(allJobs);
  } else {
    showToast(res.error || "Failed to load jobs", "error");
    if (grid) grid.innerHTML = "";
  }

  let dt;
  const df = () => {
    clearTimeout(dt);
    dt = setTimeout(filterJobs, 280);
  };
  searchInput?.addEventListener("input", df);
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
      showToast("AI assistant launching soon", "info"),
    );
});
