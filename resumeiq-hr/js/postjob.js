/* ============================================================
   postjob.js — Post Job Page Logic
   Tag inputs, form submit, AI options
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {

  /* ── Tag input system ── */
  document.querySelectorAll('.tag-wrap').forEach(wrap => {
    const inp = wrap.querySelector('.tag-input-el');
    if (!inp) return;

    function addTag(val) {
      val = val.trim().replace(/,+$/, '').trim();
      if (!val) return;
      const pill = document.createElement('span');
      pill.className = 'tag-pill';
      pill.innerHTML = `${esc(val)}<span class="tag-rm">✕</span>`;
      wrap.insertBefore(pill, inp);
      inp.value = '';
      pill.querySelector('.tag-rm').addEventListener('click', () => pill.remove());
    }

    inp.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(inp.value); }
      if (e.key === 'Backspace' && inp.value === '') {
        const pills = wrap.querySelectorAll('.tag-pill');
        if (pills.length) pills[pills.length - 1].remove();
      }
    });
    inp.addEventListener('blur', () => { if (inp.value.trim()) addTag(inp.value); });
    wrap.addEventListener('click', () => inp.focus());

    if (wrap.dataset.tags) wrap.dataset.tags.split(',').forEach(t => addTag(t));
  });

  function esc(s) { return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  /* ── Form submit ── */
  document.getElementById('postJobForm')?.addEventListener('submit', function(e) {
    e.preventDefault();
    const btn = this.querySelector('[type="submit"]');
    const orig = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-check"></i> <span>Job Posted!</span>';
    btn.style.background = 'linear-gradient(135deg,#10b981,#059669)';
    showToast('Job posted successfully! AI screening enabled. 🎉', 'success');
    setTimeout(() => { btn.innerHTML = orig; btn.style.background = ''; }, 2800);
  });

  /* ── Clear form ── */
  document.getElementById('clearBtn')?.addEventListener('click', () => {
    document.getElementById('postJobForm')?.reset();
    document.querySelectorAll('.tag-pill').forEach(p => p.remove());
    showToast('Form cleared', 'info');
  });

  /* ── Save draft ── */
  document.getElementById('draftBtn')?.addEventListener('click', () => {
    showToast('Draft saved successfully 💾', 'info');
  });

  document.getElementById('notifBtn')?.addEventListener('click', () => {
    showToast('You have 8 new notifications 🔔', 'info');
  });

  document.querySelector('.chatbot-bubble')?.addEventListener('click', () => {
    showToast('AI Recruiter Assistant launching soon 🤖', 'info');
  });
});
