/* interviews.js — User: My Interviews · ResumeIQ v3.0 */

let allInterviews = [];

document.addEventListener('DOMContentLoaded', async () => {
  if (!Auth.requireLogin('user')) return;
  applyIdentityToDOM();
  await loadInterviews();
});

async function loadInterviews() {
  try {
    const res = await InterviewAPI.myInterviews();
    if (!res.success) { showToast(res.error || 'Failed to load', 'error'); return; }
    allInterviews = res.interviews || [];
    renderStats();
    renderList(allInterviews);
  } catch(e) {
    showToast('Connection error', 'error');
  }
}

function renderStats() {
  const total    = allInterviews.length;
  const upcoming = allInterviews.filter(iv => iv.status === 'scheduled').length;
  const pending  = allInterviews.filter(iv => iv.reschedule_status === 'pending').length;
  animateCount(document.getElementById('statTotal'),    total);
  animateCount(document.getElementById('statUpcoming'), upcoming);
  animateCount(document.getElementById('statPending'),  pending);
}

function filterInterviews() {
  const val = document.getElementById('ivFilter').value;
  const filtered = val === 'all' ? allInterviews : allInterviews.filter(iv => iv.status === val);
  renderList(filtered);
}

function renderList(list) {
  const container = document.getElementById('ivList');
  if (!list.length) {
    container.innerHTML = `<div class="iv-empty"><i class="fa-solid fa-calendar-xmark"></i><p>No interviews scheduled yet.<br>Apply for jobs and HR will schedule your interview here.</p></div>`;
    return;
  }

  const modeIcon = { online: 'fa-video', phone: 'fa-phone', offline: 'fa-building' };
  const modeLabel = { online: 'Online', phone: 'Phone', offline: 'In-Person' };

  container.innerHTML = list.map(iv => {
    const statusCls = iv.status === 'cancelled' ? 'badge-cancelled' : 'badge-scheduled';
    const rescheduleBanner = iv.reschedule_status === 'pending'
      ? `<div class="iv-reschedule-banner"><i class="fa-solid fa-rotate"></i> Reschedule request pending — waiting for HR approval</div>`
      : iv.reschedule_status === 'approved'
      ? `<div class="iv-reschedule-banner" style="background:rgba(16,185,129,0.08);border-color:rgba(16,185,129,0.2);color:#34d399"><i class="fa-solid fa-check"></i> Reschedule approved — new date: ${iv.reschedule_date} at ${iv.reschedule_time}</div>`
      : iv.reschedule_status === 'rejected'
      ? `<div class="iv-reschedule-banner" style="background:rgba(239,68,68,0.08);border-color:rgba(239,68,68,0.2);color:#f87171"><i class="fa-solid fa-xmark"></i> Reschedule request was rejected</div>`
      : '';

    const canReschedule = iv.status === 'scheduled' && iv.reschedule_status !== 'pending';

    return `<div class="iv-card">
      <div class="iv-card-top">
        <div class="iv-card-left">
          <div class="iv-card-icon">📅</div>
          <div>
            <div class="iv-card-company">${escHtml(iv.company)}</div>
            <div class="iv-card-title">${escHtml(iv.job_title)}</div>
          </div>
        </div>
        <div class="iv-card-right">
          <span class="badge ${statusCls}">${capitalize(iv.status)}</span>
        </div>
      </div>
      <div class="iv-card-details">
        <div class="iv-detail"><i class="fa-solid fa-calendar"></i>${iv.date}</div>
        <div class="iv-detail"><i class="fa-solid fa-clock"></i>${iv.time}</div>
        <div class="iv-detail"><i class="fa-solid ${modeIcon[iv.mode]||'fa-video'}"></i>${modeLabel[iv.mode]||iv.mode}</div>
        ${iv.meeting_link ? `<div class="iv-detail"><i class="fa-solid fa-link"></i><a href="${iv.meeting_link}" target="_blank">Join Meeting</a></div>` : ''}
        ${iv.location ? `<div class="iv-detail"><i class="fa-solid fa-location-dot"></i>${escHtml(iv.location)}</div>` : ''}
      </div>
      ${iv.notes ? `<div style="margin-top:10px;font-size:12px;color:var(--clr-muted);padding:8px 12px;background:var(--bg3);border-radius:6px;border-left:3px solid var(--p1)"><strong>Notes:</strong> ${escHtml(iv.notes)}</div>` : ''}
      ${rescheduleBanner}
      ${canReschedule ? `<div class="iv-card-actions"><button class="btn btn-outline btn-sm" onclick="openReschedule('${iv.id}')"><i class="fa-solid fa-calendar-xmark"></i> Request Reschedule</button></div>` : ''}
    </div>`;
  }).join('');
}

/* ── Reschedule Modal ────────────────────────────────── */
function openReschedule(id) {
  document.getElementById('rescheduleIvId').value = id;
  document.getElementById('rescheduleReason').value = '';
  document.getElementById('rescheduleDate').value = '';
  document.getElementById('rescheduleTime').value = '';
  // Set min date to tomorrow
  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
  document.getElementById('rescheduleDate').min = tomorrow.toISOString().split('T')[0];
  document.getElementById('rescheduleModal').classList.add('open');
}

function closeReschedule() {
  document.getElementById('rescheduleModal').classList.remove('open');
}

async function submitReschedule() {
  const interview_id    = document.getElementById('rescheduleIvId').value;
  const reason          = document.getElementById('rescheduleReason').value.trim();
  const preferred_date  = document.getElementById('rescheduleDate').value;
  const preferred_time  = document.getElementById('rescheduleTime').value;

  if (!reason)         { showToast('Please provide a reason', 'error'); return; }
  if (!preferred_date) { showToast('Please select a preferred date', 'error'); return; }
  if (!preferred_time) { showToast('Please select a preferred time', 'error'); return; }

  const res = await InterviewAPI.requestReschedule({ interview_id, reason, preferred_date, preferred_time });
  if (res.success) {
    showToast('Reschedule request submitted ✓', 'success');
    closeReschedule();
    await loadInterviews();
  } else {
    showToast(res.error || 'Failed to submit', 'error');
  }
}
