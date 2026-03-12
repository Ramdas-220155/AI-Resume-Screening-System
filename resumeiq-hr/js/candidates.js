/* ============================================================
   candidates.js — Candidate Rankings / Applied Candidates Logic
   Resume side panel, search/filter, score bars, shortlist
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {

  /* ── Score bars ── */
  const fills = document.querySelectorAll('.score-fill[data-score]');
  if (fills.length) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.style.width = e.target.dataset.score + '%'; io.unobserve(e.target); }
      });
    }, { threshold: 0.1 });
    fills.forEach(f => { f.style.width = '0%'; io.observe(f); });
  }

  /* ── Stat counters ── */
  document.querySelectorAll('.count-up[data-target]').forEach(el => {
    const target = parseInt(el.dataset.target, 10);
    let cur = 0;
    const inc = Math.max(1, Math.ceil(target / 40));
    const t = setInterval(() => { cur = Math.min(cur + inc, target); el.textContent = cur; if (cur >= target) clearInterval(t); }, 28);
  });

  /* ── Search + filter ── */
  const searchInp  = document.getElementById('candSearch');
  const scoreFilter = document.getElementById('scoreFilter');
  const jobFilter  = document.getElementById('jobFilter');
  const rows       = document.querySelectorAll('tbody tr.cand-row');

  function filterCandidates() {
    const q = searchInp?.value.toLowerCase() || '';
    const sf = scoreFilter?.value || 'all';
    const jf = jobFilter?.value || 'all';
    rows.forEach(row => {
      const matchQ  = row.textContent.toLowerCase().includes(q);
      const score   = parseInt(row.dataset.score || '0', 10);
      let   matchSF = true;
      if (sf === 'hi')  matchSF = score >= 90;
      if (sf === 'mid') matchSF = score >= 70 && score < 90;
      if (sf === 'lo')  matchSF = score < 70;
      const matchJF = jf === 'all' || row.dataset.job === jf;
      row.style.display = (matchQ && matchSF && matchJF) ? '' : 'none';
    });
  }

  searchInp?.addEventListener('input', filterCandidates);
  scoreFilter?.addEventListener('change', filterCandidates);
  jobFilter?.addEventListener('change', filterCandidates);

  /* ── Resume Side Panel ── */
  const panel    = document.getElementById('resumePanel');
  const panelOverlay = document.getElementById('panelOverlay');

  function openPanel(data) {
    if (!panel) return;

    // Populate panel
    document.getElementById('rpName').textContent   = data.name;
    document.getElementById('rpRole').textContent   = data.role;
    document.getElementById('rpScore').textContent  = data.score + '%';
    document.getElementById('rpInit').textContent   = data.initials;
    document.getElementById('rpEmail').textContent  = data.email;
    document.getElementById('rpPhone').textContent  = data.phone;
    document.getElementById('rpLoc').textContent    = data.location;
    document.getElementById('rpExp').textContent    = data.experience;
    document.getElementById('rpExpect').textContent = data.expected;
    document.getElementById('rpApplied').textContent = data.applied;

    // Skills
    const skillsWrap = document.getElementById('rpSkills');
    skillsWrap.innerHTML = '';
    data.skills.forEach(s => {
      const span = document.createElement('span');
      span.className = 'skill-chip';
      span.textContent = s;
      skillsWrap.appendChild(span);
    });

    panel.classList.add('open');
    if (panelOverlay) panelOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closePanel() {
    panel?.classList.remove('open');
    if (panelOverlay) panelOverlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  document.getElementById('rpCloseBtn')?.addEventListener('click', closePanel);
  panelOverlay?.addEventListener('click', closePanel);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closePanel(); });

  /* ── View Resume buttons ── */
  document.querySelectorAll('.view-resume-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const row = this.closest('tr');
      openPanel({
        name:       row.dataset.name       || 'Candidate',
        role:       row.dataset.role       || 'Role',
        score:      row.dataset.score      || '0',
        initials:   row.dataset.initials   || 'XX',
        email:      row.dataset.email      || '—',
        phone:      row.dataset.phone      || '—',
        location:   row.dataset.location   || '—',
        experience: row.dataset.experience || '—',
        expected:   row.dataset.expected   || '—',
        applied:    row.dataset.applied    || '—',
        skills:     (row.dataset.skills || '').split(',').filter(Boolean),
      });
    });
  });

  /* ── Shortlist button ── */
  document.querySelectorAll('.shortlist-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const name = this.closest('tr')?.dataset.name || 'Candidate';
      showToast(`${name} shortlisted! ✓`, 'success');
      const statusCell = this.closest('tr')?.querySelector('.status-cell');
      if (statusCell) statusCell.innerHTML = '<span class="badge badge-shortlist"><i class="fa-solid fa-check" style="font-size:8px;"></i> Shortlisted</span>';
    });
  });

  /* ── Reject button ── */
  document.querySelectorAll('.reject-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const name = this.closest('tr')?.dataset.name || 'Candidate';
      if (confirm(`Reject ${name}'s application?`)) {
        showToast(`${name} rejected`, 'error');
        const statusCell = this.closest('tr')?.querySelector('.status-cell');
        if (statusCell) statusCell.innerHTML = '<span class="badge badge-rejected">Rejected</span>';
      }
    });
  });

  /* ── Panel action buttons ── */
  document.getElementById('rpShortlistBtn')?.addEventListener('click', () => {
    showToast('Candidate shortlisted! Interview invite sent ✓', 'success');
    closePanel();
  });
  document.getElementById('rpRejectBtn')?.addEventListener('click', () => {
    showToast('Candidate rejected. Rejection email sent.', 'error');
    closePanel();
  });

  /* ── Export ── */
  document.getElementById('exportBtn')?.addEventListener('click', () => {
    showToast('Rankings exported as CSV 📤', 'success');
  });

  document.getElementById('notifBtn')?.addEventListener('click', () => {
    showToast('You have 8 new notifications 🔔', 'info');
  });

  document.querySelector('.chatbot-bubble')?.addEventListener('click', () => {
    showToast('AI Recruiter Assistant launching soon 🤖', 'info');
  });
});
