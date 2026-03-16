/* hr-jobs.js — HR Manage Jobs */
document.addEventListener("DOMContentLoaded", async () => {
  if (!Auth.requireLogin("hr")) return;
  applyIdentityToDOM();
  const search = document.getElementById("jobSearch");
  const statusF = document.getElementById("statusFilter");
  const countEl = document.getElementById("jobCount");
  const tbody = document.querySelector("#hrJobsTable tbody");
  let allJobs = [];

  async function loadJobs() {
    const res = await JobsAPI.myJobs();
    if (!res.success) {
      showToast(res.error || "Failed to load jobs", "error");
      return;
    }
    allJobs = res.jobs || [];
    renderTable(allJobs);
  }

  function renderTable(jobs) {
    if (!tbody) return;
    if (!jobs.length) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:40px;color:var(--clr-muted);">No job listings yet. <a href="post-job.html" style="color:var(--clr-accent)">Post your first job →</a></td></tr>`;
      if (countEl) countEl.textContent = "0 jobs";
      return;
    }
    tbody.innerHTML = jobs
      .map(
        (j) => `
      <tr>
        <td><div style="font-family:var(--ff-head);font-size:14px;font-weight:700;color:var(--clr-head);">${j.logo_emoji || "🏢"} ${escHtml(j.title)}</div><div style="font-size:12px;color:var(--clr-muted);">${escHtml(j.company || "")}</div></td>
        <td><span class="jc-type jt-full" style="font-size:11px;">${j.type || ""}</span></td>
        <td style="color:var(--clr-muted);">${j.loc || ""}</td>
        <td style="color:var(--clr-muted);">${capitalize(j.level || "")}</td>
        <td><span style="font-family:var(--ff-head);font-weight:700;color:var(--clr-accent);">${j.app_count || 0}</span></td>
        <td><span class="badge ${j.status === "active" ? "badge-shortlisted" : "badge-rejected"}">${j.status || "active"}</span></td>
        <td style="color:var(--clr-muted);font-size:13px;">${j.posted_at || ""}</td>
        <td>
          <div style="display:flex;gap:6px;">
            <a href="candidates.html?job=${j.id}" class="btn btn-xs btn-outline"><i class="fa-solid fa-users"></i></a>
            <button class="btn btn-xs btn-danger close-job-btn" data-id="${j.id}" ${j.status !== "active" ? "disabled" : ""} title="Close job"><i class="fa-solid fa-ban"></i></button>
          </div>
        </td>
      </tr>`,
      )
      .join("");
    if (countEl)
      countEl.textContent = `${jobs.length} job${jobs.length !== 1 ? "s" : ""}`;

    document.querySelectorAll(".close-job-btn").forEach((btn) => {
      btn.addEventListener("click", async function () {
        if (!confirm("Close this job listing?")) return;
        const res = await JobsAPI.close(this.dataset.id);
        if (res.success) {
          showToast("Job closed", "info");
          await loadJobs();
        } else showToast(res.error || "Failed", "error");
      });
    });
  }

  function filterJobs() {
    const q = (search?.value || "").toLowerCase();
    const s = statusF?.value || "all";
    renderTable(
      allJobs.filter(
        (j) =>
          (!q || (j.title || "").toLowerCase().includes(q)) &&
          (s === "all" || j.status === s),
      ),
    );
  }

  await loadJobs();
  search?.addEventListener("input", filterJobs);
  statusF?.addEventListener("change", filterJobs);
});
