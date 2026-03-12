/* ============================================================
   jobs.js — Browse Jobs Page Logic
   Handles: search, filter, apply, score animations
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  /* ── Score bar animations ── */
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

  /* ── Search & filter ── */
  const searchInput  = document.getElementById('jobSearch');
  const typeFilter   = document.getElementById('typeFilter');
  const locFilter    = document.getElementById('locFilter');
  const levelFilter  = document.getElementById('levelFilter');
  const cards        = document.querySelectorAll('.job-card[data-title]');
  const resultCount  = document.getElementById('resultCount');

  function filterJobs() {
    const q     = searchInput?.value.toLowerCase() || '';
    const type  = typeFilter?.value  || 'all';
    const loc   = locFilter?.value   || 'all';
    const level = levelFilter?.value || 'all';
    let visible = 0;

    cards.forEach(card => {
      const matchQ = (
        (card.dataset.title   || '').toLowerCase().includes(q) ||
        (card.dataset.company || '').toLowerCase().includes(q) ||
        (card.dataset.skills  || '').toLowerCase().includes(q)
      );
      const matchType  = type  === 'all' || card.dataset.type  === type;
      const matchLoc   = loc   === 'all' || card.dataset.loc   === loc;
      const matchLevel = level === 'all' || card.dataset.level === level;

      const show = matchQ && matchType && matchLoc && matchLevel;
      card.style.display = show ? '' : 'none';
      if (show) visible++;
    });

    if (resultCount) {
      resultCount.textContent = `${visible} job${visible !== 1 ? 's' : ''}`;
    }
  }

  searchInput?.addEventListener('input', filterJobs);
  typeFilter?.addEventListener('change', filterJobs);
  locFilter?.addEventListener('change', filterJobs);
  levelFilter?.addEventListener('change', filterJobs);

  /* ── Apply buttons ── */
  document.querySelectorAll('.apply-btn').forEach(btn => {
    btn.addEventListener('click', function () {
      if (this.classList.contains('applied')) return;
      const title = this.closest('.job-card')?.dataset.title || 'this job';
      this.classList.add('applied');
      this.innerHTML = '<i class="fa-solid fa-check"></i> Applied';
      this.disabled = true;
      showToast(`Successfully applied to "${title}"! 🎉`, 'success');
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
