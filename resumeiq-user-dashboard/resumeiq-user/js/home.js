/* ============================================================
   home.js — Dashboard Home Page Logic
   Handles: stat counters, score bars, quick actions, notif
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  /* ── Animated stat counters ── */
  document.querySelectorAll('.count-up[data-target]').forEach(el => {
    const target = parseInt(el.dataset.target, 10);
    let current = 0;
    const inc = Math.max(1, Math.ceil(target / 48));
    const timer = setInterval(() => {
      current = Math.min(current + inc, target);
      el.textContent = current.toLocaleString();
      if (current >= target) clearInterval(timer);
    }, 26);
  });

  /* ── Animate score bars on scroll ── */
  const fills = document.querySelectorAll('.score-fill[data-score]');
  if (fills.length) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.style.width = e.target.dataset.score + '%';
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.2 });
    fills.forEach(f => { f.style.width = '0%'; io.observe(f); });
  }

  /* ── Notification bell ── */
  document.getElementById('notifBtn')?.addEventListener('click', () => {
    showToast('You have 3 new notifications 🔔', 'info');
  });

  /* ── Quick action cards — navigate ── */
  document.querySelectorAll('.qa-card[data-href]').forEach(card => {
    card.addEventListener('click', () => {
      window.location.href = card.dataset.href;
    });
  });

  /* ── Review table action buttons ── */
  document.querySelectorAll('.review-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      showToast('Opening application details…', 'info');
    });
  });

  /* ── Chatbot ── */
  document.querySelector('.chatbot-bubble')?.addEventListener('click', () => {
    showToast('AI assistant launching soon 🤖', 'info');
  });

});
