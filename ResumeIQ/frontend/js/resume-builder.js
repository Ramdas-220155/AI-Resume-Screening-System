/* resume-builder.js — Resume Builder · ResumeIQ v3.0 */

let expCount = 0, eduCount = 0, projCount = 0, certCount = 0;
let currentZoom = 0.9;
let currentTemplate = 'classic';

document.addEventListener('DOMContentLoaded', async () => {
  if (!Auth.requireLogin('user')) return;
  applyIdentityToDOM();

  // Template selection
  document.querySelectorAll('.rb-tpl-card').forEach(card => {
    card.addEventListener('click', () => {
      document.querySelectorAll('.rb-tpl-card').forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      currentTemplate = card.dataset.tpl;
      updatePreview();
    });
  });

  // Live preview on input
  document.querySelectorAll('.rb-form-panel input, .rb-form-panel textarea').forEach(el => {
    el.addEventListener('input', updatePreview);
  });

  // Load saved resume
  try {
    const res = await ResumeAPI.get();
    if (res.success && res.resume) {
      const r = res.resume;
      currentTemplate = r.template || 'classic';
      document.querySelector(`[data-tpl="${currentTemplate}"]`)?.click();

      // Personal
      const p = r.personal || {};
      setVal('rb-name', p.name); setVal('rb-title', p.title);
      setVal('rb-email', p.email); setVal('rb-phone', p.phone);
      setVal('rb-location', p.location); setVal('rb-linkedin', p.linkedin);
      setVal('rb-github', p.github); setVal('rb-website', p.website);
      setVal('rb-summary', r.summary);
      setVal('rb-skills', (r.skills || []).join(', '));

      (r.experience || []).forEach(ex => addExp(ex));
      (r.education  || []).forEach(ed => addEdu(ed));
      (r.projects   || []).forEach(pr => addProject(pr));
      (r.certifications || []).forEach(c => addCert(c));
    }
  } catch(e) {}

  updatePreview();
  document.querySelector('.rb-preview-scale').style.transform = `scale(${currentZoom})`;
  document.getElementById('zoomPct').textContent = Math.round(currentZoom * 100) + '%';
});

function setVal(id, val) {
  const el = document.getElementById(id);
  if (el) el.value = val || '';
}

function getVal(id) { return (document.getElementById(id)?.value || '').trim(); }

/* ── Accordion ───────────────────────────────────────── */
function toggleAcc(id) {
  const item = document.getElementById(id);
  const body = item.querySelector('.rb-acc-body');
  const isOpen = item.classList.contains('open');
  item.classList.toggle('open', !isOpen);
  body.style.display = isOpen ? 'none' : 'flex';
}

/* ── Dynamic List Builders ───────────────────────────── */
function addExp(data = {}) {
  const id = ++expCount;
  const div = document.createElement('div');
  div.className = 'rb-list-item'; div.id = `exp-${id}`;
  div.innerHTML = `
    <div class="rb-list-item-head">
      <span class="rb-list-item-title">Experience ${id}</span>
      <button class="rb-remove-btn" onclick="removeItem('exp-${id}')"><i class="fa-solid fa-trash-can"></i></button>
    </div>
    <div class="form-row"><div class="form-group"><label class="form-label">Job Title</label><input class="form-input rb-live" value="${esc(data.title||'')}"/></div><div class="form-group"><label class="form-label">Company</label><input class="form-input rb-live" value="${esc(data.company||'')}"/></div></div>
    <div class="form-row"><div class="form-group"><label class="form-label">Start Date</label><input class="form-input rb-live" placeholder="Jan 2023" value="${esc(data.start||'')}"/></div><div class="form-group"><label class="form-label">End Date</label><input class="form-input rb-live" placeholder="Present" value="${esc(data.end||'')}"/></div></div>
    <div class="form-group"><label class="form-label">Description</label><textarea class="form-input form-textarea rb-live" rows="2">${esc(data.desc||'')}</textarea></div>`;
  document.getElementById('experience-list').appendChild(div);
  div.querySelectorAll('.rb-live').forEach(el => el.addEventListener('input', updatePreview));
}

function addEdu(data = {}) {
  const id = ++eduCount;
  const div = document.createElement('div');
  div.className = 'rb-list-item'; div.id = `edu-${id}`;
  div.innerHTML = `
    <div class="rb-list-item-head">
      <span class="rb-list-item-title">Education ${id}</span>
      <button class="rb-remove-btn" onclick="removeItem('edu-${id}')"><i class="fa-solid fa-trash-can"></i></button>
    </div>
    <div class="form-row"><div class="form-group"><label class="form-label">Degree</label><input class="form-input rb-live" value="${esc(data.degree||'')}"/></div><div class="form-group"><label class="form-label">Institution</label><input class="form-input rb-live" value="${esc(data.institution||'')}"/></div></div>
    <div class="form-row"><div class="form-group"><label class="form-label">Year</label><input class="form-input rb-live" placeholder="2020 – 2024" value="${esc(data.year||'')}"/></div><div class="form-group"><label class="form-label">Grade / CGPA</label><input class="form-input rb-live" placeholder="8.5 CGPA" value="${esc(data.grade||'')}"/></div></div>`;
  document.getElementById('education-list').appendChild(div);
  div.querySelectorAll('.rb-live').forEach(el => el.addEventListener('input', updatePreview));
}

function addProject(data = {}) {
  const id = ++projCount;
  const div = document.createElement('div');
  div.className = 'rb-list-item'; div.id = `proj-${id}`;
  div.innerHTML = `
    <div class="rb-list-item-head">
      <span class="rb-list-item-title">Project ${id}</span>
      <button class="rb-remove-btn" onclick="removeItem('proj-${id}')"><i class="fa-solid fa-trash-can"></i></button>
    </div>
    <div class="form-row"><div class="form-group"><label class="form-label">Project Name</label><input class="form-input rb-live" value="${esc(data.name||'')}"/></div><div class="form-group"><label class="form-label">Tech Stack</label><input class="form-input rb-live" placeholder="React, Node.js…" value="${esc(data.tech||'')}"/></div></div>
    <div class="form-group"><label class="form-label">Description</label><textarea class="form-input form-textarea rb-live" rows="2">${esc(data.desc||'')}</textarea></div>
    <div class="form-group"><label class="form-label">Link (optional)</label><input class="form-input rb-live" placeholder="github.com/..." value="${esc(data.link||'')}"/></div>`;
  document.getElementById('projects-list').appendChild(div);
  div.querySelectorAll('.rb-live').forEach(el => el.addEventListener('input', updatePreview));
}

function addCert(data = {}) {
  const id = ++certCount;
  const div = document.createElement('div');
  div.className = 'rb-list-item'; div.id = `cert-${id}`;
  div.innerHTML = `
    <div class="rb-list-item-head">
      <span class="rb-list-item-title">Certification ${id}</span>
      <button class="rb-remove-btn" onclick="removeItem('cert-${id}')"><i class="fa-solid fa-trash-can"></i></button>
    </div>
    <div class="form-row"><div class="form-group"><label class="form-label">Certification Name</label><input class="form-input rb-live" value="${esc(data.name||'')}"/></div><div class="form-group"><label class="form-label">Issuer</label><input class="form-input rb-live" value="${esc(data.issuer||'')}"/></div></div>
    <div class="form-group"><label class="form-label">Date</label><input class="form-input rb-live" placeholder="Mar 2024" value="${esc(data.date||'')}"/></div>`;
  document.getElementById('certs-list').appendChild(div);
  div.querySelectorAll('.rb-live').forEach(el => el.addEventListener('input', updatePreview));
}

function removeItem(id) {
  document.getElementById(id)?.remove();
  updatePreview();
}

function esc(str) {
  return String(str||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

/* ── Collect Data ────────────────────────────────────── */
function collectData() {
  const getListItems = (listId, fields) => {
    const items = [];
    document.querySelectorAll(`#${listId} .rb-list-item`).forEach(item => {
      const inputs = item.querySelectorAll('.rb-live');
      const obj = {};
      fields.forEach((f, i) => { obj[f] = inputs[i]?.value?.trim() || ''; });
      items.push(obj);
    });
    return items;
  };

  return {
    template: currentTemplate,
    personal: {
      name: getVal('rb-name'), title: getVal('rb-title'),
      email: getVal('rb-email'), phone: getVal('rb-phone'),
      location: getVal('rb-location'), linkedin: getVal('rb-linkedin'),
      github: getVal('rb-github'), website: getVal('rb-website'),
    },
    summary: getVal('rb-summary'),
    skills: getVal('rb-skills').split(',').map(s => s.trim()).filter(Boolean),
    experience: getListItems('experience-list', ['title','company','start','end','desc']),
    education:  getListItems('education-list',  ['degree','institution','year','grade']),
    projects:   getListItems('projects-list',   ['name','tech','desc','link']),
    certifications: getListItems('certs-list',  ['name','issuer','date']),
  };
}

/* ── Live Preview ────────────────────────────────────── */
function updatePreview() {
  const d = collectData();
  const p = d.personal;
  const preview = document.getElementById('resumePreview');
  preview.className = `resume-doc resume-${currentTemplate}`;

  if (currentTemplate === 'classic') preview.innerHTML = buildClassic(d);
  else if (currentTemplate === 'modern') preview.innerHTML = buildModern(d);
  else preview.innerHTML = buildMinimal(d);
}

function contactRow(p) {
  const items = [];
  if (p.email)    items.push(`<span><i class="fa-solid fa-envelope" style="color:#0d9488"></i>${p.email}</span>`);
  if (p.phone)    items.push(`<span><i class="fa-solid fa-phone" style="color:#0d9488"></i>${p.phone}</span>`);
  if (p.location) items.push(`<span><i class="fa-solid fa-location-dot" style="color:#0d9488"></i>${p.location}</span>`);
  if (p.linkedin) items.push(`<span><i class="fa-brands fa-linkedin" style="color:#0d9488"></i>${p.linkedin}</span>`);
  if (p.github)   items.push(`<span><i class="fa-brands fa-github" style="color:#0d9488"></i>${p.github}</span>`);
  return items.join('');
}

function buildClassic(d) {
  const p = d.personal;
  let html = `<div class="rv-header">
    <div class="rv-name">${p.name || 'Your Name'}</div>
    ${p.title ? `<div class="rv-title">${p.title}</div>` : ''}
    <div class="rv-contact">${contactRow(p)}</div>
  </div>`;
  if (d.summary) html += `<div class="rv-section-title">Professional Summary</div><div class="rv-summary">${d.summary}</div>`;
  if (d.experience.length) {
    html += `<div class="rv-section-title">Work Experience</div>`;
    d.experience.forEach(e => { if (!e.title && !e.company) return;
      html += `<div class="rv-item"><div class="rv-item-head"><div><div class="rv-item-title">${e.title||''}</div><div class="rv-item-sub">${e.company||''}</div></div><div class="rv-item-date">${e.start||''}${e.end?' – '+e.end:''}</div></div>${e.desc?`<div class="rv-item-desc">${e.desc}</div>`:''}</div>`;
    });
  }
  if (d.education.length) {
    html += `<div class="rv-section-title">Education</div>`;
    d.education.forEach(e => { if (!e.degree) return;
      html += `<div class="rv-item"><div class="rv-item-head"><div><div class="rv-item-title">${e.degree}</div><div class="rv-item-sub">${e.institution||''}</div></div><div class="rv-item-date">${e.year||''}${e.grade?' · '+e.grade:''}</div></div></div>`;
    });
  }
  if (d.skills.length) html += `<div class="rv-section-title">Skills</div><div class="rv-skills">${d.skills.map(s=>`<span class="rv-skill-tag">${s}</span>`).join('')}</div>`;
  if (d.projects.length) {
    html += `<div class="rv-section-title">Projects</div>`;
    d.projects.forEach(pr => { if (!pr.name) return;
      html += `<div class="rv-item"><div class="rv-item-head"><div><div class="rv-item-title">${pr.name}</div><div class="rv-item-sub">${pr.tech||''}</div></div></div>${pr.desc?`<div class="rv-item-desc">${pr.desc}</div>`:''}</div>`;
    });
  }
  if (d.certifications.length) {
    html += `<div class="rv-section-title">Certifications</div>`;
    d.certifications.forEach(c => { if (!c.name) return;
      html += `<div class="rv-item"><div class="rv-item-head"><div class="rv-item-title">${c.name}</div><div class="rv-item-date">${c.issuer||''}${c.date?' · '+c.date:''}</div></div></div>`;
    });
  }
  return html;
}

function buildModern(d) {
  const p = d.personal;
  const contactItems = [
    p.email    && `<div class="rv-contact-item"><i class="fa-solid fa-envelope"></i>${p.email}</div>`,
    p.phone    && `<div class="rv-contact-item"><i class="fa-solid fa-phone"></i>${p.phone}</div>`,
    p.location && `<div class="rv-contact-item"><i class="fa-solid fa-location-dot"></i>${p.location}</div>`,
    p.linkedin && `<div class="rv-contact-item"><i class="fa-brands fa-linkedin"></i>${p.linkedin}</div>`,
    p.github   && `<div class="rv-contact-item"><i class="fa-brands fa-github"></i>${p.github}</div>`,
  ].filter(Boolean).join('');

  let sidebar = `<div class="rv-name">${p.name||'Your Name'}</div>
    <div class="rv-title">${p.title||''}</div>
    <div class="rv-sb-section">Contact</div>${contactItems}`;
  if (d.skills.length) {
    sidebar += `<div class="rv-sb-section">Skills</div>`;
    d.skills.forEach(s => { sidebar += `<div class="rv-skill-bar"><div class="rv-skill-name">${s}</div><div class="rv-skill-track"><div class="rv-skill-fill"></div></div></div>`; });
  }

  let main = '';
  if (d.summary) main += `<div class="rv-section-title">About Me</div><div class="rv-summary">${d.summary}</div>`;
  if (d.experience.length) {
    main += `<div class="rv-section-title">Experience</div>`;
    d.experience.forEach(e => { if (!e.title) return;
      main += `<div style="margin-bottom:14px"><div class="rv-item-title">${e.title}</div><div class="rv-item-sub">${e.company||''}</div><div class="rv-item-date">${e.start||''}${e.end?' – '+e.end:''}</div>${e.desc?`<div class="rv-item-desc">${e.desc}</div>`:''}</div>`;
    });
  }
  if (d.education.length) {
    main += `<div class="rv-section-title">Education</div>`;
    d.education.forEach(e => { if (!e.degree) return;
      main += `<div style="margin-bottom:10px"><div class="rv-item-title">${e.degree}</div><div class="rv-item-sub">${e.institution||''}</div><div class="rv-item-date">${e.year||''}${e.grade?' · '+e.grade:''}</div></div>`;
    });
  }
  if (d.projects.length) {
    main += `<div class="rv-section-title">Projects</div>`;
    d.projects.forEach(pr => { if (!pr.name) return;
      main += `<div style="margin-bottom:10px"><div class="rv-item-title">${pr.name}</div><div class="rv-item-sub">${pr.tech||''}</div>${pr.desc?`<div class="rv-item-desc">${pr.desc}</div>`:''}</div>`;
    });
  }
  return `<div class="rv-sidebar">${sidebar}</div><div class="rv-main">${main}</div>`;
}

function buildMinimal(d) {
  const p = d.personal;
  let html = `<div class="rv-header">
    <div class="rv-name">${p.name||'Your Name'}</div>
    ${p.title?`<div class="rv-title">${p.title}</div>`:''}
    <div class="rv-contact">${contactRow(p)}</div>
  </div><hr class="rv-divider"/>`;
  if (d.summary) html += `<div class="rv-section-title">Summary</div><div class="rv-summary" style="margin-bottom:16px">${d.summary}</div><hr class="rv-divider"/>`;
  if (d.experience.length) {
    html += `<div class="rv-section-title">Experience</div>`;
    d.experience.forEach(e => { if (!e.title) return;
      html += `<div style="margin-bottom:12px"><span class="rv-item-date">${e.start||''}${e.end?' – '+e.end:''}</span><div class="rv-item-title">${e.title}</div><div class="rv-item-sub">${e.company||''}</div>${e.desc?`<div class="rv-item-desc">${e.desc}</div>`:''}</div>`;
    });
    html += `<hr class="rv-divider"/>`;
  }
  if (d.education.length) {
    html += `<div class="rv-section-title">Education</div>`;
    d.education.forEach(e => { if (!e.degree) return;
      html += `<div style="margin-bottom:10px"><span class="rv-item-date">${e.year||''}</span><div class="rv-item-title">${e.degree}</div><div class="rv-item-sub">${e.institution||''}${e.grade?' · '+e.grade:''}</div></div>`;
    });
    html += `<hr class="rv-divider"/>`;
  }
  if (d.skills.length) html += `<div class="rv-section-title">Skills</div><div class="rv-skills">${d.skills.map(s=>`<span class="rv-skill-tag">${s}</span>`).join('')}</div>`;
  if (d.projects.length) {
    html += `<hr class="rv-divider"/><div class="rv-section-title">Projects</div>`;
    d.projects.forEach(pr => { if (!pr.name) return;
      html += `<div style="margin-bottom:10px"><div class="rv-item-title">${pr.name}<span style="font-size:11px;color:#9ca3af;margin-left:8px">${pr.tech||''}</span></div>${pr.desc?`<div class="rv-item-desc">${pr.desc}</div>`:''}</div>`;
    });
  }
  return html;
}

/* ── Zoom ────────────────────────────────────────────── */
function zoomPreview(delta) {
  currentZoom = Math.min(1.2, Math.max(0.5, currentZoom + delta));
  document.querySelector('.rb-preview-scale').style.transform = `scale(${currentZoom})`;
  document.getElementById('zoomPct').textContent = Math.round(currentZoom * 100) + '%';
}

/* ── Save ────────────────────────────────────────────── */
async function saveResume() {
  const data = collectData();
  const res = await ResumeAPI.save(data);
  if (res.success) showToast('Resume saved ✓', 'success');
  else showToast(res.error || 'Save failed', 'error');
}

/* ── Download PDF ────────────────────────────────────── */
function downloadPDF() {
  const d = collectData();
  updatePreview();
  const preview = document.getElementById('resumePreview').cloneNode(true);
  preview.style.transform = '';

  const win = window.open('', '_blank');
  win.document.write(`<!DOCTYPE html><html><head>
    <meta charset="UTF-8"/>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet"/>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css"/>
    <style>
      *{box-sizing:border-box;margin:0;padding:0}
      body{font-family:'Plus Jakarta Sans',sans-serif;background:#fff}
      @page{size:A4;margin:0}
      @media print{body{margin:0}}
    </style>
    <style>${getAllResumeCSS()}</style>
    </head><body>${preview.outerHTML}
    <script>window.onload=()=>{window.print();window.onafterprint=()=>window.close()}<\/script>
    </body></html>`);
  win.document.close();
}

function getAllResumeCSS() {
  const sheets = Array.from(document.styleSheets);
  let css = '';
  sheets.forEach(sheet => {
    try { Array.from(sheet.cssRules).forEach(rule => { css += rule.cssText + '\n'; }); }
    catch(e) {}
  });
  return css;
}

/* ── Download TXT ────────────────────────────────────── */
function downloadTXT() {
  const d = collectData();
  const p = d.personal;
  let txt = '';
  const line = (t='') => txt += t + '\n';
  const section = t => { line(); line('═'.repeat(50)); line(t.toUpperCase()); line('═'.repeat(50)); };

  line(p.name || 'Name'); line(p.title || '');
  const contact = [p.email, p.phone, p.location, p.linkedin, p.github].filter(Boolean);
  line(contact.join(' | ')); line('─'.repeat(50));

  if (d.summary) { section('Summary'); line(d.summary); }
  if (d.experience.length) { section('Experience'); d.experience.forEach(e => { line(`${e.title} — ${e.company}`); line(`${e.start}${e.end?' – '+e.end:''}`); if(e.desc) line(e.desc); line(); }); }
  if (d.education.length) { section('Education'); d.education.forEach(e => { line(`${e.degree} — ${e.institution}`); line(`${e.year}${e.grade?' · '+e.grade:''}`); line(); }); }
  if (d.skills.length) { section('Skills'); line(d.skills.join(', ')); }
  if (d.projects.length) { section('Projects'); d.projects.forEach(pr => { line(`${pr.name} (${pr.tech})`); if(pr.desc) line(pr.desc); if(pr.link) line(pr.link); line(); }); }
  if (d.certifications.length) { section('Certifications'); d.certifications.forEach(c => { line(`${c.name} — ${c.issuer} (${c.date})`); }); }

  const blob = new Blob([txt], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = `${p.name||'Resume'}.txt`; a.click();
  URL.revokeObjectURL(url);
  showToast('TXT downloaded ✓', 'success');
}

/* ── Send Email ──────────────────────────────────────── */
async function sendEmail() {
  const to = document.getElementById('shareEmail')?.value?.trim();
  const subject = document.getElementById('shareSubject')?.value?.trim() || 'My Resume';
  if (!to) { showToast('Enter recipient email', 'error'); return; }

  const btn = document.querySelector('#emailModal .btn-primary');
  const orgText = btn.innerHTML;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Sending...';
  btn.disabled = true;

  const html = document.getElementById('resumePreview').innerHTML;
  const res = await ResumeAPI.sendEmail({ to_email: to, subject, html_content: html });

  btn.innerHTML = orgText;
  btn.disabled = false;

  if (res.success) {
    showToast(`Resume sent to ${to} ✓`, 'success');
    document.getElementById('emailModal').classList.remove('open');
  } else {
    showToast(res.error || 'Failed to send', 'error');
  }
}
