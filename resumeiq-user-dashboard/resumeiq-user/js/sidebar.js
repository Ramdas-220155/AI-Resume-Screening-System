/* ============================================================
   sidebar.js — Shared sidebar open/close logic
   Called by every page after DOM loads
   ============================================================ */

(function () {
  const sidebar    = document.getElementById('sidebar');
  const overlay    = document.getElementById('sbOverlay');
  const openBtn    = document.getElementById('hamburgerBtn');  // ☰ in topbar
  const closeBtn   = document.getElementById('sbCloseBtn');    // ✕ inside sidebar

  if (!sidebar) return;

  /* Open sidebar */
  function openSidebar() {
    sidebar.classList.add('open');
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden'; // prevent scroll behind
  }

  /* Close sidebar */
  function closeSidebar() {
    sidebar.classList.remove('open');
    overlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  /* Toggle on hamburger click */
  if (openBtn)  openBtn.addEventListener('click', openSidebar);

  /* Close on ✕ button inside sidebar */
  if (closeBtn) closeBtn.addEventListener('click', closeSidebar);

  /* Close on overlay click */
  if (overlay)  overlay.addEventListener('click', closeSidebar);

  /* Close on Escape key */
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeSidebar();
  });

  /* ── Mark active nav link ── */
  const currentFile = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link[href]').forEach(link => {
    if (link.getAttribute('href') === currentFile) {
      link.classList.add('active');
    }
  });

  /* ── Logout handler ── */
  document.querySelectorAll('.nav-logout').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      if (confirm('Log out of ResumeIQ?')) {
        if (typeof showToast === 'function') showToast('Logging out…', 'info');
        setTimeout(() => { window.location.href = 'index.html'; }, 900);
      }
    });
  });

})();
