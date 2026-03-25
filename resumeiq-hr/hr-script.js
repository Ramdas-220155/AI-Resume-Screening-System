/* ================================================================
   ResumeIQ HR Panel  —  hr-script.js
   Theme · Sidebar · Charts · Toggles · Filter · Toast · Tags
   ================================================================ */

(function () {
  'use strict';

  /* ── THEME TOGGLE ─────────────────────────────────────── */
  const THEME_KEY = 'riq-theme';

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    document.querySelectorAll('.theme-toggle-btn').forEach(btn => {
      const moon = btn.querySelector('.icon-moon');
      const sun  = btn.querySelector('.icon-sun');
      if (moon) moon.style.display = theme === 'dark'  ? 'block' : 'none';
      if (sun)  sun.style.display  = theme === 'light' ? 'block' : 'none';
    });
  }

  function initTheme() {
    const saved = localStorage.getItem(THEME_KEY) || 'dark';
    applyTheme(saved);
    document.querySelectorAll('.theme-toggle-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        applyTheme(next);
        localStorage.setItem(THEME_KEY, next);
      });
    });
  }

  /* ── SIDEBAR COLLAPSE ─────────────────────────────────── */
  function initSidebar() {
    const sidebar = document.getElementById('sidebar');
    const btn     = document.getElementById('sidebarToggle');
    if (!sidebar || !btn) return;
    const KEY = 'riq-sidebar';
    if (localStorage.getItem(KEY) === 'collapsed') sidebar.classList.add('collapsed');
    btn.addEventListener('click', () => {
      sidebar.classList.toggle('collapsed');
      localStorage.setItem(KEY, sidebar.classList.contains('collapsed') ? 'collapsed' : 'open');
    });
  }

  /* ── BAR CHART ────────────────────────────────────────── */
  function initBarChart() {
    const chart = document.getElementById('barChart');
    if (!chart) return;
    const bars  = chart.querySelectorAll('.bar');
    const vals  = Array.from(bars).map(b => parseFloat(b.dataset.h) || 0);
    const max   = Math.max(...vals);
    bars.forEach(b => { b.style.height = '4px'; });
    requestAnimationFrame(() => setTimeout(() => {
      bars.forEach((b, i) => { b.style.height = (max > 0 ? (vals[i] / max) * 100 : 0) + '%'; });
    }, 100));
  }

  /* ── SCORE FILLS ──────────────────────────────────────── */
  function initScoreFills() {
    const fills = document.querySelectorAll('.score-fill[data-score]');
    fills.forEach(el => { el.style.width = '0%'; });
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        setTimeout(() => { e.target.style.width = (parseFloat(e.target.dataset.score) || 0) + '%'; }, 80);
        obs.unobserve(e.target);
      });
    }, { threshold: 0.1 });
    fills.forEach(el => obs.observe(el));
  }

  /* ── COUNT-UP ─────────────────────────────────────────── */
  function initCountUp() {
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        const el = e.target, target = parseInt(el.dataset.target, 10), dur = 900, t0 = performance.now();
        function tick(now) {
          const p = Math.min((now - t0) / dur, 1), eased = 1 - Math.pow(1 - p, 3);
          el.textContent = Math.round(eased * target);
          if (p < 1) requestAnimationFrame(tick); else el.textContent = target;
        }
        requestAnimationFrame(tick);
        obs.unobserve(el);
      });
    }, { threshold: 0.2 });
    document.querySelectorAll('.count-up[data-target]').forEach(el => obs.observe(el));
  }

  /* ── TOGGLES ──────────────────────────────────────────── */
  function initToggles() {
    document.querySelectorAll('.toggle').forEach(t => {
      t.addEventListener('click', () => t.classList.toggle('on'));
    });
  }

  /* ── CANDIDATE FILTER ─────────────────────────────────── */
  function initCandidateFilter() {
    const search  = document.getElementById('candSearch');
    const status  = document.getElementById('statusFilter');
    const role    = document.getElementById('jobRoleFilter');
    const tbody   = document.getElementById('appsTable');
    if (!tbody) return;
    function run() {
      const q  = search ? search.value.toLowerCase() : '';
      const st = status ? status.value : 'all';
      const ro = role   ? role.value   : 'All Roles';
      tbody.querySelectorAll('tr[data-status]').forEach(row => {
        const matchQ  = !q  || row.textContent.toLowerCase().includes(q);
        const matchSt = st === 'all' || row.dataset.status === st;
        const matchRo = ro === 'All Roles' || (row.cells[2] && row.cells[2].textContent.includes(ro));
        row.style.display = (matchQ && matchSt && matchRo) ? '' : 'none';
      });
    }
    if (search) search.addEventListener('input', run);
    if (status) status.addEventListener('change', run);
    if (role)   role.addEventListener('change', run);
  }

  /* ── SETTINGS PANEL SWITCHER ──────────────────────────── */
  function initSettings() {
    const items = document.querySelectorAll('.settings-menu-item[data-panel]');
    if (!items.length) return;
    items.forEach(item => {
      item.addEventListener('click', () => {
        items.forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        document.querySelectorAll('.settings-panel').forEach(p => {
          p.style.display = p.id === 'panel-' + item.dataset.panel ? 'block' : 'none';
        });
      });
    });
  }

  /* ── TOAST ────────────────────────────────────────────── */
  function getToastContainer() {
    let c = document.getElementById('toastContainer');
    if (!c) { c = document.createElement('div'); c.id = 'toastContainer'; document.body.appendChild(c); }
    return c;
  }
  window.showToast = function (msg, type = 'success') {
    const icon = { success: '✓', error: '✕', info: '◆' };
    const toast = document.createElement('div');
    toast.className = 'toast ' + type;
    toast.innerHTML = `<span class="toast-icon">${icon[type] || icon.info}</span><span>${msg}</span>`;
    getToastContainer().appendChild(toast);
    setTimeout(() => {
      toast.style.animation = 'fadeOutR .26s ease forwards';
      setTimeout(() => toast.remove(), 280);
    }, 3000);
    toast.addEventListener('click', () => toast.remove());
  };

  /* ── NOTIFICATION BELL ────────────────────────────────── */
  function initBell() {
    document.querySelectorAll('[data-notif]').forEach(btn => {
      btn.addEventListener('click', () => window.showToast('No new notifications', 'info'));
    });
  }

  /* ── TAG INPUT ────────────────────────────────────────── */
  function addTag(wrap, text) {
    if (!text) return;
    const input = wrap.querySelector('.tag-input-el');
    const tag   = document.createElement('span');
    tag.className = 'tag';
    tag.innerHTML = `${text}<button class="tag-remove" title="Remove">✕</button>`;
    tag.querySelector('.tag-remove').addEventListener('click', e => { e.stopPropagation(); tag.remove(); });
    wrap.insertBefore(tag, input);
  }
  function initTagInputs() {
    document.querySelectorAll('.tag-wrap').forEach(wrap => {
      const input = wrap.querySelector('.tag-input-el');
      if (!input) return;
      (wrap.dataset.tags || '').split(',').filter(Boolean).forEach(t => addTag(wrap, t.trim()));
      input.addEventListener('keydown', e => {
        if ((e.key === 'Enter' || e.key === ',') && input.value.trim()) {
          e.preventDefault(); addTag(wrap, input.value.trim().replace(/,$/, '')); input.value = '';
        }
        if (e.key === 'Backspace' && !input.value) {
          const tags = wrap.querySelectorAll('.tag'); if (tags.length) tags[tags.length - 1].remove();
        }
      });
      wrap.addEventListener('click', () => input.focus());
    });
  }

  /* ── POST JOB FORM ────────────────────────────────────── */
  function initPostJob() {
    const form     = document.getElementById('postJobForm');
    const clearBtn = document.getElementById('clearBtn');
    const draftBtn = document.getElementById('draftBtn');
    if (!form) return;
    form.addEventListener('submit', e => {
      e.preventDefault();
      window.showToast('Job posted! AI screening is active.', 'success');
    });
    if (clearBtn) clearBtn.addEventListener('click', () => {
      if (confirm('Clear all form fields?')) {
        form.reset();
        form.querySelectorAll('.tag:not(.tag-input-el)').forEach(t => t.remove());
        window.showToast('Form cleared', 'info');
      }
    });
    if (draftBtn) draftBtn.addEventListener('click', () => window.showToast('Draft saved', 'info'));
  }

  /* ── LOGOUT ───────────────────────────────────────────── */
  function initLogout() {
    document.querySelectorAll('.logout-btn, .nav-logout').forEach(btn => {
      btn.addEventListener('click', e => {
        e.preventDefault();
        if (confirm('Logout?')) window.showToast('Logging out…', 'info');
      });
    });
  }

  /* ── INIT ─────────────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initSidebar();
    initBarChart();
    initScoreFills();
    initCountUp();
    initToggles();
    initCandidateFilter();
    initSettings();
    initBell();
    initTagInputs();
    initPostJob();
    initLogout();
  });

})();
