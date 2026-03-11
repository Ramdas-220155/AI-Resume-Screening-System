/* ============================================================
   profile.js — User Profile Page Logic
   Handles: form save, file upload, password, notif prefs
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  /* ── Edit Profile form ── */
  document.getElementById('editProfileForm')?.addEventListener('submit', function (e) {
    e.preventDefault();
    const btn = this.querySelector('[type="submit"]');
    const orig = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-check"></i> Saved!';
    btn.style.background = 'linear-gradient(135deg,#10b981,#059669)';
    showToast('Profile updated successfully ✓', 'success');
    setTimeout(() => {
      btn.innerHTML = orig;
      btn.style.background = '';
    }, 2600);
  });

  /* ── Password form ── */
  document.getElementById('passwordForm')?.addEventListener('submit', function (e) {
    e.preventDefault();
    const newPwd  = this.querySelector('#newPwd')?.value || '';
    const confPwd = this.querySelector('#confPwd')?.value || '';
    if (!newPwd) { showToast('Please enter a new password', 'error'); return; }
    if (newPwd !== confPwd) { showToast('Passwords do not match', 'error'); return; }
    showToast('Password updated successfully 🔐', 'success');
    this.reset();
    updatePwdStrength('');
  });

  /* ── Password strength indicator ── */
  const newPwdInput = document.getElementById('newPwd');
  newPwdInput?.addEventListener('input', function () {
    updatePwdStrength(this.value);
  });

  function updatePwdStrength(val) {
    const bars  = document.querySelectorAll('.pwd-bar');
    const label = document.getElementById('pwdStrengthText');
    if (!bars.length) return;
    let score = 0;
    if (val.length >= 8)  score++;
    if (/[A-Z]/.test(val)) score++;
    if (/[0-9]/.test(val)) score++;
    if (/[^A-Za-z0-9]/.test(val)) score++;
    const colors = ['', '#ef4444', '#f59e0b', '#3b82f6', '#10b981'];
    const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
    bars.forEach((b, i) => {
      b.classList.toggle('active', i < score);
      if (i < score) b.style.background = colors[score];
      else b.style.background = '';
    });
    if (label) {
      label.textContent = val.length ? labels[score] : '';
      label.style.color = colors[score] || '';
    }
  }

  /* ── Resume file zone ── */
  const fileZone  = document.getElementById('resumeZone');
  const fileInput = document.getElementById('resumeFile');
  const fileInfo  = document.getElementById('resumeInfo');

  fileZone?.addEventListener('click', () => fileInput?.click());
  fileZone?.addEventListener('dragover', e => {
    e.preventDefault();
    fileZone.style.borderColor = 'var(--p1)';
    fileZone.style.background  = 'rgba(124,58,237,0.05)';
  });
  fileZone?.addEventListener('dragleave', () => {
    fileZone.style.borderColor = '';
    fileZone.style.background  = '';
  });
  fileZone?.addEventListener('drop', e => {
    e.preventDefault();
    fileZone.style.borderColor = '';
    fileZone.style.background  = '';
    handleFile(e.dataTransfer.files[0]);
  });
  fileInput?.addEventListener('change', () => handleFile(fileInput.files[0]));

  function handleFile(file) {
    if (!file) return;
    if (fileInfo) {
      fileInfo.innerHTML = `<i class="fa-solid fa-file-pdf" style="color:var(--p1)"></i> ${file.name} (${(file.size/1024).toFixed(0)} KB)`;
    }
    showToast(`Resume "${file.name}" ready to upload`, 'info');
  }

  /* ── Notification prefs save ── */
  document.getElementById('saveNotifBtn')?.addEventListener('click', () => {
    showToast('Notification preferences saved ✓', 'success');
  });

  /* ── Notification bell ── */
  document.getElementById('notifBtn')?.addEventListener('click', () => {
    showToast('You have 3 new notifications 🔔', 'info');
  });

  /* ── Chatbot ── */
  document.querySelector('.chatbot-bubble')?.addEventListener('click', () => {
    showToast('AI assistant launching soon 🤖', 'info');
  });

  /* ── Completeness bar animation ── */
  const fill = document.querySelector('.completeness-fill');
  if (fill) {
    const target = fill.dataset.pct || '82';
    fill.style.width = '0%';
    setTimeout(() => { fill.style.width = target + '%'; }, 300);
  }

});
