/* hr-applications.js — HR All Applications */
document.addEventListener('DOMContentLoaded', async () => {
  if (!Auth.requireLogin('hr')) return;
  applyIdentityToDOM();

  const search   = document.getElementById('appSearch');
  const jobF     = document.getElementById('jobFilter');
  const statusF  = document.getElementById('statusFilter');
  const tbody    = document.querySelector('#hrAppsTable tbody');
  let allApps    = [];
  let currentId  = null;

  const bm = {applied:'badge-applied',shortlisted:'badge-shortlisted',interview:'badge-interview',hired:'badge-hired',rejected:'badge-rejected'};

  function renderStats(s) {
    animateCount(document.querySelector('[data-stat="total"]'),       s.total||0);
    animateCount(document.querySelector('[data-stat="new"]'),         s.new_today||0);
    animateCount(document.querySelector('[data-stat="shortlisted"]'), s.shortlisted||0);
    animateCount(document.querySelector('[data-stat="hired"]'),       s.hired||0);
  }

  async function load() {
    const res = await ApplicationsAPI.allForHR();
    if (!res.success) { showToast(res.error||'Failed','error'); return; }
    allApps = res.applications||[];
    if (res.stats) renderStats(res.stats);
    const jobs = [...new Map(allApps.map(a=>[a.job_id,{id:a.job_id,title:a.title}])).values()];
    if (jobF) jobF.innerHTML = '<option value="all">All Jobs</option>' + jobs.map(j=>`<option value="${j.id}">${escHtml(j.title)}</option>`).join('');
    renderTable(allApps);
  }

  function renderTable(apps) {
    if (!tbody) return;
    if (!apps.length) { tbody.innerHTML=`<tr><td colspan="6" style="text-align:center;padding:40px;color:var(--clr-muted);">No applications found.</td></tr>`; return; }
    tbody.innerHTML = apps.map(a => {
      const init = (a.candidate_name||'?').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
      return `<tr>
        <td><div style="display:flex;align-items:center;gap:10px;"><div style="width:32px;height:32px;border-radius:50%;background:var(--grad);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:white;">${init}</div><div><div style="font-family:var(--ff-head);font-size:14px;font-weight:700;color:var(--clr-head);">${escHtml(a.candidate_name||'Unknown')}</div><div style="font-size:12px;color:var(--clr-muted);">${escHtml(a.candidate_email||'')}</div></div></div></td>
        <td style="color:var(--clr-head);">${escHtml(a.title||'')}</td>
        <td><div class="score-wrap"><div class="score-track"><div class="score-fill" data-score="${a.score||0}" style="width:0%"></div></div><span class="score-pct">${a.score||0}%</span></div></td>
        <td><span class="badge ${bm[a.status]||'badge-applied'}">${capitalize(a.status)}</span></td>
        <td style="color:var(--clr-muted);font-size:13px;">${a.applied_at||''}</td>
        <td><button class="btn btn-xs btn-primary upd-btn" data-id="${a.id}" data-status="${a.status}"><i class="fa-solid fa-pen"></i> Update</button></td>
      </tr>`;
    }).join('');
    animateScoreBars();
    document.querySelectorAll('.upd-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        currentId = this.dataset.id;
        document.getElementById('modalStatus').value = this.dataset.status||'applied';
        document.getElementById('modalNotes').value = '';
        document.getElementById('statusModal').style.display = 'flex';
      });
    });
  }

  function filterApps() {
    const q = (search?.value||'').toLowerCase();
    const job = jobF?.value||'all';
    const s = statusF?.value||'all';
    renderTable(allApps.filter(a => {
      const mq = !q||(a.candidate_name||'').toLowerCase().includes(q)||(a.title||'').toLowerCase().includes(q);
      return mq && (job==='all'||a.job_id===job) && (s==='all'||a.status===s);
    }));
  }

  document.getElementById('saveStatusBtn')?.addEventListener('click', async () => {
    if (!currentId) return;
    const status = document.getElementById('modalStatus')?.value;
    const notes  = document.getElementById('modalNotes')?.value||'';
    const res = await ApplicationsAPI.updateStatus(currentId, status, notes);
    if (res.success) {
      showToast(`Status updated to ${capitalize(status)} ✓`,'success');
      document.getElementById('statusModal').style.display='none';
      const app = allApps.find(a=>a.id===currentId);
      if (app) app.status = status;
      filterApps();
      const sr = await ApplicationsAPI.hrStats();
      if (sr.success) renderStats(sr.stats||{});
    } else showToast(res.error||'Failed','error');
  });
  document.getElementById('modalClose')?.addEventListener('click',()=>document.getElementById('statusModal').style.display='none');
  document.getElementById('cancelStatusBtn')?.addEventListener('click',()=>document.getElementById('statusModal').style.display='none');

  await load();
  search?.addEventListener('input', filterApps);
  jobF?.addEventListener('change', filterApps);
  statusF?.addEventListener('change', filterApps);
  document.getElementById('notifBtn')?.addEventListener('click',()=>showToast('No new notifications','info'));
});
