/* ============================================================
   dashboard.js — HR Dashboard Home Page Logic
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {

  /* Stat counter animation */
  document.querySelectorAll('.count-up[data-target]').forEach(el => {
    const target = parseInt(el.dataset.target, 10);
    let cur = 0;
    const inc = Math.max(1, Math.ceil(target / 48));
    const t = setInterval(() => {
      cur = Math.min(cur + inc, target);
      el.textContent = cur.toLocaleString();
      if (cur >= target) clearInterval(t);
    }, 26);
  });

  /* Score bars on scroll */
  const fills = document.querySelectorAll('.score-fill[data-score]');
  if (fills.length) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.style.width = e.target.dataset.score + '%'; io.unobserve(e.target); }
      });
    }, { threshold: 0.2 });
    fills.forEach(f => { f.style.width = '0%'; io.observe(f); });
  }

  /* Quick action card clicks */
  document.querySelectorAll('.qa-card[data-href]').forEach(c => {
    c.addEventListener('click', () => window.location.href = c.dataset.href);
  });

  /* Notification bell */
  document.getElementById('notifBtn')?.addEventListener('click', () => {
    showToast('You have 8 new candidate applications 🔔', 'info');
  });

  /* Chatbot */
  document.querySelector('.chatbot-bubble')?.addEventListener('click', () => {
    showToast('AI Recruiter Assistant launching soon 🤖', 'info');
  });
});
