/* hr-profile.js */
document.addEventListener('DOMContentLoaded', async () => {
  if (!Auth.requireLogin('hr')) return;
  applyIdentityToDOM();
  const res = await ProfileAPI.get();
  if (!res.success) { showToast(res.error||'Failed','error'); return; }
  const p = res.profile;
  function v(sel, val) { const el=document.querySelector(sel); if(el) el.value=val||''; }
  v('#hrName',p.name); v('#hrEmail',p.email); v('#hrPhone',p.phone); v('#hrLocation',p.location); v('#hrCompany',p.company||'');

  document.getElementById('hrProfileForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    const btn=this.querySelector('[type="submit"]'); const orig=btn.innerHTML;
    btn.innerHTML='<i class="fa-solid fa-spinner fa-spin"></i> Saving…'; btn.disabled=true;
    const res=await ProfileAPI.update({name:document.querySelector('#hrName')?.value?.trim(),phone:document.querySelector('#hrPhone')?.value?.trim(),location:document.querySelector('#hrLocation')?.value?.trim(),company:document.querySelector('#hrCompany')?.value?.trim()});
    btn.disabled=false;
    if(res.success){btn.innerHTML='<i class="fa-solid fa-check"></i> Saved!';btn.style.background='linear-gradient(135deg,#10b981,#059669)';showToast('Profile updated ✓','success');localStorage.setItem('riq_name',document.querySelector('#hrName')?.value?.trim()||'');applyIdentityToDOM();setTimeout(()=>{btn.innerHTML=orig;btn.style.background='';},2600);}
    else{btn.innerHTML=orig;showToast(res.error||'Update failed','error');}
  });

  document.getElementById('hrPasswordForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    const btn=this.querySelector('[type="submit"]'); const orig=btn.innerHTML;
    btn.innerHTML='<i class="fa-solid fa-spinner fa-spin"></i>'; btn.disabled=true;
    const res=await ProfileAPI.changePassword(document.querySelector('#hrCurrPwd')?.value,document.querySelector('#hrNewPwd')?.value,document.querySelector('#hrConfPwd')?.value);
    btn.disabled=false; btn.innerHTML=orig;
    if(res.success){showToast('Password updated 🔐','success');this.reset();}else showToast(res.error||'Failed','error');
  });
});
