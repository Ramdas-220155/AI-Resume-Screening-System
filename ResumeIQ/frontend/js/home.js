/* home.js — User Dashboard Home */
document.addEventListener("DOMContentLoaded", async () => {
  if (!Auth.requireLogin("user")) return;
  applyIdentityToDOM();

  try {
    await JobsAPI.seed();
    const res = await DashboardAPI.get();
    if (!res.success) {
      showToast(res.error || "Failed to load dashboard", "error");
      return;
    }
    const { stats, recent_applications, user } = res;

    // Welcome
    const fn = (user?.name || Auth.userName || "there").split(" ")[0];
    const h2 = document.querySelector(".welcome-banner h2");
    if (h2) h2.textContent = `Welcome back, ${fn}!`;
    const wp = document.querySelector(".welcome-banner p");
    if (wp)
      wp.innerHTML = `Your AI match score is <strong style="color:var(--clr-accent)">${stats.ai_score}%</strong>. You have <strong style="color:#34d399">${stats.shortlisted} shortlisted</strong> application${stats.shortlisted !== 1 ? "s" : ""}.`;

    // Stats
    animateCount(
      document.querySelector('[data-stat="total"]'),
      stats.total_apps,
    );
    animateCount(
      document.querySelector('[data-stat="short"]'),
      stats.shortlisted,
    );
    animateCount(
      document.querySelector('[data-stat="jobs"]'),
      stats.jobs_available,
    );
    const aiEl = document.querySelector('[data-stat="ai"]');
    if (aiEl)
      aiEl.innerHTML = `${stats.ai_score}<span style="font-size:16px;color:var(--clr-muted)">%</span>`;

    // Quick action subs
    const qj = document.getElementById("qaJobsSub");
    if (qj) qj.textContent = `${stats.jobs_available} openings`;
    const qa = document.getElementById("qaAppsSub");
    if (qa)
      qa.textContent = `${stats.total_apps} total · ${stats.shortlisted} shortlisted`;

    // Recent table
    const tbody = document.querySelector("#recentTable tbody");
    if (tbody) {
      if (!recent_applications?.length) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:32px;color:var(--clr-muted);"><i class="fa-solid fa-inbox" style="font-size:22px;display:block;margin-bottom:8px;"></i>No applications yet. <a href="jobs.html" style="color:var(--clr-accent)">Browse jobs →</a></td></tr>`;
      } else {
        const bm = {
          shortlisted: "badge-shortlisted",
          applied: "badge-applied",
          rejected: "badge-rejected",
          interview: "badge-interview",
          hired: "badge-hired",
          pending: "badge-pending",
        };
        tbody.innerHTML = recent_applications
          .map(
            (a) => `
          <tr>
            <td><div style="display:flex;align-items:center;gap:10px;"><div style="width:32px;height:32px;border-radius:50%;background:var(--grad);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:white;flex-shrink:0;">${a.company.slice(0, 2).toUpperCase()}</div><div><div style="font-family:var(--ff-head);font-size:14px;font-weight:700;color:var(--clr-head);">${escHtml(a.title)}</div><div style="font-size:12px;color:var(--clr-muted);">${escHtml(a.type || "")}</div></div></div></td>
            <td style="color:var(--clr-head);font-weight:600;">${escHtml(a.company)}</td>
            <td><div class="score-wrap"><div class="score-track"><div class="score-fill" data-score="${a.score}" style="width:0%"></div></div><span class="score-pct">${a.score}%</span></div></td>
            <td><span class="badge ${bm[a.status] || "badge-applied"}">${capitalize(a.status)}</span></td>
            <td style="color:var(--clr-muted);font-size:13px;">${a.applied_at}</td>
          </tr>`,
          )
          .join("");
        animateScoreBars();
      }
    }
  } catch (e) {
    showToast("Connection error", "error");
  }

  // QA cards
  document
    .querySelectorAll(".qa-card[data-href]")
    .forEach((c) =>
      c.addEventListener(
        "click",
        () => (window.location.href = c.dataset.href),
      ),
    );
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
