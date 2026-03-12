/* ============================================================
   settings.js — Settings Page Logic
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {

  /* Settings sidebar tab switching */
  const ssItems    = document.querySelectorAll('.ss-item[data-tab]');
  const ssSections = document.querySelectorAll('.settings-section[data-tab]');

  function switchTab(tab) {
    ssItems.forEach(i => i.classList.toggle('active', i.dataset.tab === tab));
    ssSections.forEach(s => {
      s.style.display = s.dataset.tab === tab ? '' : 'none';
    });
  }

  ssItems.forEach(item => { item.addEventListener('click', () => switchTab(item.dataset.tab)); });

  // Default: first tab
  if (ssItems.length) switchTab(ssItems[0].dataset.tab);

  /* Save buttons */
  document.querySelectorAll('.settings-save-btn').forEach(btn => {
    btn.addEventListener('click', () => showToast('Settings saved ✓', 'success'));
  });

  document.getElementById('notifBtn')?.addEventListener('click', () => {
    showToast('You have 8 new notifications 🔔', 'info');
  });

  document.querySelector('.chatbot-bubble')?.addEventListener('click', () => {
    showToast('AI Recruiter Assistant launching soon 🤖', 'info');
  });
});
