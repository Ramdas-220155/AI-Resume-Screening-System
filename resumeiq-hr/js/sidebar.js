/* ============================================================
   sidebar.js — HR Sidebar Toggle + Active Nav + Logout
   ============================================================ */
(function () {
  const sidebar  = document.getElementById('sidebar');
  const overlay  = document.getElementById('sbOverlay');
  const openBtn  = document.getElementById('hamburgerBtn');
  const closeBtn = document.getElementById('sbCloseBtn');
  if (!sidebar) return;

  function open()  { sidebar.classList.add('open');    overlay.classList.add('active');    document.body.style.overflow = 'hidden'; }
  function close() { sidebar.classList.remove('open'); overlay.classList.remove('active'); document.body.style.overflow = ''; }

  openBtn?.addEventListener('click', open);
  closeBtn?.addEventListener('click', close);
  overlay?.addEventListener('click', close);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });

  /* Active nav link */
  const file = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link[href]').forEach(a => {
    if (a.getAttribute('href') === file) a.classList.add('active');
  });

  /* Logout */
  document.querySelectorAll('.nav-logout').forEach(b => {
    b.addEventListener('click', e => {
      e.preventDefault();
      if (confirm('Log out of HR Dashboard?')) {
        if (typeof showToast === 'function') showToast('Logging out…','info');
        setTimeout(() => window.location.href = 'index.html', 900);
      }
    });
  });
})();
