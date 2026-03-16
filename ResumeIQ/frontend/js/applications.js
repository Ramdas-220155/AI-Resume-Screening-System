/* applications.js — My Applications */
document.addEventListener("DOMContentLoaded", async () => {
  if (!Auth.requireLogin("user")) return;
  applyIdentityToDOM();
  const searchInput = document.getElementById("appSearch");
  const statusFilter = document.getElementById("statusFilter");
  const tbody = document.querySelector("#appsTable tbody");
  let allApps = [];

  function renderStats(s) {
    animateCount(document.querySelector('[data-stat="total"]'), s.total || 0);
    animateCount(
      document.querySelector('[data-stat="short"]'),
      s.shortlisted || 0,
    );
    animateCount(
      document.querySelector('[data-stat="pending"]'),
      s.pending || 0,
    );
    animateCount(
      document.querySelector('[data-stat="reject"]'),
      s.rejected || 0,
    );
  }
  function badge(status) {
    const m = {
      shortlisted: "badge-shortlisted",
      applied: "badge-applied",
      pending: "badge-pending",
      rejected: "badge-rejected",
      interview: "badge-interview",
      hired: "badge-hired",
    };
    return `<span class="badge ${m[status] || "badge-applied"}">${capitalize(status)}</span>`;
  }
  function renderTable(apps) {
    if (!tbody) return;
    if (!apps.length) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:40px;color:var(--clr-muted);"><i class="fa-solid fa-inbox" style="font-size:28px;display:block;margin-bottom:10px;"></i>No applications found. <a href="jobs.html" style="color:var(--clr-accent)">Browse jobs →</a></td></tr>`;
      return;
    }
    tbody.innerHTML = apps
      .map(
        (a) => `
      <tr data-id="${a.id}">
        <td><div style="display:flex;align-items:center;gap:10px;"><div style="width:32px;height:32px;border-radius:8px;background:var(--glass);border:1px solid var(--gb);display:flex;align-items:center;justify-content:center;font-size:16px;">${a.logo_emoji || "🏢"}</div><div><div style="font-family:var(--ff-head);font-size:14px;font-weight:700;color:var(--clr-head);">${escHtml(a.title)}</div><div style="font-size:12px;color:var(--clr-muted);">${escHtml(a.type || "")}</div></div></div></td>
        <td style="color:var(--clr-head);font-weight:600;">${escHtml(a.company)}</td>
        <td><div class="score-wrap"><div class="score-track"><div class="score-fill" data-score="${a.score}" style="width:0%"></div></div><span class="score-pct">${a.score}%</span></div></td>
        <td>${badge(a.status)}</td>
        <td style="color:var(--clr-muted);font-size:13px;">${a.applied_at}</td>
        <td><div style="display:flex;gap:8px;">
          <button class="btn btn-sm btn-outline view-btn" data-id="${a.id}"><i class="fa-solid fa-eye"></i></button>
          <button class="btn btn-sm btn-danger withdraw-btn" data-id="${a.id}"><i class="fa-solid fa-trash"></i> Withdraw</button>
        </div></td>
      </tr>`,
      )
      .join("");
    animateScoreBars();
    document.querySelectorAll(".withdraw-btn").forEach((btn) => {
      btn.addEventListener("click", async function () {
        if (!confirm("Withdraw this application?")) return;
        const id = this.dataset.id;
        const res = await ApplicationsAPI.withdraw(id);
        if (res.success) {
          allApps = allApps.filter((a) => a.id !== id);
          filterApps();
          const sr = await ApplicationsAPI.stats();
          if (sr.success) renderStats(sr.stats);
          showToast("Application withdrawn", "error");
        } else showToast(res.error || "Failed", "error");
      });
    });
    document.querySelectorAll(".view-btn").forEach((btn) => {
      btn.addEventListener("click", () =>
        showToast("Detail panel coming soon", "info"),
      );
    });
  }
  function filterApps() {
    const q = (searchInput?.value || "").toLowerCase();
    const s = statusFilter?.value || "all";
    renderTable(
      allApps.filter(
        (a) =>
          (!q ||
            a.title.toLowerCase().includes(q) ||
            a.company.toLowerCase().includes(q)) &&
          (s === "all" || a.status === s),
      ),
    );
  }
  const res = await ApplicationsAPI.list();
  if (res.success) {
    allApps = res.applications || [];
    renderStats(res.stats || {});
    renderTable(allApps);
  } else showToast(res.error || "Failed", "error");
  searchInput?.addEventListener("input", filterApps);
  statusFilter?.addEventListener("change", filterApps);
  document
    .getElementById("notifBtn")
    ?.addEventListener("click", () =>
      showToast("No new notifications", "info"),
    );
});
