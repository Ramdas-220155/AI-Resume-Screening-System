/* ============================================================
   hr-script.js — ResumeIQ HR Panel
   Features:
     • Dark / Light theme toggle with localStorage persistence
     • Job search & status filter
     • KPI count-up animation (IntersectionObserver)
     • Post Job modal open/close
     • Post Job form submit toast
   ============================================================ */

(function () {
  'use strict';

  /* ── DOM refs ─────────────────────────────────────────── */
  const html         = document.documentElement;
  const themeToggle  = document.getElementById('themeToggle');
  const themeLabel   = document.getElementById('themeLabel');
  const jobSearch    = document.getElementById('jobSearch');
  const jobFilter    = document.getElementById('jobFilter');
  const jobCards     = document.querySelectorAll('.job-post-card');
  const emptyState   = document.getElementById('emptyState');
  const jobsGrid     = document.getElementById('jobsGrid');
  const postModal    = document.getElementById('postModal');
  const openPostBtn  = document.getElementById('openPostModal');
  const closeModalBtn= document.getElementById('closeModal');
  const cancelBtn    = document.getElementById('cancelModal');
  const postJobForm  = document.getElementById('postJobForm');
  const kpiValues    = document.querySelectorAll('.kpi-value.count-up');

  /* ──────────────────────────────────────────────────────
     1. THEME TOGGLE
  ─────────────────────────────────────────────────────── */
  const THEME_KEY = 'resumeiq-theme';

  /** Apply theme to <html> and update toggle label */
  function applyTheme(theme) {
    html.setAttribute('data-theme', theme);
    if (themeLabel) {
      themeLabel.textContent = theme === 'dark' ? 'Dark' : 'Light';
    }
    localStorage.setItem(THEME_KEY, theme);
  }

  /** Init: load saved theme, default to dark */
  function initTheme() {
    const saved = localStorage.getItem(THEME_KEY) || 'dark';
    applyTheme(saved);
  }

  /** Toggle between dark and light */
  function toggleTheme() {
    const current = html.getAttribute('data-theme');
    applyTheme(current === 'dark' ? 'light' : 'dark');
  }

  if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
  }

  initTheme();


  /* ──────────────────────────────────────────────────────
     2. JOB SEARCH & FILTER
  ─────────────────────────────────────────────────────── */
  function filterJobs() {
    const query  = (jobSearch ? jobSearch.value.toLowerCase() : '');
    const status = (jobFilter ? jobFilter.value : 'all');
    let visible  = 0;

    jobCards.forEach(card => {
      const title    = (card.dataset.title  || '').toLowerCase();
      const dept     = (card.dataset.dept   || '').toLowerCase();
      const cardStatus = (card.dataset.status || '').toLowerCase();

      const matchesQuery  = title.includes(query) || dept.includes(query);
      const matchesStatus = status === 'all' || cardStatus === status;

      if (matchesQuery && matchesStatus) {
        card.style.display = '';
        card.style.animationDelay = (visible * 0.05) + 's';
        card.classList.remove('hidden');
        visible++;
      } else {
        card.style.display = 'none';
        card.classList.add('hidden');
      }
    });

    if (emptyState) {
      emptyState.style.display = visible === 0 ? 'block' : 'none';
    }
  }

  if (jobSearch) jobSearch.addEventListener('input', debounce(filterJobs, 200));
  if (jobFilter) jobFilter.addEventListener('change', filterJobs);


  /* ──────────────────────────────────────────────────────
     3. KPI COUNT-UP ANIMATION
  ─────────────────────────────────────────────────────── */
  function animateCountUp(el) {
    const target   = parseInt(el.dataset.target, 10) || 0;
    const duration = 900; // ms
    const start    = performance.now();

    function step(now) {
      const elapsed  = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(eased * target).toLocaleString();
      if (progress < 1) requestAnimationFrame(step);
    }

    requestAnimationFrame(step);
  }

  if ('IntersectionObserver' in window) {
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          animateCountUp(e.target);
          obs.unobserve(e.target);
        }
      });
    }, { threshold: 0.4 });

    kpiValues.forEach(el => obs.observe(el));
  } else {
    // Fallback: run immediately
    kpiValues.forEach(el => {
      el.textContent = parseInt(el.dataset.target, 10).toLocaleString();
    });
  }


  /* ──────────────────────────────────────────────────────
     4. POST JOB MODAL
  ─────────────────────────────────────────────────────── */
  function openModal() {
    if (!postModal) return;
    postModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    // Focus first input
    setTimeout(() => {
      const firstInput = postModal.querySelector('input, select, textarea');
      if (firstInput) firstInput.focus();
    }, 50);
  }

  function closeModal() {
    if (!postModal) return;
    postModal.style.display = 'none';
    document.body.style.overflow = '';
  }

  if (openPostBtn)  openPostBtn.addEventListener('click', openModal);
  if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
  if (cancelBtn)    cancelBtn.addEventListener('click', closeModal);

  // Close on overlay click
  if (postModal) {
    postModal.addEventListener('click', e => {
      if (e.target === postModal) closeModal();
    });
  }

  // Close on Escape
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeModal();
  });

  // Form submit
  if (postJobForm) {
    postJobForm.addEventListener('submit', e => {
      e.preventDefault();
      closeModal();
      postJobForm.reset();
      showToast('✅ Job posted successfully!', 'success');
    });
  }


  /* ──────────────────────────────────────────────────────
     5. TOAST NOTIFICATIONS
  ─────────────────────────────────────────────────────── */
  function showToast(message, type = 'success') {
    // Remove existing toasts
    document.querySelectorAll('.riq-toast').forEach(t => t.remove());

    const toast = document.createElement('div');
    toast.className = 'riq-toast';
    toast.textContent = message;

    const isLight = html.getAttribute('data-theme') === 'light';

    Object.assign(toast.style, {
      position:       'fixed',
      bottom:         '90px',
      right:          '28px',
      background:     type === 'success'
                        ? (isLight ? '#059669' : '#34d399')
                        : (isLight ? '#dc2626' : '#f87171'),
      color:          '#fff',
      padding:        '12px 20px',
      borderRadius:   '10px',
      fontFamily:     "'DM Sans', sans-serif",
      fontSize:       '13.5px',
      fontWeight:     '500',
      zIndex:         '9999',
      boxShadow:      '0 4px 20px rgba(0,0,0,0.25)',
      opacity:        '0',
      transform:      'translateY(10px)',
      transition:     'opacity 0.25s, transform 0.25s',
      pointerEvents:  'none',
    });

    document.body.appendChild(toast);

    // Animate in
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        toast.style.opacity   = '1';
        toast.style.transform = 'translateY(0)';
      });
    });

    // Animate out after 3s
    setTimeout(() => {
      toast.style.opacity   = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }


  /* ──────────────────────────────────────────────────────
     6. UTILITIES
  ─────────────────────────────────────────────────────── */
  function debounce(fn, delay) {
    let timer;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  }

})();