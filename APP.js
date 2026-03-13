/* ═══════════════════════════════════════════
   app.js — ResumeIQ Main Script
═══════════════════════════════════════════ */

/* ═══ STATE ═══ */
let jobPostings = [
  {id:1,title:'Full-Stack Developer',dept:'Engineering',loc:'Hyderabad',type:'Full-time',exp:'2-4 years',deadline:'2026-04-30',
   desc:'We are looking for a talented Full-Stack Developer to join our growing engineering team. You will build and maintain scalable web applications, collaborate with product and design teams, and contribute to our AI-powered hiring platform.',
   skills:['React','Node.js','Python','SQL','Docker'],
   reqs:'• B.Tech/M.Tech in CS or related field\n• Strong problem-solving skills\n• Experience with REST APIs\n• Agile methodology experience',
   sal:'₹8-14 LPA',status:'Open',postedBy:'HR Admin',applicants:[]},
  {id:2,title:'Data Analyst',dept:'Analytics',loc:'Remote',type:'Full-time',exp:'1-3 years',deadline:'2026-04-15',
   desc:'Join our analytics team to extract insights from hiring data, build dashboards and help HR teams make data-driven decisions using our AI screening platform.',
   skills:['Python','SQL','Tableau','Excel','Statistics'],
   reqs:'• Degree in Statistics, Math or CS\n• Experience with data visualisation\n• Strong analytical mindset',
   sal:'₹6-10 LPA',status:'Open',postedBy:'HR Admin',applicants:[]},
  {id:3,title:'UI/UX Designer',dept:'Design',loc:'Bangalore',type:'Contract',exp:'1-2 years',deadline:'2026-03-31',
   desc:'Design beautiful, intuitive interfaces for our HR and job seeker portals. Work closely with engineers to create pixel-perfect, accessible user experiences.',
   skills:['Figma','Adobe XD','CSS','User Research','Prototyping'],
   reqs:'• Portfolio of previous work required\n• Experience with design systems\n• Mobile-first design approach',
   sal:'₹5-8 LPA',status:'Open',postedBy:'HR Admin',applicants:[]}
];

let candidateSubmissions = [
  {id:1,name:'Priya Sharma',email:'priya@email.com',jobId:1,jobTitle:'Full-Stack Developer',score:94,skills:96,exp:91,edu:93,file:'priya_resume.pdf',status:'Shortlisted',appliedOn:'2026-03-05'},
  {id:2,name:'Arun Kumar',email:'arun@email.com',jobId:2,jobTitle:'Data Analyst',score:76,skills:72,exp:80,edu:74,file:'arun_cv.pdf',status:'On Hold',appliedOn:'2026-03-06'},
  {id:3,name:'Sita Devi',email:'sita@email.com',jobId:1,jobTitle:'Full-Stack Developer',score:89,skills:91,exp:85,edu:88,file:'sita_resume.pdf',status:'Shortlisted',appliedOn:'2026-03-07'},
  {id:4,name:'Rahul Nair',email:'rahul@email.com',jobId:3,jobTitle:'UI/UX Designer',score:52,skills:48,exp:56,edu:51,file:'rahul_cv.pdf',status:'Rejected',appliedOn:'2026-03-07'},
  {id:5,name:'Meena Reddy',email:'meena@email.com',jobId:2,jobTitle:'Data Analyst',score:91,skills:93,exp:88,edu:90,file:'meena_resume.pdf',status:'Shortlisted',appliedOn:'2026-03-08'},
  {id:6,name:'Vijay Singh',email:'vijay@email.com',jobId:1,jobTitle:'Full-Stack Developer',score:68,skills:64,exp:70,edu:67,file:'vijay_cv.pdf',status:'On Hold',appliedOn:'2026-03-08'},
];

let myApplications = [];
let currentJobId = null;
let applyFile = null;
let ROLE = 'hr';
let mailCandId = null;

/* ═══════════════════════════════════════════
   TICKER
═══════════════════════════════════════════ */
const TICKERS = [
  {text:'ResumeIQ just screened 500+ resumes for TechCorp in under 60 seconds',hi:'TechCorp'},
  {text:'New: HR can now post jobs directly and candidates apply through the portal'},
  {text:'AI match accuracy improved to 97.4% after latest model update',hi:'97.4%'},
  {text:'Welcome to ResumeIQ — the smartest resume screening platform of 2026'},
  {text:'InfoSys HR team shortlisted 12 candidates from 340 applications',hi:'InfoSys HR'},
  {text:'Privacy Update: All candidate data is AES-256 encrypted and GDPR compliant'},
  {text:'Over 2 million resumes screened across 50,000+ companies',hi:'2 million resumes'},
  {text:'ResumeIQ v4.0 — HR job posting and live candidate score dashboard now live!'},
];

(function initTicker(){
  const track = document.getElementById('tickerTrack');
  if (!track) return;
  [...TICKERS, ...TICKERS].forEach(item => {
    const el = document.createElement('div');
    el.className = 'ticker-item';
    const html = item.hi
      ? item.text.replace(item.hi, `<span class="ticker-hi">${item.hi}</span>`)
      : item.text;
    el.innerHTML = `<span class="ticker-dot"></span>${html}`;
    track.appendChild(el);
  });
})();

/* ═══════════════════════════════════════════
   JOBS SCROLL STRIP
═══════════════════════════════════════════ */
const SCROLL_JOBS = [
  {title:'Full-Stack Developer',loc:'Hyderabad'},{title:'Data Analyst',loc:'Remote'},
  {title:'UI/UX Designer',loc:'Bangalore'},{title:'Python Developer',loc:'Chennai'},
  {title:'Product Manager',loc:'Mumbai'},{title:'DevOps Engineer',loc:'Pune'},
  {title:'ML Engineer',loc:'Hyderabad'},{title:'HR Business Partner',loc:'Delhi'},
  {title:'React Developer',loc:'Bangalore'},{title:'Business Analyst',loc:'Kolkata'},
];

(function initJobsScroll(){
  const track = document.getElementById('jobsScrollTrack');
  if (!track) return;
  [...SCROLL_JOBS, ...SCROLL_JOBS].forEach(j => {
    const el = document.createElement('div');
    el.className = 'job-scroll-pill';
    el.innerHTML = `<span class="jp-dot"></span><strong>${j.title}</strong><span class="jp-loc">· ${j.loc}</span>`;
    track.appendChild(el);
  });
})();

/* ═══════════════════════════════════════════
   TOAST
═══════════════════════════════════════════ */
let toastTimer;
function toast(msg) {
  const el = document.getElementById('toastEl');
  el.innerHTML = msg;
  el.classList.remove('hidden');
  el.style.animation = 'none';
  void el.offsetWidth;
  el.style.animation = 'toastIn .4s cubic-bezier(.34,1.56,.64,1) both';
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.add('hidden'), 3500);
}

/* ═══════════════════════════════════════════
   LANDING NAV
═══════════════════════════════════════════ */
function showSec(name) {
  document.querySelectorAll('.page-section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(n => n.classList.remove('active'));
  const s = document.getElementById('sec-' + name);
  if (s) s.classList.add('active');
  const n = document.getElementById('nl-' + name);
  if (n) n.classList.add('active');
  window.scrollTo({top: 36, behavior: 'smooth'});
}

function contactSubmit(e) {
  e.preventDefault();
  toast("Message sent! We'll reply within 24 hours.");
  e.target.reset();
}

/* ═══════════════════════════════════════════
   MODALS — CHOICE & AUTH
═══════════════════════════════════════════ */
function openChoice() {
  document.getElementById('choiceOverlay').classList.add('active');
}
function closeChoice() {
  document.getElementById('choiceOverlay').classList.remove('active');
}

function openAuth(mode, role) {
  closeChoice();
  ROLE = role || 'hr';
  const isHR = ROLE === 'hr';

  const top = document.getElementById('authModalTop');
  top.className = 'am-top ' + (isHR ? 'hr-theme' : 'user-theme');
  document.getElementById('authTitle').textContent = mode === 'login'
    ? (isHR ? 'HR Login' : 'Job Seeker Login')
    : (isHR ? 'HR Sign Up' : 'Create Account');
  document.getElementById('authSub').textContent = mode === 'login'
    ? (isHR ? 'Sign in to the HR portal' : 'Sign in to your job seeker portal')
    : (isHR ? 'Create your HR account' : 'Start your job search journey');

  ['roleBadge','roleBadgeS'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.className = 'role-badge ' + (isHR ? 'rb-hr' : 'rb-user');
    el.innerHTML = isHR ? '&#128188; HR Portal' : '&#129489; Job Seeker Portal';
  });

  const ib = document.getElementById('infoBox');
  ib.className = 'info-box ' + (isHR ? 'hr-info' : 'user-info');
  document.getElementById('infoText').textContent = isHR
    ? 'Post jobs, upload candidate resumes, view AI scores and shortlist candidates from your dashboard.'
    : 'Browse jobs posted by HR teams, upload your resume and get instant AI match scores.';

  document.getElementById('loginSubmitBtn').className = 'form-sub ' + (isHR ? 'hr-btn' : 'user-btn');
  document.getElementById('signupSubmitBtn').className = 'form-sub ' + (isHR ? 'hr-btn' : 'user-btn');
  document.querySelectorAll('.fi2').forEach(el => { el.classList.toggle('hr-focus', isHR); });
  document.getElementById('orgField').style.display = isHR ? 'block' : 'none';

  switchTab(mode);
  document.getElementById('authOverlay').classList.add('active');
}

function closeAuthM() {
  document.getElementById('authOverlay').classList.remove('active');
}

function switchTab(type) {
  const isL = type === 'login';
  document.getElementById('tabLogin').classList.toggle('active', isL);
  document.getElementById('tabSignup').classList.toggle('active', !isL);
  document.getElementById('loginForm').classList.toggle('hidden', !isL);
  document.getElementById('signupForm').classList.toggle('hidden', isL);
}

function handleLoginSubmit(e)  { e.preventDefault(); doLogin(); }
function handleSignupSubmit(e) { e.preventDefault(); doLogin(); }

/* ═══════════════════════════════════════════
   LOGIN / LOGOUT
═══════════════════════════════════════════ */
function doLogin() {
  closeAuthM();
  const isHR = ROLE === 'hr';

  document.getElementById('landing').style.display = 'none';
  const dash = document.getElementById('dashboard');
  dash.classList.add('active');
  document.body.classList.toggle('hr-dash', isHR);

  document.getElementById('dbTopbar').className  = 'db-topbar ' + (isHR ? 'hr-bar' : 'user-bar');
  document.getElementById('dbBurger').className  = 'db-burger ' + (isHR ? 'hr-burger' : 'user-burger');
  document.getElementById('dbIQSpan').className  = isHR ? 'iq-hr' : 'iq-user';
  document.getElementById('dbRoleTag').textContent = isHR ? 'HR Portal' : 'Job Seeker';
  document.getElementById('dbRoleTag').className = 'db-rtag ' + (isHR ? 'rtag-hr' : 'rtag-user');
  document.getElementById('dbUsername').textContent = isHR ? 'HR Admin' : 'Job Seeker';

  const pc = document.getElementById('dbPCirc');
  pc.textContent = isHR ? 'H' : 'U';
  pc.className = 'db-pcirc ' + (isHR ? 'hr-circ' : 'user-circ');

  document.getElementById('dbSidebar').className = 'db-sidebar ' + (isHR ? 'hr-side' : 'user-side');
  document.getElementById('hrSide').classList.toggle('hidden', !isHR);
  document.getElementById('userSide').classList.toggle('hidden', isHR);
  document.getElementById('hrPages').classList.toggle('hidden', !isHR);
  document.getElementById('userPages').classList.toggle('hidden', isHR);

  document.querySelectorAll('.db-page').forEach(p => p.classList.remove('active'));
  document.getElementById(isHR ? 'hr-home' : 'user-home').classList.add('active');
  document.querySelectorAll('.sbi').forEach(b => b.classList.remove('active'));
  const firstBtn = document.querySelector('#' + (isHR ? 'hrSide' : 'userSide') + ' .sbi');
  if (firstBtn) firstBtn.classList.add('active');

  if (isHR) {
    animNum('s1', 48);
    animNum('s2', 12);
    animNum('s3', jobPostings.filter(j => j.status === 'Open').length);
    setTimeout(() => { document.getElementById('s4').textContent = '83%'; }, 600);
    renderHRJobsList();
    renderCandidates();
  } else {
    renderUserJobs();
    renderUserApps();
    updateUserStats();
  }
  toast(isHR ? 'HR portal loaded.' : 'Welcome! Browse jobs and apply.');
}

function animNum(id, target) {
  let n = 0;
  const el = document.getElementById(id);
  if (!el) return;
  const t = setInterval(() => {
    n += Math.ceil(target / 25);
    if (n >= target) { el.textContent = target; clearInterval(t); }
    else el.textContent = n;
  }, 40);
}

function doLogout() {
  document.getElementById('dashboard').classList.remove('active');
  document.getElementById('landing').style.display = 'block';
  document.body.classList.remove('hr-dash');
  myApplications = [];
  toast('Logged out successfully.');
}

/* ═══════════════════════════════════════════
   DASHBOARD NAV
═══════════════════════════════════════════ */
function navTo(page) {
  const isHR = !document.getElementById('hrPages').classList.contains('hidden');
  const prefix = isHR ? 'hr' : 'user';
  const sideId = isHR ? 'hrSide' : 'userSide';

  document.querySelectorAll('#' + sideId + ' .sbi').forEach(i => i.classList.remove('active'));
  const items = Array.from(document.querySelectorAll('#' + sideId + ' .sbi'));
  const pageMap = {home:0, postjob:1, myjobs:2, candidates:3, profile:4, jobs:1, myapps:2};
  const idx = pageMap[page] ?? 0;
  if (items[idx]) items[idx].classList.add('active');

  document.querySelectorAll('#' + prefix + 'Pages .db-page').forEach(p => p.classList.remove('active'));
  const target = document.getElementById(prefix + '-' + page);
  if (target) target.classList.add('active');

  if (window.innerWidth <= 900) document.getElementById('dbSidebar').classList.remove('mobile-open');
  if (page === 'myjobs')     renderHRJobsList();
  if (page === 'candidates') renderCandidates();
  if (page === 'jobs')       renderUserJobs();
  if (page === 'myapps')     renderUserApps();
}

function toggleSidebar() {
  const sb = document.getElementById('dbSidebar');
  if (window.innerWidth <= 900) sb.classList.toggle('mobile-open');
  else sb.classList.toggle('collapsed');
}

/* ═══════════════════════════════════════════
   HR — POST JOB
═══════════════════════════════════════════ */
function postJobForm(e) {
  e.preventDefault();
  const title = document.getElementById('jt_title').value.trim();
  const job = {
    id: Date.now(), title,
    dept:     document.getElementById('jt_dept').value     || 'General',
    loc:      document.getElementById('jt_loc').value      || 'India',
    type:     document.getElementById('jt_type').value,
    exp:      document.getElementById('jt_exp').value      || 'Not specified',
    deadline: document.getElementById('jt_deadline').value || 'Open',
    desc:     document.getElementById('jt_desc').value.trim(),
    skills:   document.getElementById('jt_skills').value.trim().split(',').map(s => s.trim()).filter(Boolean),
    reqs:     document.getElementById('jt_reqs').value,
    sal:      document.getElementById('jt_sal').value      || 'Competitive',
    status: 'Open', postedBy: 'HR Admin', applicants: []
  };
  jobPostings.unshift(job);
  document.getElementById('hrJobBadge').textContent = jobPostings.length;
  toast('Job "' + title + '" posted!');
  e.target.reset();
  navTo('myjobs');
}

/* ═══════════════════════════════════════════
   HR — JOBS LIST
═══════════════════════════════════════════ */
function renderHRJobsList() {
  const el = document.getElementById('hrJobsList');
  if (!jobPostings.length) {
    el.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text-light);">No jobs posted yet. <span class="tl-green" onclick="navTo(\'postjob\')">Post your first job &rarr;</span></div>';
    return;
  }
  el.innerHTML = jobPostings.map(j => `
    <div class="job-post-card hr-jpc">
      <div class="jpc-header">
        <div><div class="jpc-title">${j.title}</div><div class="jpc-company">${j.dept} · ${j.loc} · ${j.type}</div></div>
        <span class="jpc-badge ${j.status === 'Open' ? 'jpb-open' : 'jpb-closed'}">${j.status}</span>
      </div>
      <div class="jpc-desc">${j.desc.slice(0,160)}${j.desc.length > 160 ? '…' : ''}</div>
      <div class="jpc-skills">${j.skills.map(s => `<span class="skill-tag">${s}</span>`).join('')}</div>
      <div class="jpc-meta">
        <span>Deadline: ${j.deadline}</span>
        <span>${candidateSubmissions.filter(c => c.jobId === j.id).length} Applicants</span>
        <span>Exp: ${j.exp}</span>
        <span>${j.sal}</span>
      </div>
      <div class="jpc-actions">
        <button class="btn-sm hr-sm" onclick="viewJobCandidates(${j.id})">View Candidates</button>
        <button class="btn-red" onclick="closeJob(${j.id})">${j.status === 'Open' ? 'Close Job' : 'Reopen'}</button>
      </div>
    </div>`).join('');
}

function closeJob(id) {
  const j = jobPostings.find(j => j.id === id);
  if (j) { j.status = j.status === 'Open' ? 'Closed' : 'Open'; renderHRJobsList(); toast('Job status updated.'); }
}

function viewJobCandidates(jobId) {
  document.getElementById('candFilterJob').value = jobId;
  navTo('candidates');
}

/* ═══════════════════════════════════════════
   HR — CANDIDATE RANKINGS
═══════════════════════════════════════════ */
function renderCandidates() {
  const sel = document.getElementById('candFilterJob');
  const curVal = sel.value;
  sel.innerHTML = '<option value="">All Job Postings</option>' +
    jobPostings.map(j => `<option value="${j.id}">${j.title}</option>`).join('');
  sel.value = curVal;

  const jobFilter    = sel.value;
  const statusFilter = document.getElementById('candFilterStatus').value;
  let data = [...candidateSubmissions];
  if (jobFilter)    data = data.filter(c => String(c.jobId) === String(jobFilter));
  if (statusFilter) data = data.filter(c => c.status === statusFilter);
  data.sort((a, b) => b.score - a.score);

  const tbody = document.getElementById('candTableBody');
  if (!data.length) {
    tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;padding:28px;color:var(--text-light);">No candidates found.</td></tr>';
    return;
  }

  tbody.innerHTML = data.map((c, i) => {
    const rank = i + 1;
    const rankEmoji = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '#' + rank;
    const scCls   = c.score >= 80 ? 'hi' : c.score >= 65 ? 'mid' : 'lo';
    const stCls   = c.status === 'Shortlisted' ? 'ts-sh' : c.status === 'On Hold' ? 'ts-hd' : c.status === 'Rejected' ? 'ts-rj' : 'ts-pn';
    const scColor = c.score >= 80 ? 'var(--hr-primary)' : c.score >= 65 ? 'var(--orange)' : 'var(--accent)';
    return `<tr style="${rank <= 3 ? 'background:rgba(209,250,229,.15);' : ''}">
      <td style="font-weight:800;font-size:15px;text-align:center;">${rankEmoji}</td>
      <td><div class="tn">${c.name}</div><div style="font-size:11px;color:var(--text-light);">${c.email}</div></td>
      <td style="font-size:12.5px;color:var(--text-muted);">${c.jobTitle}</td>
      <td>
        <div style="display:flex;align-items:center;gap:7px;">
          <div style="width:38px;height:38px;border-radius:50%;background:conic-gradient(${scColor} 0% ${c.score}%,#e2e8f0 ${c.score}% 100%);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
            <div style="width:28px;height:28px;background:white;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:9px;color:${scColor};">${c.score}%</div>
          </div>
          <span class="ts ${scCls}">${c.score}%</span>
        </div>
      </td>
      <td class="ts" style="color:var(--hr-primary);font-size:13px;">${c.skills}%</td>
      <td class="ts" style="color:var(--purple);font-size:13px;">${c.exp}%</td>
      <td class="ts" style="color:var(--orange);font-size:13px;">${c.edu}%</td>
      <td><span class="tst ${stCls}">${c.status}</span></td>
      <td>
        <div style="display:flex;gap:4px;flex-wrap:wrap;">
          <button class="btn-green" onclick="updateCandStatus(${c.id},'Shortlisted')">Shortlist</button>
          <button class="btn-red"   onclick="updateCandStatus(${c.id},'Rejected')">Reject</button>
          ${c.status === 'Shortlisted' ? `<button class="btn-sm hr-sm" onclick="openMail(${c.id})">Mail</button>` : ''}
        </div>
      </td>
    </tr>`;
  }).join('');

  document.getElementById('hrCandBadge').textContent = candidateSubmissions.length;
}

function updateCandStatus(id, status) {
  const c = candidateSubmissions.find(c => c.id === id);
  if (c) {
    c.status = status;
    renderCandidates();
    renderHRJobsList();
    toast(status === 'Shortlisted' ? `${c.name} shortlisted!` : `${c.name} marked as Rejected.`);
    const ua = myApplications.find(a => a.jobId === c.jobId && a.name === c.name);
    if (ua) ua.hrStatus = status;
  }
}

/* ═══════════════════════════════════════════
   MAIL MODAL
═══════════════════════════════════════════ */
function openMail(candId) {
  mailCandId = candId;
  const c = candidateSubmissions.find(c => c.id === candId);
  if (!c) return;
  document.getElementById('mailToAddr').textContent = c.name + ' <' + c.email + '>';
  document.getElementById('mailBodyPreview').innerHTML = `Dear <strong>${c.name}</strong>,<br><br>
    Congratulations! After reviewing your application for <strong>${c.jobTitle}</strong> at <strong>ResumeIQ Technologies</strong>, you have been <strong style="color:var(--hr-primary);">shortlisted</strong> for the next stage of our hiring process.<br><br>
    Our HR team will be in touch shortly with further details.<br><br>
    <strong>Warm regards,<br>HR Admin · ResumeIQ Technologies</strong>`;
  document.getElementById('mailNote').value = '';
  document.getElementById('mailOverlay').classList.add('active');
}

function closeMail() {
  document.getElementById('mailOverlay').classList.remove('active');
  mailCandId = null;
}

function sendMail() {
  const c = candidateSubmissions.find(c => c.id === mailCandId);
  if (!c) return;
  closeMail();
  toast(`Shortlist email sent to ${c.name}!`);
}

/* ═══════════════════════════════════════════
   USER — BROWSE JOBS
═══════════════════════════════════════════ */
function renderUserJobs() {
  const el = document.getElementById('userJobsList');
  const openJobs = jobPostings.filter(j => j.status === 'Open');
  document.getElementById('uOpenJobs').textContent = openJobs.length;
  if (!openJobs.length) {
    el.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text-light);">No job openings available right now. Check back soon!</div>';
    return;
  }
  el.innerHTML = openJobs.map(j => {
    const applied = myApplications.find(a => a.jobId === j.id);
    return `<div class="job-post-card user-jpc">
      <div class="jpc-header">
        <div><div class="jpc-title">${j.title}</div><div class="jpc-company">${j.dept} · ${j.loc} · ${j.type} · ${j.exp}</div></div>
        <span class="jpc-badge jpb-open">Open</span>
      </div>
      <div class="jpc-desc" style="border-left-color:var(--primary-light);background:rgba(232,239,254,.3);">${j.desc}</div>
      <div style="font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:var(--primary);margin-bottom:9px;">Required Skills</div>
      <div class="jpc-skills">${j.skills.map(s => `<span class="skill-tag user-tag">${s}</span>`).join('')}</div>
      ${j.reqs ? `<div style="background:rgba(240,245,255,.8);border-radius:8px;padding:12px 14px;margin-bottom:13px;font-size:12.5px;color:var(--text-muted);line-height:1.8;white-space:pre-line;">${j.reqs}</div>` : ''}
      <div class="jpc-meta"><span>Deadline: ${j.deadline}</span><span>${j.sal}</span><span>${j.loc}</span></div>
      <div class="jpc-actions">
        ${applied
          ? `<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
               <span style="background:var(--green-pale);color:var(--green);padding:7px 16px;border-radius:20px;font-size:12.5px;font-weight:700;">Application Submitted</span>
               <span class="tst ${applied.hrStatus === 'Shortlisted' ? 'ts-sh' : applied.hrStatus === 'Rejected' ? 'ts-rj' : 'ts-pn'}">${applied.hrStatus || 'Pending Review'}</span>
             </div>`
          : `<button class="btn-p" style="background:linear-gradient(135deg,#c04a00,#f97316);" onclick="openApply(${j.id})">Apply Now</button>`
        }
      </div>
    </div>`;
  }).join('');
}

/* ═══════════════════════════════════════════
   USER — MY APPLICATIONS
═══════════════════════════════════════════ */
function renderUserApps() {
  const el     = document.getElementById('userAppsList');
  const homeEl = document.getElementById('userHomeApps');
  if (!myApplications.length) {
    const msg = '<div style="text-align:center;padding:32px;color:var(--text-light);font-size:13px;">No applications yet. <span class="tl" onclick="navTo(\'jobs\')">Browse jobs to apply &rarr;</span></div>';
    el.innerHTML = msg;
    if (homeEl) homeEl.innerHTML = msg;
    return;
  }
  const html = myApplications.map(a => {
    const stCls  = a.hrStatus === 'Shortlisted' ? 'ts-sh' : a.hrStatus === 'Rejected' ? 'ts-rj' : 'ts-pn';
    const stMsg  = a.hrStatus === 'Shortlisted'
      ? '<div style="color:var(--green);font-size:12px;margin-top:4px;">Congratulations! HR has shortlisted you.</div>'
      : a.hrStatus === 'Rejected'
      ? '<div style="color:#dc2626;font-size:12px;margin-top:4px;">Your application was not selected this time.</div>'
      : '<div style="color:var(--text-light);font-size:12px;margin-top:4px;">Under review by HR team…</div>';
    return `<div class="app-item">
      <div class="app-ic" style="background:var(--orange-pale);">&#128188;</div>
      <div style="flex:1;">
        <div style="font-weight:700;font-size:14px;color:var(--text);margin-bottom:2px;">${a.jobTitle}</div>
        <div style="font-size:11px;color:var(--text-muted);">Applied ${a.appliedOn} · ${a.file}</div>
        ${stMsg}
      </div>
      <div style="text-align:right;flex-shrink:0;"><span class="tst ${stCls}">${a.hrStatus || 'Pending'}</span></div>
    </div>`;
  }).join('');
  el.innerHTML = html;
  if (homeEl) homeEl.innerHTML = html;
}

function updateUserStats() {
  document.getElementById('uApps').textContent       = myApplications.length;
  document.getElementById('uShortlisted').textContent = myApplications.filter(a => a.hrStatus === 'Shortlisted').length;
  document.getElementById('uOpenJobs').textContent    = jobPostings.filter(j => j.status === 'Open').length;
}

/* ═══════════════════════════════════════════
   APPLY MODAL
═══════════════════════════════════════════ */
function openApply(jobId) {
  currentJobId = jobId;
  applyFile = null;
  document.getElementById('applyFileInfo').innerHTML = '';
  document.getElementById('applySuccessMsg').classList.add('hidden');
  const applyFormEl = document.getElementById('applyForm');
  applyFormEl.classList.remove('hidden');
  applyFormEl.reset();

  const j = jobPostings.find(j => j.id === jobId);
  if (!j) return;
  document.getElementById('applyJobTitle').textContent = 'Apply for ' + j.title;
  document.getElementById('applyJobDesc').textContent  = j.desc;
  document.getElementById('applySkillsDiv').innerHTML  = `
    <div style="font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:var(--primary);margin-bottom:8px;">Skills Required</div>
    <div style="display:flex;flex-wrap:wrap;gap:6px;">${j.skills.map(s => `<span class="skill-tag user-tag">${s}</span>`).join('')}</div>`;
  document.getElementById('applyOverlay').classList.add('active');
}

function closeApply() {
  document.getElementById('applyOverlay').classList.remove('active');
}

function applyFileSelected(e) {
  applyFile = e.target.files[0];
  if (applyFile) {
    document.getElementById('applyFileInfo').innerHTML = `<div style="display:flex;align-items:center;gap:9px;padding:8px 12px;background:var(--primary-pale);border-radius:8px;margin-bottom:6px;font-size:13px;font-weight:600;color:var(--primary);">&#128196; ${applyFile.name}<span style="margin-left:auto;font-size:11px;color:var(--text-muted)">${(applyFile.size/1024).toFixed(0)} KB</span></div>`;
  }
}

function submitApplication(e) {
  e.preventDefault();
  const name  = document.getElementById('aName').value.trim();
  const email = document.getElementById('aEmail').value.trim();
  if (!applyFile) { toast('Please upload your resume.'); return; }

  const applyFormEl = document.getElementById('applyForm');
  applyFormEl.innerHTML = `<div style="text-align:center;padding:30px;">
    <div style="font-size:40px;margin-bottom:12px;">&#9203;</div>
    <div style="font-weight:700;font-size:15px;margin-bottom:6px;">Processing your application…</div>
    <div style="font-size:13px;color:var(--text-muted);">Please wait while we analyse your resume.</div>
  </div>`;

  setTimeout(() => {
    const j  = jobPostings.find(j => j.id === currentJobId);
    const sc = Math.floor(Math.random() * 30) + 65;
    const skills = Math.min(sc + 4, 100), exp = Math.max(sc - 6, 40), edu = Math.min(sc + 2, 100);
    const sub = {
      id: Date.now(), name, email, jobId: currentJobId, jobTitle: j.title,
      score: sc, skills, exp, edu, file: applyFile.name,
      status: 'Pending Review', appliedOn: new Date().toISOString().split('T')[0]
    };
    candidateSubmissions.push(sub);
    document.getElementById('hrCandBadge').textContent = candidateSubmissions.length;
    myApplications.push({jobId: currentJobId, jobTitle: j.title, file: applyFile.name, appliedOn: sub.appliedOn, hrStatus: 'Pending Review', name});

    applyFormEl.classList.add('hidden');
    const suc = document.getElementById('applySuccessMsg');
    suc.classList.remove('hidden');
    suc.innerHTML = `<div style="text-align:center;padding:20px;">
      <div style="font-size:52px;margin-bottom:14px;">&#127881;</div>
      <div style="font-family:'Fraunces',serif;font-size:22px;font-weight:800;color:var(--green);margin-bottom:8px;">Application Submitted!</div>
      <div style="font-size:14px;color:var(--text-muted);line-height:1.75;margin-bottom:20px;">
        Your application for <strong>${j.title}</strong> has been successfully submitted.<br>
        Our HR team will review your resume and reach out if you are shortlisted.
      </div>
      <div style="background:var(--green-pale);border:1px solid rgba(22,163,74,.2);border-radius:12px;padding:16px 18px;margin-bottom:18px;text-align:left;">
        <div style="font-family:'Space Mono',monospace;font-size:10px;font-weight:700;color:var(--green);margin-bottom:8px;letter-spacing:1px;text-transform:uppercase;">Submission Summary</div>
        <div style="font-size:13px;color:var(--text-muted);line-height:2;">
          <strong>${name}</strong><br>${email}<br>${applyFile.name}<br>${j.title} · ${j.loc}
        </div>
      </div>
      <button style="width:100%;padding:11px;background:linear-gradient(135deg,#c04a00,#f97316);border:none;border-radius:9px;color:white;font-weight:700;font-size:13.5px;cursor:pointer;font-family:inherit;" onclick="closeApply();navTo('myapps')">View My Applications &rarr;</button>
    </div>`;
    renderUserJobs();
    renderUserApps();
    updateUserStats();
    toast('Application submitted for ' + j.title + '!');
  }, 2000);
}

/* ═══ PROFILE SAVES ═══ */
function profileSave(e)     { e.preventDefault(); toast('Profile updated.'); }
function profileSaveUser(e) { e.preventDefault(); toast('Profile updated.'); 