/* ══════════════════════════════════════════════
   THEME TOGGLE
══════════════════════════════════════════════ */
function setTheme(t) {
  document.documentElement.setAttribute('data-theme', t);
  try { localStorage.setItem('riq-theme', t); } catch(e) {}
  document.getElementById('ttDark') .classList.toggle('active', t === 'dark');
  document.getElementById('ttLight').classList.toggle('active', t === 'light');
}

// Restore saved theme on page load
(function () {
  let saved = 'dark';
  try { saved = localStorage.getItem('riq-theme') || 'dark'; } catch(e) {}
  setTheme(saved);
})();

/* ══════════════════════════════════════════════
   TOAST NOTIFICATIONS
══════════════════════════════════════════════ */
function showToast(msg, type = 'info') {
  const wrap = document.getElementById('toastWrap');
  const el   = document.createElement('div');
  el.className = `toast ${type}`;

  const icons  = { success: 'fa-check-circle', danger: 'fa-circle-xmark', info: 'fa-circle-info' };
  const colors = { success: '#34d399',          danger: '#f87171',         info: '#93c5fd'        };

  el.innerHTML = `<i class="fa-solid ${icons[type]}" style="color:${colors[type]}"></i>${msg}`;
  wrap.appendChild(el);
  setTimeout(() => el.remove(), 3200);
}

/* ══════════════════════════════════════════════
   SIDEBAR
══════════════════════════════════════════════ */
const sidebar   = document.getElementById('sidebar');
const sbOverlay = document.getElementById('sbOverlay');

document.getElementById('hamburgerBtn').addEventListener('click', () => {
  sidebar.classList.add('open');
  sbOverlay.classList.add('open');
});
document.getElementById('sbCloseBtn').addEventListener('click', () => {
  sidebar.classList.remove('open');
  sbOverlay.classList.remove('open');
});
sbOverlay.addEventListener('click', () => {
  sidebar.classList.remove('open');
  sbOverlay.classList.remove('open');
});

/* ══════════════════════════════════════════════
   STAT CARD COUNT-UP ANIMATION
══════════════════════════════════════════════ */
document.querySelectorAll('.count-up').forEach(el => {
  const target = +el.dataset.target;
  const step   = 16;
  const dur    = 1200;
  let cur      = 0;
  const inc    = target / (dur / step);

  const timer = setInterval(() => {
    cur = Math.min(cur + inc, target);
    el.textContent = Math.floor(cur);
    if (cur >= target) clearInterval(timer);
  }, step);
});

/* ══════════════════════════════════════════════
   ANIMATE SCORE & PERCENTAGE BARS ON LOAD
══════════════════════════════════════════════ */
requestAnimationFrame(() => setTimeout(() => {
  document.querySelectorAll('.score-fill[data-score]').forEach(el => {
    el.style.width = el.dataset.score + '%';
  });
  document.querySelectorAll('.pct-fill[data-pct]').forEach(el => {
    el.style.width = el.dataset.pct + '%';
  });
}, 200));

/* ══════════════════════════════════════════════
   WORK EXPERIENCE DATA
══════════════════════════════════════════════ */
const expMap = {
  'Priya Kapoor': [
    ['Senior Frontend Developer', 'Zomato · 2022–Present (3 yrs)'],
    ['Frontend Developer',        'Swiggy · 2020–2022 (2 yrs)']
  ],
  'Simran Joshi': [
    ['Lead UX Designer', 'Flipkart · 2023–Present (2 yrs)'],
    ['UX Designer',      'Meesho · 2021–2023 (2 yrs)']
  ],
  'Dev Malhotra': [
    ['Full Stack Engineer', 'CRED · 2021–Present (4 yrs)'],
    ['Backend Developer',   'Paytm · 2019–2021 (2 yrs)']
  ],
  'Riya Kumar': [
    ['ML Engineer',    'Juspay · 2022–Present (3 yrs)'],
    ['Data Scientist', 'Ola · 2020–2022 (2 yrs)']
  ],
  'Rahul Mehra': [
    ['ML Intern → Engineer', 'Fractal Analytics · 2023–Present'],
    ['Data Analyst',         'Infosys · 2022–2023']
  ],
  'Nisha Shah': [
    ['Frontend Developer', 'Freshworks · 2021–Present'],
    ['UI Developer',       'HCL · 2020–2021']
  ],
  'Aryan Verma': [
    ['Trainee Developer', 'TCS · 2024–Present'],
    ['Intern',            'StartupX · 2023']
  ],
};

/* ══════════════════════════════════════════════
   RESUME SIDE PANEL
══════════════════════════════════════════════ */
function openPanel(row) {
  const panel = document.getElementById('resumePanel');
  const ov    = document.getElementById('rpOverlay');
  const name  = row.dataset.name;
  const score = +row.dataset.score;

  // Populate text fields
  document.getElementById('rpName')   .textContent = name;
  document.getElementById('rpRole')   .textContent = row.dataset.role;
  document.getElementById('rpRingPct').textContent = score + '%';
  document.getElementById('rpEmail')  .textContent = row.dataset.email;
  document.getElementById('rpPhone')  .textContent = row.dataset.phone;
  document.getElementById('rpLoc')    .textContent = row.dataset.location;
  document.getElementById('rpExpect') .textContent = row.dataset.expected;
  document.getElementById('rpApplied').textContent = row.dataset.applied;
  document.getElementById('rpExpYrs') .textContent = row.dataset.experience;

  // Skills chips
  document.getElementById('rpSkills').innerHTML = row.dataset.skills
    .split(',')
    .map(s => `<span class="skill-chip">${s.trim()}</span>`)
    .join('');

  // Score breakdown bars
  const sp = +row.dataset.skillPct;
  const ep = +row.dataset.expPct;
  const rp = +row.dataset.resPct;
  const cp = +row.dataset.comPct;

  document.getElementById('rpSkillPct').textContent = sp + '%';
  document.getElementById('rpExpPct')  .textContent = ep + '%';
  document.getElementById('rpResPct')  .textContent = rp + '%';
  document.getElementById('rpComPct')  .textContent = cp + '%';

  // Reset then animate bars
  ['rpSkillBar', 'rpExpBar', 'rpResBar', 'rpComBar'].forEach(id => {
    document.getElementById(id).style.width = '0%';
  });
  requestAnimationFrame(() => setTimeout(() => {
    document.getElementById('rpSkillBar').style.width = sp + '%';
    document.getElementById('rpExpBar')  .style.width = ep + '%';
    document.getElementById('rpResBar')  .style.width = rp + '%';
    document.getElementById('rpComBar')  .style.width = cp + '%';
  }, 80));

  // Score ring animation
  const ring = document.getElementById('rpRingFill');
  const circ = 2 * Math.PI * 45; // circumference ≈ 282.7
  ring.style.strokeDashoffset = circ;
  requestAnimationFrame(() => setTimeout(() => {
    ring.style.strokeDashoffset = circ - (circ * score / 100);
  }, 80));

  // Work experience list
  document.getElementById('rpExpList').innerHTML = (expMap[name] || [])
    .map(([title, co]) =>
      `<div class="rp-exp-item">
        <div class="rp-exp-title">${title}</div>
        <div class="rp-exp-co">${co}</div>
      </div>`
    ).join('');

  // Panel shortlist / reject buttons
  document.getElementById('rpShortlistBtn').onclick = () => {
    const sc = row.querySelector('.status-cell');
    if (sc) sc.innerHTML = '<span class="badge badge-shortlist"><i class="fa-solid fa-check" style="font-size:8px;"></i> Shortlisted</span>';
    showToast(`${name} shortlisted!`, 'success');
  };
  document.getElementById('rpRejectBtn').onclick = () => {
    const sc = row.querySelector('.status-cell');
    if (sc) sc.innerHTML = '<span class="badge badge-rejected">Rejected</span>';
    showToast(`${name} rejected.`, 'danger');
  };

  panel.classList.add('open');
  ov.style.display = 'block';
}

function closePanel() {
  document.getElementById('resumePanel').classList.remove('open');
  document.getElementById('rpOverlay').style.display = 'none';
}

document.getElementById('rpCloseBtn').addEventListener('click', closePanel);
document.getElementById('rpOverlay') .addEventListener('click', closePanel);

// Bind view buttons
document.querySelectorAll('.view-resume-btn').forEach(btn => {
  btn.addEventListener('click', () => openPanel(btn.closest('.cand-row')));
});

/* ══════════════════════════════════════════════
   TABLE — SHORTLIST & REJECT BUTTONS
══════════════════════════════════════════════ */
document.querySelectorAll('.shortlist-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const row = btn.closest('.cand-row');
    const sc  = row.querySelector('.status-cell');
    if (sc) sc.innerHTML = '<span class="badge badge-shortlist"><i class="fa-solid fa-check" style="font-size:8px;"></i> Shortlisted</span>';
    showToast(`${row.dataset.name} shortlisted!`, 'success');
  });
});

document.querySelectorAll('.reject-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const row = btn.closest('.cand-row');
    const sc  = row.querySelector('.status-cell');
    if (sc) sc.innerHTML = '<span class="badge badge-rejected">Rejected</span>';
    showToast(`${row.dataset.name} rejected.`, 'danger');
  });
});

/* ══════════════════════════════════════════════
   SEARCH & FILTER
══════════════════════════════════════════════ */
function filterTable() {
  const q  = document.getElementById('candSearch').value.toLowerCase();
  const sf = document.getElementById('scoreFilter').value;
  const jf = document.getElementById('jobFilter').value;

  document.querySelectorAll('.cand-row').forEach(row => {
    const s   = +row.dataset.score;
    const job = row.dataset.job;
    const txt = (row.dataset.name + row.dataset.role + row.dataset.skills).toLowerCase();

    const matchQ  = txt.includes(q);
    const matchSF = sf === 'all'
      || (sf === 'hi'  && s >= 90)
      || (sf === 'mid' && s >= 70 && s < 90)
      || (sf === 'lo'  && s < 70);
    const matchJF = jf === 'all' || job === jf;

    row.style.display = (matchQ && matchSF && matchJF) ? '' : 'none';
  });
}

document.getElementById('candSearch') .addEventListener('input',  filterTable);
document.getElementById('scoreFilter').addEventListener('change', filterTable);
document.getElementById('jobFilter')  .addEventListener('change', filterTable);

/* ══════════════════════════════════════════════
   EXPORT CSV
══════════════════════════════════════════════ */
document.getElementById('exportBtn').addEventListener('click', () => {
  const rows = [...document.querySelectorAll('.cand-row')]
    .filter(r => r.style.display !== 'none');

  const csv = [
    'Rank,Name,Role,Score,Skill Match %,Experience %',
    ...rows.map((r, i) =>
      `${i + 1},${r.dataset.name},${r.dataset.role},${r.dataset.score}%,${r.dataset.skillPct}%,${r.dataset.expPct}%`
    )
  ].join('\n');

  const a = document.createElement('a');
  a.href     = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
  a.download = 'candidates.csv';
  a.click();
  showToast('CSV exported!', 'success');
});