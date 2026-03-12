/* ============================================================
   profile.js — HR Profile Page Logic
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {

  document.getElementById('editProfileForm')?.addEventListener('submit', function(e) {
    e.preventDefault();
    const btn = this.querySelector('[type="submit"]');
    const orig = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-check"></i> Saved!';
    btn.style.background = 'linear-gradient(135deg,#10b981,#059669)';
    showToast('Profile updated successfully ✓', 'success');
    setTimeout(() => { btn.innerHTML = orig; btn.style.background = ''; }, 2600);
  });

  document.getElementById('passwordForm')?.addEventListener('submit', function(e) {
    e.preventDefault();
    const np = this.querySelector('#newPwd')?.value || '';
    const cp = this.querySelector('#confPwd')?.value || '';
    if (!np) { showToast('Please enter a new password', 'error'); return; }
    if (np !== cp) { showToast('Passwords do not match', 'error'); return; }
    showToast('Password updated successfully 🔐', 'success');
    this.reset(); updatePwdStrength('');
  });

  const newPwdInp = document.getElementById('newPwd');
  newPwdInp?.addEventListener('input', function() { updatePwdStrength(this.value); });

  function updatePwdStrength(val) {
    const bars = document.querySelectorAll('.pwd-bar');
    const txt  = document.getElementById('pwdStrengthText');
    let score = 0;
    if (val.length >= 8) score++;
    if (/[A-Z]/.test(val)) score++;
    if (/[0-9]/.test(val)) score++;
    if (/[^A-Za-z0-9]/.test(val)) score++;
    const cols  = ['','#ef4444','#f59e0b','#3b82f6','#10b981'];
    const lbls  = ['','Weak','Fair','Good','Strong'];
    bars.forEach((b, i) => { b.classList.toggle('on', i < score); if (i < score) b.style.background = cols[score]; else b.style.background = ''; });
    if (txt) { txt.textContent = val.length ? lbls[score] : ''; txt.style.color = cols[score] || ''; }
  }

  /* Logo upload */
  const logoZone = document.getElementById('logoZone');
  const logoInp  = document.getElementById('logoInput');
  const logoInfo = document.getElementById('logoInfo');
  logoZone?.addEventListener('click', () => logoInp?.click());
  logoZone?.addEventListener('dragover', e => { e.preventDefault(); logoZone.style.borderColor = 'var(--p1)'; });
  logoZone?.addEventListener('dragleave', () => { logoZone.style.borderColor = ''; });
  logoZone?.addEventListener('drop', e => { e.preventDefault(); logoZone.style.borderColor = ''; handleLogo(e.dataTransfer.files[0]); });
  logoInp?.addEventListener('change', () => handleLogo(logoInp.files[0]));
  function handleLogo(f) { if (!f) return; if (logoInfo) logoInfo.textContent = `📎 ${f.name}`; showToast('Logo ready to upload', 'info'); }

  document.getElementById('saveNotifBtn')?.addEventListener('click', () => {
    showToast('Notification preferences saved ✓', 'success');
  });

  document.getElementById('notifBtn')?.addEventListener('click', () => {
    showToast('You have 8 new notifications 🔔', 'info');
  });

  document.querySelector('.chatbot-bubble')?.addEventListener('click', () => {
    showToast('AI Recruiter Assistant launching soon 🤖', 'info');
  });
});
