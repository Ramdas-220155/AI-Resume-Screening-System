/* ═══════════════════════════════════════════════
   ResumeIQ HR Dashboard — hr-script.js
═══════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {

  /* ── 1. Dark / Light Theme Toggle ─────────── */
  const html        = document.documentElement;
  const themeToggle = document.getElementById('themeToggle');
  const themeIcon   = document.getElementById('themeIcon');

  // Persist user preference
  const savedTheme = localStorage.getItem('hr-theme') || 'dark';
  html.setAttribute('data-theme', savedTheme);
  updateThemeLabel(savedTheme);

  themeToggle.addEventListener('click', () => {
    const current = html.getAttribute('data-theme');
    const next    = current === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', next);
    localStorage.setItem('hr-theme', next);
    updateThemeLabel(next);
  });

  function updateThemeLabel(theme) {
    themeIcon.textContent = theme === 'dark' ? 'Light' : 'Dark';
    themeToggle.title = theme === 'dark'
      ? 'Switch to light mode'
      : 'Switch to dark mode';
  }


  /* ── 2. Sidebar Toggle ─────────────────────── */
  const sidebar       = document.getElementById('sidebar');
  const sidebarToggle = document.getElementById('sidebarToggle');

  if (sidebarToggle) {
    sidebarToggle.addEventListener('click', () => {
      sidebar.classList.toggle('collapsed');
    });
  }


  /* ── 3. Count-Up Animations ────────────────── */
  const counters = document.querySelectorAll('.count-up');

  const countObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el     = entry.target;
      const target = parseInt(el.dataset.target, 10);
      const duration = 1200;
      const step   = target / (duration / 16);
      let current  = 0;

      const tick = () => {
        current += step;
        if (current >= target) {
          el.textContent = target;
          return;
        }
        el.textContent = Math.floor(current);
        requestAnimationFrame(tick);
      };

      requestAnimationFrame(tick);
      countObserver.unobserve(el);
    });
  }, { threshold: 0.3 });

  counters.forEach(el => countObserver.observe(el));


  /* ── 4. Pipeline Bar Animations ────────────── */
  const bars = document.querySelectorAll('.pipeline-bar[data-w]');

  const barObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const bar = entry.target;
      // Small delay for staggered feel
      const idx   = [...bars].indexOf(bar);
      setTimeout(() => {
        bar.style.width = bar.dataset.w + '%';
      }, idx * 80);
      barObserver.unobserve(bar);
    });
  }, { threshold: 0.2 });

  bars.forEach(bar => barObserver.observe(bar));


  /* ── 5. Score Fill Animations ──────────────── */
  const fills = document.querySelectorAll('.score-fill[data-score]');

  const fillObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const fill = entry.target;
      setTimeout(() => {
        fill.style.width = fill.dataset.score + '%';
      }, 200);
      fillObserver.unobserve(fill);
    });
  }, { threshold: 0.2 });

  fills.forEach(fill => fillObserver.observe(fill));


  /* ── 6. KPI Card Stagger Entrance ──────────── */
  const kpiCards = document.querySelectorAll('.kpi-card');
  kpiCards.forEach((card, i) => {
    card.style.opacity    = '0';
    card.style.transform  = 'translateY(18px)';
    card.style.transition = `opacity 0.5s ease ${i * 100}ms, transform 0.5s ease ${i * 100}ms`;
    setTimeout(() => {
      card.style.opacity   = '1';
      card.style.transform = 'translateY(0)';
    }, 80 + i * 100);
  });


  /* ── 7. Activity Items Stagger Entrance ─────── */
  const activityItems = document.querySelectorAll('.activity-item');
  const actObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry, idx) => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const i  = [...activityItems].indexOf(el);
      el.style.opacity    = '0';
      el.style.transform  = 'translateX(-10px)';
      el.style.transition = `opacity 0.4s ease ${i * 60}ms, transform 0.4s ease ${i * 60}ms`;
      setTimeout(() => {
        el.style.opacity   = '1';
        el.style.transform = 'translateX(0)';
      }, 50 + i * 60);
      actObserver.unobserve(el);
    });
  }, { threshold: 0.1 });

  activityItems.forEach(item => actObserver.observe(item));


  /* ── 8. Table Row Hover Highlight ──────────── */
  const tableRows = document.querySelectorAll('tbody tr');
  tableRows.forEach(row => {
    row.addEventListener('mouseenter', () => {
      row.style.transition = 'background 0.15s';
    });
  });


  /* ── 9. Notification Button ─────────────────── */
  const notifBtn = document.querySelector('[data-notif]');
  if (notifBtn) {
    notifBtn.addEventListener('click', () => {
      const dot = notifBtn.querySelector('.notif-dot');
      if (dot) dot.style.display = 'none';
      // Could open a dropdown — placeholder for now
      console.log('Notifications clicked');
    });
  }

});