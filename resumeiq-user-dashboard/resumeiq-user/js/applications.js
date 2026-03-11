/* ============================================================
   applications.js — My Applications Page Logic
   Handles: search, status filter, score animations, counters
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  /* ── Stat counters ── */
  document.querySelectorAll('.count-up[data-target]').forEach(el => {
    const target = parseInt(el.dataset.target, 10);
    let current = 0;
    const inc = Math.max(1, Math.ceil(target / 40));
    const t = setInterval(() => {
      current = Math.min(current + inc, target);
      el.textContent = current;
      if (current >= target) clearInterval(t);
    }, 28);
  });

  /* ── Score bars ── */
  const fills = document.querySelectorAll('.score-fill[data-score]');
  if (fills.length) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.style.width = e.target.dataset.score + '%';
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.1 });
    fills.forEach(f => { f.style.width = '0%'; io.observe(f); });
  }

  /* ── Search + filter ── */
  const searchInput  = document.getElementById('appSearch');
  const statusFilter = document.getElementById('statusFilter');
  const rows         = document.querySelectorAll('tbody tr.app-row');

  function filterApps() {
    const q      = searchInput?.value.toLowerCase() || '';
    const status = statusFilter?.value || 'all';

    rows.forEach(row => {
      const matchQ = row.textContent.toLowerCase().includes(q);
      const matchS = status === 'all' || (row.dataset.status || '') === status;
      row.style.display = (matchQ && matchS) ? '' : 'none';
    });
  }

  searchInput?.addEventListener('input', filterApps);
  statusFilter?.addEventListener('change', filterApps);

  /* ── View detail button ── */
  document.querySelectorAll('.view-app-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      showToast('Application details panel coming soon', 'info');
    });
  });

  /* ── Withdraw button ── */
  document.querySelectorAll('.withdraw-btn').forEach(btn => {
    btn.addEventListener('click', function () {
      const row = this.closest('tr');
      if (row && confirm('Withdraw this application?')) {
        row.style.animation = 'fadeOut 0.3s ease forwards';
        const style = document.createElement('style');
        style.textContent = '@keyframes fadeOut{to{opacity:0;transform:translateX(20px)}}';
        document.head.appendChild(style);
        setTimeout(() => row.remove(), 320);
        showToast('Application withdrawn', 'error');
      }
    });
  });

  /* ── Notification ── */
  document.getElementById('notifBtn')?.addEventListener('click', () => {
    showToast('You have 3 new notifications 🔔', 'info');
  });

  /* ── Chatbot ── */
  document.querySelector('.chatbot-bubble')?.addEventListener('click', () => {
    showToast('AI assistant launching soon 🤖', 'info');
  });

});
