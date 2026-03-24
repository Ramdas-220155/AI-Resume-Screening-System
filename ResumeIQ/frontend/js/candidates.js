/* candidates.js — HR Candidates Page */
document.addEventListener('DOMContentLoaded', async () => {
  if (!Auth.requireLogin('hr')) return;
  applyIdentityToDOM();

  const searchInput  = document.getElementById('candSearch');
  const jobFilter    = document.getElementById('jobFilter');
  const statusFilter = document.getElementById('statusFilter');
  const candCount    = document.getElementById('candCount');
  const tbody        = document.querySelector('#candTable tbody');
  let allCands       = [];
  let currentAppId   = null;

  const bm = {applied:'badge-applied',shortlisted:'badge-shortlisted',interview:'badge-interview',hired:'badge-hired',rejected:'badge-rejected'};

  async function loadCandidates() {
    const res = await ApplicationsAPI.allForHR();
    if (!res.success) { showToast(res.error||'Failed to load','error'); return; }
    allCands = res.applications||[];

    // Populate job filter
    const jobs = [...new Map(allCands.map(a=>[a.job_id,{id:a.job_id,title:a.title}])).values()];
    if (jobFilter) {
      jobFilter.innerHTML = '<option value="all">All Jobs</option>' + jobs.map(j=>`<option value="${j.id}">${escHtml(j.title)}</option>`).join('');
    }
    renderTable(allCands);
  }

  function renderTable(cands) {
    if (!tbody) return;
    if (!cands.length) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--clr-muted);"><i class="fa-solid fa-users" style="font-size:28px;display:block;margin-bottom:10px;"></i>No candidates found.</td></tr>`;
      if (candCount) candCount.textContent = '0 candidates';
      return;
    }
    tbody.innerHTML = cands.map(c => {
      const init = (c.candidate_name||'?').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
      return `<tr>
        <td><div style="display:flex;align-items:center;gap:10px;"><div style="width:36px;height:36px;border-radius:50%;background:var(--grad);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:white;">${init}</div><div><div style="font-family:var(--ff-head);font-size:14px;font-weight:700;color:var(--clr-head);">${escHtml(c.candidate_name||'Unknown')}</div><div style="font-size:12px;color:var(--clr-muted);">${escHtml(c.candidate_email||'')}</div></div></div></td>
        <td style="color:var(--clr-head);">${escHtml(c.title||'')}</td>
        <td><div class="score-wrap"><div class="score-track"><div class="score-fill" data-score="${c.score||0}" style="width:0%"></div></div><span class="score-pct">${c.score||0}%</span></div></td>
        <td><span class="badge ${bm[c.status]||'badge-applied'}">${capitalize(c.status)}</span></td>
        <td style="color:var(--clr-muted);font-size:13px;">${c.applied_at||''}</td>
        <td>${c.resume_name?`<a href="#" class="btn btn-xs btn-outline" onclick="showToast('Download: ${escHtml(c.resume_name)}','info');return false;"><i class="fa-solid fa-file-arrow-down"></i> ${escHtml(c.resume_name.substring(0,12)+'…')}</a>`:'<span style="color:var(--clr-muted);font-size:12px;">No resume</span>'}</td>
        <td><button class="btn btn-xs btn-primary update-status-btn" data-id="${c.id}" data-status="${c.status}"><i class="fa-solid fa-pen"></i> Update</button></td>
      </tr>`;
    }).join('');
    if (candCount) candCount.textContent = `${cands.length} candidate${cands.length!==1?'s':''}`;
    animateScoreBars();
    document.querySelectorAll('.update-status-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        currentAppId = this.dataset.id;
        document.getElementById('modalStatus').value = this.dataset.status||'applied';
        document.getElementById('modalNotes').value = '';
        document.getElementById('interviewFields').style.display = (this.dataset.status === 'interview') ? 'block' : 'none';
        document.getElementById('modalIntDate').value = '';
        document.getElementById('modalIntTime').value = '';
        document.getElementById('modalIntLink').value = '';
        document.getElementById('statusModal').style.display = 'flex';
      });
    });
  }

  function filterCands() {
    const q = (searchInput?.value||'').toLowerCase();
    const job = jobFilter?.value||'all';
    const status = statusFilter?.value||'all';
    renderTable(allCands.filter(c => {
      const mq = !q||(c.candidate_name||'').toLowerCase().includes(q)||(c.title||'').toLowerCase().includes(q);
      return mq && (job==='all'||c.job_id===job) && (status==='all'||c.status===status);
    }));
  }

  // Modal
  document.getElementById('saveStatusBtn')?.addEventListener('click', async () => {
    if (!currentAppId) return;
    const status = document.getElementById('modalStatus')?.value;
    const notes  = document.getElementById('modalNotes')?.value||'';
    
    let res;
    if (status === 'interview') {
      const date = document.getElementById('modalIntDate').value;
      const time = document.getElementById('modalIntTime').value;
      const link = document.getElementById('modalIntLink').value;
      if (!date || !time) return showToast("Date and Time are required for interview", "error");
      
      res = await InterviewAPI.schedule({ application_id: currentAppId, date, time, meeting_link: link, notes });
    } else {
      res = await ApplicationsAPI.updateStatus(currentAppId, status, notes);
    }

    if (res.success) {
      showToast(`Status updated to ${capitalize(status)} ✓`,'success');
      document.getElementById('statusModal').style.display = 'none';
      const cand = allCands.find(c=>c.id===currentAppId);
      if (cand) cand.status = status;
      filterCands();
    } else showToast(res.error||'Failed to update','error');
  });
  
  document.getElementById('modalStatus')?.addEventListener('change', function() {
    document.getElementById('interviewFields').style.display = this.value === 'interview' ? 'block' : 'none';
  });
  document.getElementById('modalClose')?.addEventListener('click', () => document.getElementById('statusModal').style.display='none');
  document.getElementById('cancelStatusBtn')?.addEventListener('click', () => document.getElementById('statusModal').style.display='none');

  await loadCandidates();
  searchInput?.addEventListener('input', filterCands);
  jobFilter?.addEventListener('change', filterCands);
  statusFilter?.addEventListener('change', filterCands);
  document.getElementById('notifBtn')?.addEventListener('click', () => showToast('No new notifications','info'));

  document.getElementById('autoShortlistBtn')?.addEventListener('click', async function() {
    this.disabled = true;
    this.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processing...';
    try {
      const res = await AIChatAPI.autoShortlist();
      if (res.success) {
        showToast(res.message || 'Auto-shortlisting complete!', 'success');
        await loadCandidates();
      } else {
        showToast(res.error || 'Automation failed', 'error');
      }
    } catch(e) {
      showToast('Network error', 'error');
    } finally {
      this.disabled = false;
      this.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles"></i> AI Auto Shortlist';
    }
  });
});
