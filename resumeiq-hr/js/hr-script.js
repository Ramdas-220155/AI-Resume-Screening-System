/* ============================================================
   ResumeIQ HR Dashboard — hr-script.js
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  /* ── 1. SIDEBAR TOGGLE ──────────────────────────────────── */
  const sidebar   = document.getElementById('sidebar');
  const toggleBtn = document.getElementById('sidebarToggle');

  if (toggleBtn && sidebar) {
    toggleBtn.addEventListener('click', () => {
      sidebar.classList.toggle('collapsed');
      localStorage.setItem('hrSidebarCollapsed', sidebar.classList.contains('collapsed'));
    });
    if (localStorage.getItem('hrSidebarCollapsed') === 'true') {
      sidebar.classList.add('collapsed');
    }
  }

  /* ── 2. ACTIVE NAV ──────────────────────────────────────── */
  const page = window.location.pathname.split('/').pop() || 'hr-dashboard.html';
  document.querySelectorAll('.nav-item').forEach(item => {
    const href = item.getAttribute('href') || '';
    if (href === page) item.classList.add('active');
  });

  /* ── 3. SCORE BARS (intersection) ──────────────────────── */
  const fills = document.querySelectorAll('.score-fill[data-score],.pipeline-bar[data-w]');
  if (fills.length) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          const el = e.target;
          if (el.dataset.score) el.style.width = el.dataset.score + '%';
          if (el.dataset.w)     el.style.width = el.dataset.w + '%';
          io.unobserve(el);
        }
      });
    }, { threshold: 0.2 });
    fills.forEach(f => { f.style.width = '0%'; io.observe(f); });
  }

  /* ── 4. COUNT-UP COUNTERS ───────────────────────────────── */
  document.querySelectorAll('.count-up').forEach(el => {
    const target = parseInt(el.dataset.target || '0', 10);
    let current = 0;
    const inc = Math.max(1, Math.ceil(target / 45));
    const t = setInterval(() => {
      current = Math.min(current + inc, target);
      el.textContent = current.toLocaleString();
      if (current >= target) clearInterval(t);
    }, 28);
  });

  /* ── 5. BAR CHART ANIMATION ─────────────────────────────── */
  document.querySelectorAll('.bar[data-h]').forEach(bar => {
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.style.height = e.target.dataset.h + 'px';
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.3 });
    bar.style.height = '4px';
    io.observe(bar);
  });

  /* ── 6. JOBS SEARCH & FILTER ───────────────────────────── */
  const jobSearch  = document.getElementById('jobSearch');
  const jobFilter  = document.getElementById('jobFilter');
  const jobCards   = document.querySelectorAll('.job-post-card');

  function filterJobs() {
    const q = jobSearch ? jobSearch.value.toLowerCase() : '';
    const f = jobFilter ? jobFilter.value : 'all';
    jobCards.forEach(card => {
      const title  = (card.dataset.title  || '').toLowerCase();
      const dept   = (card.dataset.dept   || '').toLowerCase();
      const status = (card.dataset.status || '').toLowerCase();
      const show   = (title.includes(q) || dept.includes(q)) && (f === 'all' || status === f);
      card.style.display = show ? '' : 'none';
    });
  }
  if (jobSearch) jobSearch.addEventListener('input', filterJobs);
  if (jobFilter) jobFilter.addEventListener('change', filterJobs);

  /* ── 7. CANDIDATE SEARCH ────────────────────────────────── */
  const candSearch = document.getElementById('candSearch');
  if (candSearch) {
    candSearch.addEventListener('input', () => {
      const q = candSearch.value.toLowerCase();
      document.querySelectorAll('#appsTable tbody tr').forEach(row => {
        row.style.display = row.textContent.toLowerCase().includes(q) ? '' : 'none';
      });
    });
  }

  /* ── 8. STATUS FILTER (candidates table) ────────────────── */
  const statusFilt = document.getElementById('statusFilter');
  if (statusFilt) {
    statusFilt.addEventListener('change', () => {
      const val = statusFilt.value;
      document.querySelectorAll('#appsTable tbody tr').forEach(row => {
        const s = row.dataset.status || '';
        row.style.display = (val === 'all' || s === val) ? '' : 'none';
      });
    });
  }

  /* ── 9. STATUS CHANGE DROPDOWN ──────────────────────────── */
  document.querySelectorAll('.status-select').forEach(sel => {
    sel.addEventListener('change', function () {
      const row   = this.closest('tr');
      const badge = row ? row.querySelector('.badge') : null;
      const val   = this.value;
      const map   = {
        pending:     'badge-pending',
        shortlisted: 'badge-shortlisted',
        interview:   'badge-interview',
        rejected:    'badge-rejected',
        hired:       'badge-hired',
      };
      if (badge) {
        badge.className = 'badge ' + (map[val] || 'badge-pending');
        badge.childNodes[1].textContent = val.charAt(0).toUpperCase() + val.slice(1);
      }
      showToast(`Status updated to "${val}"`, 'success');
    });
  });

  /* ── 10. TOGGLE SWITCHES ────────────────────────────────── */
  document.querySelectorAll('.toggle').forEach(t => {
    t.addEventListener('click', () => {
      t.classList.toggle('on');
      const name = t.closest('.toggle-row')?.querySelector('.toggle-name')?.textContent || 'Setting';
      showToast(`"${name}" ${t.classList.contains('on') ? 'enabled' : 'disabled'}`, 'info');
    });
  });

  /* ── 11. POST JOB FORM ──────────────────────────────────── */
  const postForm = document.getElementById('postJobForm');
  if (postForm) {
    postForm.addEventListener('submit', e => {
      e.preventDefault();
      const btn = postForm.querySelector('[type="submit"]');
      btn.innerHTML = '<span>✓ Posted!</span>';
      btn.style.background = 'linear-gradient(135deg,#10b981,#059669)';
      showToast('Job posted successfully!', 'success');
      setTimeout(() => { btn.innerHTML = '<span>📢 Post Job</span>'; btn.style.background = ''; }, 2500);
    });
  }

  /* ── 12. LOGOUT ─────────────────────────────────────────── */
  document.querySelectorAll('.logout-btn,.nav-logout').forEach(btn => {
    btn.addEventListener('click', () => {
      if (confirm('Log out of HR panel?')) {
        showToast('Logging out…', 'info');
        setTimeout(() => { window.location.href = 'hr-dashboard.html'; }, 1200);
      }
    });
  });

  /* ── 13. NOTIFICATION BTN ───────────────────────────────── */
  document.querySelectorAll('.topbar-btn[data-notif]').forEach(btn => {
    btn.addEventListener('click', () => showToast('5 new candidate applications 📬', 'info'));
  });

  /* ── 14. TOAST ──────────────────────────────────────────── */
  function showToast(msg, type = 'info') {
    let c = document.getElementById('toastContainer');
    if (!c) {
      c = document.createElement('div');
      c.id = 'toastContainer';
      c.style.cssText = 'position:fixed;top:76px;right:18px;z-index:9999;display:flex;flex-direction:column;gap:9px;';
      document.body.appendChild(c);
    }
    const col = { success:'#0d9488', error:'#ef4444', info:'#06b6d4' };
    const ico = { success:'✓', error:'✕', info:'◆' };
    const t = document.createElement('div');
    t.style.cssText = `
      background:rgba(4,13,20,0.96);
      border:1px solid ${col[type]};
      border-radius:10px;padding:13px 18px;
      color:#e2f0f7;font-family:'Plus Jakarta Sans',sans-serif;font-size:13px;
      display:flex;align-items:center;gap:9px;
      box-shadow:0 8px 28px rgba(0,0,0,0.55);
      backdrop-filter:blur(14px);min-width:260px;
      animation:slideInR 0.32s ease both;cursor:pointer;
    `;
    t.innerHTML = `<span style="color:${col[type]};font-weight:800;font-size:15px">${ico[type]}</span><span>${msg}</span>`;
    t.addEventListener('click', () => removeT(t));
    c.appendChild(t);

    if (!document.getElementById('hrToastSt')) {
      const s = document.createElement('style');
      s.id = 'hrToastSt';
      s.textContent = '@keyframes slideInR{from{opacity:0;transform:translateX(26px)}to{opacity:1;transform:translateX(0)}}@keyframes fadeOutR{to{opacity:0;transform:translateX(26px)}}';
      document.head.appendChild(s);
    }
    setTimeout(() => removeT(t), 3500);
  }
  function removeT(t) { t.style.animation = 'fadeOutR 0.28s ease forwards'; setTimeout(() => t.remove(), 280); }

});
