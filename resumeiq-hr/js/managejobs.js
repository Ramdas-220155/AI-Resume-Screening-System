/* ============================================================
   managejobs.js — Manage Jobs Page Logic
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {

  const searchInp = document.getElementById('jobSearch');
  const filterSel = document.getElementById('jobFilter');
  const cards     = document.querySelectorAll('.job-card-item[data-status]');

  function filterJobs() {
    const q = searchInp?.value.toLowerCase() || '';
    const s = filterSel?.value || 'all';
    cards.forEach(c => {
      const matchQ = c.textContent.toLowerCase().includes(q);
      const matchS = s === 'all' || c.dataset.status === s;
      c.style.display = (matchQ && matchS) ? '' : 'none';
    });
  }

  searchInp?.addEventListener('input', filterJobs);
  filterSel?.addEventListener('change', filterJobs);

  /* Delete buttons */
  document.querySelectorAll('.delete-job-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const card = btn.closest('.job-card-item');
      if (card && confirm('Delete this job posting? This cannot be undone.')) {
        card.style.opacity = '0';
        card.style.transform = 'scale(0.92)';
        card.style.transition = '0.3s ease';
        setTimeout(() => card.remove(), 320);
        showToast('Job posting deleted', 'error');
      }
    });
  });

  /* Close/Reopen */
  document.querySelectorAll('.toggle-status-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const isOpen = this.dataset.status === 'open';
      const newStatus = isOpen ? 'Closed' : 'Open';
      showToast(`Job marked as ${newStatus}`, isOpen ? 'error' : 'success');
    });
  });

  document.getElementById('notifBtn')?.addEventListener('click', () => {
    showToast('You have 8 new notifications 🔔', 'info');
  });

  document.querySelector('.chatbot-bubble')?.addEventListener('click', () => {
    showToast('AI Recruiter Assistant launching soon 🤖', 'info');
  });
});
