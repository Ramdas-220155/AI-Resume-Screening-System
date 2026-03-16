/* profile.js — User Profile Page */
document.addEventListener('DOMContentLoaded', async () => {
  if (!Auth.requireLogin('user')) return;
  applyIdentityToDOM();

  const res = await ProfileAPI.get();
  if (!res.success) { showToast(res.error||'Failed to load profile','error'); return; }
  const p = res.profile;

  // Populate
  function s(sel, val) { document.querySelectorAll(sel).forEach(el=>el.textContent=val??''); }
  function v(sel, val) { const el=document.querySelector(sel); if(el) el.value=val||''; }
  function c(sel, val) { const el=document.querySelector(sel); if(el) el.checked=!!val; }

  s('.prof-name', p.name); s('[data-user-name]', p.name);
  s('.prof-role', `${p.role||'Job Seeker'} · ${p.plan||'Free'}`);
  document.querySelectorAll('.prof-av,[data-user-initials]').forEach(el=>el.textContent=p.initials);
  animateCount(document.querySelector('[data-stat="apps"]'), p.stats?.total||0);
  animateCount(document.querySelector('[data-stat="short"]'), p.stats?.shortlisted||0);
  s('[data-contact="phone"]', p.phone||'—');
  s('[data-contact="location"]', p.location||'—');
  s('[data-contact="linkedin"]', p.linkedin||'—');

  const fill = document.querySelector('.completeness-fill');
  if (fill) { fill.style.width='0%'; setTimeout(()=>fill.style.width=p.completeness+'%',300); }
  const cpct = document.getElementById('complPct');
  if (cpct) cpct.textContent = p.completeness+'%';

  const badges = document.getElementById('skillBadges');
  if (badges) badges.innerHTML = (p.skills||[]).map(s=>`<span class="skill-badge">${escHtml(s)}</span>`).join('')||`<span style="font-size:13px;color:var(--clr-muted);">No skills added yet</span>`;

  const ri = document.getElementById('resumeInfo');
  if (ri && p.resume_name) ri.innerHTML=`<i class="fa-solid fa-file-pdf" style="color:var(--p1)"></i> ${escHtml(p.resume_name)}`;

  v('#editName',p.name); v('#editEmail',p.email); v('#editPhone',p.phone);
  v('#editLocation',p.location); v('#editBio',p.bio); v('#editLinkedin',p.linkedin);
  v('#editGithub',p.github); v('#editSkills',(p.skills||[]).join(', '));
  c('#notifNewMatch',p.notif_prefs?.new_match); c('#notifStatus',p.notif_prefs?.status_update);
  c('#notifWeekly',p.notif_prefs?.weekly_digest); c('#notifMarketing',p.notif_prefs?.marketing);

  // Edit profile
  document.getElementById('editProfileForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    const btn=this.querySelector('[type="submit"]'); const orig=btn.innerHTML;
    btn.innerHTML='<i class="fa-solid fa-spinner fa-spin"></i> Saving…'; btn.disabled=true;
    const skills = (document.querySelector('#editSkills')?.value||'').split(',').map(s=>s.trim()).filter(Boolean);
    const data = {name:document.querySelector('#editName')?.value?.trim(),phone:document.querySelector('#editPhone')?.value?.trim(),location:document.querySelector('#editLocation')?.value?.trim(),bio:document.querySelector('#editBio')?.value?.trim(),linkedin:document.querySelector('#editLinkedin')?.value?.trim(),github:document.querySelector('#editGithub')?.value?.trim(),skills};
    const res = await ProfileAPI.update(data);
    btn.disabled=false;
    if (res.success) {
      btn.innerHTML='<i class="fa-solid fa-check"></i> Saved!'; btn.style.background='linear-gradient(135deg,#10b981,#059669)';
      showToast('Profile updated ✓','success');
      localStorage.setItem('riq_name',data.name);
      if(res.initials) localStorage.setItem('riq_init',res.initials);
      applyIdentityToDOM();
      if(badges) badges.innerHTML=skills.map(s=>`<span class="skill-badge">${escHtml(s)}</span>`).join('');
      setTimeout(()=>{btn.innerHTML=orig;btn.style.background='';},2600);
    } else { btn.innerHTML=orig; showToast(res.error||'Update failed','error'); }
  });

  // Password
  document.getElementById('passwordForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    const btn=this.querySelector('[type="submit"]'); const orig=btn.innerHTML;
    btn.innerHTML='<i class="fa-solid fa-spinner fa-spin"></i>'; btn.disabled=true;
    const res = await ProfileAPI.changePassword(document.querySelector('#currPwd')?.value,document.querySelector('#newPwd')?.value,document.querySelector('#confPwd')?.value);
    btn.disabled=false; btn.innerHTML=orig;
    if(res.success){showToast('Password updated 🔐','success');this.reset();updatePwdStrength('');}
    else showToast(res.error||'Failed','error');
  });

  document.getElementById('newPwd')?.addEventListener('input',function(){updatePwdStrength(this.value);});
  function updatePwdStrength(val) {
    const bars=document.querySelectorAll('.pwd-bar'); const lbl=document.getElementById('pwdStrengthText');
    let s=0; if(val.length>=8)s++; if(/[A-Z]/.test(val))s++; if(/[0-9]/.test(val))s++; if(/[^A-Za-z0-9]/.test(val))s++;
    const colors=['','#ef4444','#f59e0b','#3b82f6','#10b981']; const labels=['','Weak','Fair','Good','Strong'];
    bars.forEach((b,i)=>{b.classList.toggle('active',i<s);b.style.background=i<s?colors[s]:'';});
    if(lbl){lbl.textContent=val.length?labels[s]:'';lbl.style.color=colors[s]||'';}
  }

  // Resume upload
  const fz=document.getElementById('resumeZone'); const fi=document.getElementById('resumeFile'); const finfo=document.getElementById('resumeInfo');
  fz?.addEventListener('click',()=>fi?.click());
  fz?.addEventListener('dragover',e=>{e.preventDefault();fz.style.borderColor='var(--p1)';fz.style.background='var(--glass)';});
  fz?.addEventListener('dragleave',()=>{fz.style.borderColor='';fz.style.background='';});
  fz?.addEventListener('drop',e=>{e.preventDefault();fz.style.borderColor='';fz.style.background='';handleFile(e.dataTransfer.files[0]);});
  fi?.addEventListener('change',()=>handleFile(fi.files[0]));

  async function handleFile(file) {
    if(!file) return;
    const ext=file.name.split('.').pop().toLowerCase();
    if(!['pdf','doc','docx'].includes(ext)){showToast('Only PDF, DOC, DOCX allowed','error');return;}
    if(file.size>5*1024*1024){showToast('File too large (max 5 MB)','error');return;}
    if(finfo) finfo.innerHTML=`<i class="fa-solid fa-spinner fa-spin" style="color:var(--p1)"></i> Uploading ${escHtml(file.name)}…`;
    const res=await ProfileAPI.uploadResume(file);
    if(res.success){if(finfo)finfo.innerHTML=`<i class="fa-solid fa-file-pdf" style="color:var(--p1)"></i> ${escHtml(file.name)} <i class="fa-solid fa-check" style="color:#10b981;margin-left:6px;"></i>`;showToast(`Resume uploaded ✓`,'success');}
    else{if(finfo)finfo.innerHTML='';showToast(res.error||'Upload failed','error');}
  }

  // Notif prefs
  document.getElementById('saveNotifBtn')?.addEventListener('click', async () => {
    const prefs={new_match:document.querySelector('#notifNewMatch')?.checked||false,status_update:document.querySelector('#notifStatus')?.checked||false,weekly_digest:document.querySelector('#notifWeekly')?.checked||false,marketing:document.querySelector('#notifMarketing')?.checked||false};
    const res=await ProfileAPI.saveNotifPrefs(prefs);
    if(res.success)showToast('Preferences saved ✓','success'); else showToast(res.error||'Save failed','error');
  });

  document.getElementById('notifBtn')?.addEventListener('click',()=>showToast('No new notifications','info'));
});
