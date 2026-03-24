/* hr-jobs.js — HR Manage Jobs (Backend Connected) */
document.addEventListener("DOMContentLoaded", async () => {
  if (!Auth.requireLogin("hr")) return;
  applyIdentityToDOM();

  const tableBody = document.querySelector("#hrJobsTable tbody");
  const searchInput = document.getElementById("jobSearch");
  const statusF = document.getElementById("statusFilter");
  const countEl = document.getElementById("jobCount");

  let allJobs = [];

  /* ── Build table row ── */
  function buildRow(job) {
    const statusBadge =
      job.status === "active"
        ? `<span class="badge badge-active">Active</span>`
        : `<span class="badge badge-closed">Closed</span>`;

    const typeLabel =
      {
        "full-time": "Full-time",
        remote: "Remote",
        internship: "Internship",
        "part-time": "Part-time",
        contract: "Contract",
      }[job.type] || job.type;

    return `<tr data-id="${job.id}">
      <td>
        
            <div style="font-weight:700;color:var(--clr-head);font-size:14px;">${escHtml(job.title)}</div>
            <div style="font-size:12px;color:var(--clr-muted);">${escHtml(job.company || "")}</div>
          </div>
        </div>
      </td>
      <td><span class="jc-type jt-${job.type === "full-time" ? "full" : job.type === "remote" ? "remote" : job.type === "internship" ? "intern" : "full"}" style="font-size:11px;">${typeLabel}</span></td>
      <td style="color:var(--clr-muted);">${escHtml(job.loc || "")}</td>
      <td style="color:var(--clr-muted);">${capitalize(job.level || "")}</td>
      <td><span style="font-weight:700;color:var(--clr-accent);">${job.app_count || 0}</span></td>
      <td>${statusBadge}</td>
      <td style="color:var(--clr-muted);font-size:13px;">${job.posted_at || ""}</td>
      <td>
        <div style="display:flex;gap:6px;flex-wrap:wrap;">
          <a href="candidates.html?job=${job.id}" class="btn btn-xs btn-outline" title="View candidates">
            <i class="fa-solid fa-users"></i> Candidates
          </a>
          <button class="btn btn-xs btn-danger close-btn" data-id="${job.id}"
            ${job.status !== "active" ? 'disabled style="opacity:0.5;cursor:not-allowed;"' : ""}
            title="${job.status === "active" ? "Close this job" : "Already closed"}">
            <i class="fa-solid fa-ban"></i> Close
          </button>
        </div>
      </td>
    </tr>`;
  }

  /* ── Render table ── */
  function renderTable(jobs) {
    if (!tableBody) return;

    if (!jobs.length) {
      tableBody.innerHTML = `
        <tr><td colspan="8" style="text-align:center;padding:44px;color:var(--clr-muted);">
          <i class="fa-solid fa-briefcase" style="font-size:28px;display:block;margin-bottom:10px;"></i>
          No job listings found.
          <a href="post-job.html" style="color:var(--clr-accent);margin-left:6px;">Post your first job →</a>
        </td></tr>`;
      if (countEl) countEl.textContent = "0 jobs";
      return;
    }

    tableBody.innerHTML = jobs.map(buildRow).join("");
    if (countEl)
      countEl.textContent = `${jobs.length} job${jobs.length !== 1 ? "s" : ""}`;

    /* Bind close buttons */
    document.querySelectorAll(".close-btn:not([disabled])").forEach((btn) => {
      btn.addEventListener("click", async function () {
        const id = this.dataset.id;
        if (
          !confirm("Close this job? It will stop accepting new applications.")
        )
          return;

        this.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
        this.disabled = true;

        const res = await JobsAPI.close(id);
        if (res.success) {
          showToast("Job closed successfully", "info");
          /* Update local state and re-render */
          const job = allJobs.find((j) => j.id === id);
          if (job) job.status = "closed";
          filterJobs();
        } else {
          this.disabled = false;
          this.innerHTML = '<i class="fa-solid fa-ban"></i> Close';
          showToast(res.error || "Failed to close job", "error");
        }
      });
    });
  }

  /* ── Filter (matches jobs.html: jobSearch + statusFilter only) ── */
  function filterJobs() {
    const q = (searchInput?.value || "").toLowerCase();
    const s = statusF?.value || "all";

    const filtered = allJobs.filter((job) => {
      const matchQ =
        !q ||
        (job.title || "").toLowerCase().includes(q) ||
        (job.company || "").toLowerCase().includes(q) ||
        (job.loc || "").toLowerCase().includes(q);
      const matchS = s === "all" || job.status === s;
      return matchQ && matchS;
    });

    renderTable(filtered);
  }

  /* ── Load from backend ── */
  async function loadJobs() {
    if (tableBody) {
      tableBody.innerHTML = `
        <tr><td colspan="8" style="text-align:center;padding:40px;color:var(--clr-muted);">
          <i class="fa-solid fa-spinner fa-spin" style="font-size:22px;"></i>
        </td></tr>`;
    }

    const res = await JobsAPI.myJobs();

    if (res.success) {
      allJobs = res.jobs || [];
      renderTable(allJobs);
    } else {
      showToast(res.error || "Failed to load jobs", "error");
      if (tableBody) {
        tableBody.innerHTML = `
          <tr><td colspan="8" style="text-align:center;padding:40px;color:var(--clr-muted);">
            ${escHtml(res.error || "Failed to load")} —
            <a href="post-job.html" style="color:var(--clr-accent);">Post a job first →</a>
          </td></tr>`;
      }
    }
  }

  /* ── Event listeners ── */
  searchInput?.addEventListener("input", filterJobs);
  statusF?.addEventListener("change", filterJobs);

  document.getElementById("fetchJobsBtn")?.addEventListener("click", async function() {
    this.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Fetching...';
    this.disabled = true;
    try {
      const res = await JobsAPI.aggregate();
      
      if (res.success) {
        const added = res.aggregated || 0;
        showToast(added > 0 ? `Successfully imported ${added} new jobs!` : "Already up to date with external jobs", "success");
        await loadJobs(); // Reload the table
      } else {
        showToast(res.error || "Failed to fetch jobs", "error");
      }
    } catch (e) {
      showToast("Network error", "error");
    } finally {
      this.innerHTML = '<i class="fa-solid fa-cloud-arrow-down"></i> Fetch External Jobs';
      this.disabled = false;
    }
  });

  /* ── Auto Refresh (Real-time feel) ── */
  setInterval(loadJobs, 30000); 

  /* ── Init ── */
  await loadJobs();

  document
    .getElementById("notifBtn")
    ?.addEventListener("click", () =>
      showToast("No new notifications", "info"),
    );
});
