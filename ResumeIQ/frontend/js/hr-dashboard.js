/* hr-dashboard.js — HR Home Dashboard */
document.addEventListener('DOMContentLoaded', async () => {
  if (!Auth.requireLogin('hr')) return;
  applyIdentityToDOM();

  const bm = {applied:'badge-applied',shortlisted:'badge-shortlisted',interview:'badge-interview',hired:'badge-hired',rejected:'badge-rejected'};

  try {
    const res = await HRAPI.dashboard();
    if (!res.success) { showToast(res.error||'Failed to load','error'); return; }
    const { stats, recent_applications, active_jobs } = res;

    // Stats
    animateCount(document.querySelector('[data-stat="active_jobs"]'), stats.active_jobs||0);
    animateCount(document.querySelector('[data-stat="total_apps"]'),  stats.total_apps||0);
    animateCount(document.querySelector('[data-stat="shortlisted"]'), stats.shortlisted||0);
    animateCount(document.querySelector('[data-stat="hired"]'),       stats.hired||0);

    const newEl = document.getElementById('newAppsCount');
    if (newEl) newEl.textContent = stats.new_today||0;
    const activeEl = document.getElementById('activeJobsCount');
    if (activeEl) activeEl.textContent = stats.active_jobs||0;

    // QA subs
    const qs = document.getElementById('hrQaCandSub');
    if (qs) qs.textContent = `${stats.total_apps} total applicants`;
    const qa = document.getElementById('hrQaAppSub');
    if (qa) qa.textContent = `${stats.new_today||0} new today`;

    // Recent applications
    const tbody = document.querySelector('#recentAppsTable tbody');
    if (tbody) {
      if (!recent_applications?.length) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:32px;color:var(--clr-muted);">No applications yet.</td></tr>`;
      } else {
        tbody.innerHTML = recent_applications.map(a => {
          const init = (a.candidate_name||'?').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
          return `<tr>
            <td><div style="display:flex;align-items:center;gap:10px;"><div style="width:32px;height:32px;border-radius:50%;background:var(--grad);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:white;">${init}</div><div><div style="font-family:var(--ff-head);font-size:14px;font-weight:700;color:var(--clr-head);">${escHtml(a.candidate_name||'Unknown')}</div><div style="font-size:12px;color:var(--clr-muted);">${escHtml(a.candidate_email||'')}</div></div></div></td>
            <td style="color:var(--clr-head);font-weight:600;">${escHtml(a.title||'')}</td>
            <td><div class="score-wrap"><div class="score-track"><div class="score-fill" data-score="${a.score||0}" style="width:0%"></div></div><span class="score-pct">${a.score||0}%</span></div></td>
            <td><span class="badge ${bm[a.status]||'badge-applied'}">${capitalize(a.status)}</span></td>
            <td style="color:var(--clr-muted);font-size:13px;">${a.applied_at||''}</td>
            <td><a href="candidates.html" class="btn btn-xs btn-outline"><i class="fa-solid fa-eye"></i> Review</a></td>
          </tr>`;
        }).join('');
        animateScoreBars();
      }
    }

    // Active jobs
    const jobTbody = document.querySelector('#activeJobsTable tbody');
    if (jobTbody) {
      if (!active_jobs?.length) {
        jobTbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:32px;color:var(--clr-muted);">No active jobs. <a href="post-job.html" style="color:var(--clr-accent)">Post one →</a></td></tr>`;
      } else {
        jobTbody.innerHTML = active_jobs.map(j => `
          <tr>
            <td><div style="font-family:var(--ff-head);font-size:14px;font-weight:700;color:var(--clr-head);">${escHtml(j.title)}</div></td>
            <td><span class="badge badge-applied" style="text-transform:capitalize;">${j.type||''}</span></td>
            <td style="color:var(--clr-muted);">${j.loc||''}</td>
            <td><span style="font-family:var(--ff-head);font-weight:700;color:var(--clr-accent);">${j.app_count||0}</span></td>
            <td style="color:var(--clr-muted);font-size:13px;">${j.posted_at||''}</td>
            <td><a href="candidates.html?job=${j.id}" class="btn btn-xs btn-outline"><i class="fa-solid fa-users"></i> Candidates</a></td>
          </tr>`).join('');
      }
    }
  } catch(e) { showToast('Connection error','error'); }

  document.querySelectorAll('.qa-card[data-href]').forEach(c => c.addEventListener('click', () => window.location.href = c.dataset.href));
  document.getElementById('notifBtn')?.addEventListener('click', () => showToast('No new notifications','info'));
  document.querySelector('.chatbot-bubble')?.addEventListener('click', () => showToast('AI assistant launching soon 🤖','info'));
});
