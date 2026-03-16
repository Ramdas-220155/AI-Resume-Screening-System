/* ============================================================
   landing.js — Landing Page Interactions
   ============================================================ */

// ── Theme ────────────────────────────────────────────────
const savedTheme = localStorage.getItem('riq_theme') || 'dark';
document.documentElement.setAttribute('data-theme', savedTheme);
updateThemeIcon(savedTheme);

document.getElementById('themeBtn')?.addEventListener('click', () => {
  const current = document.documentElement.getAttribute('data-theme');
  const next    = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('riq_theme', next);
  updateThemeIcon(next);
});

function updateThemeIcon(theme) {
  const icon = document.getElementById('themeIcon');
  if (!icon) return;
  icon.className = theme === 'dark' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
}

// ── Login dropdown ───────────────────────────────────────
const loginTrigger  = document.getElementById('loginTrigger');
const loginDropdown = document.getElementById('loginDropdown');
const loginChevron  = document.getElementById('loginChevron');

loginTrigger?.addEventListener('click', (e) => {
  e.stopPropagation();
  const isOpen = loginDropdown.classList.toggle('open');
  loginChevron?.classList.toggle('open', isOpen);
});

document.addEventListener('click', () => {
  loginDropdown?.classList.remove('open');
  loginChevron?.classList.remove('open');
});

loginDropdown?.addEventListener('click', e => e.stopPropagation());

// ── Mobile nav ───────────────────────────────────────────
document.getElementById('lnavMobBtn')?.addEventListener('click', () => {
  document.getElementById('lnavMobPanel')?.classList.toggle('open');
});

// Close mobile nav on link click
document.querySelectorAll('.lnav-mob-panel a:not(.btn)').forEach(a => {
  a.addEventListener('click', () => {
    document.getElementById('lnavMobPanel')?.classList.remove('open');
  });
});

// ── Navbar scroll effect ─────────────────────────────────
window.addEventListener('scroll', () => {
  const nav = document.getElementById('lnav');
  if (!nav) return;
  if (window.scrollY > 50) {
    nav.style.boxShadow = '0 4px 24px rgba(0,0,0,0.4)';
  } else {
    nav.style.boxShadow = '';
  }
});

// ── Smooth scroll for nav links ──────────────────────────
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

// ── Count-up animations ──────────────────────────────────
const countEls = document.querySelectorAll('.count-up[data-target]');
const countObserver = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (!e.isIntersecting) return;
    const el     = e.target;
    const target = parseInt(el.dataset.target, 10);
    let current  = 0;
    const suffix = el.dataset.suffix || '';
    const inc    = Math.max(1, Math.ceil(target / 60));
    const timer  = setInterval(() => {
      current = Math.min(current + inc, target);
      el.textContent = current.toLocaleString() + suffix;
      if (current >= target) clearInterval(timer);
    }, 24);
    countObserver.unobserve(el);
  });
}, { threshold: 0.3 });
countEls.forEach(el => countObserver.observe(el));

// ── Contact form ─────────────────────────────────────────
document.getElementById('contactForm')?.addEventListener('submit', function(e) {
  e.preventDefault();
  const btn = this.querySelector('[type="submit"]');
  const orig = btn.innerHTML;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Sending…';
  btn.disabled  = true;
  setTimeout(() => {
    btn.innerHTML = '<i class="fa-solid fa-check"></i> Message Sent!';
    btn.style.background = 'linear-gradient(135deg,#10b981,#059669)';
    this.reset();
    setTimeout(() => {
      btn.innerHTML = orig;
      btn.style.background = '';
      btn.disabled = false;
    }, 3000);
  }, 1200);
});

// ── Scroll-reveal cards ──────────────────────────────────
const revealEls = document.querySelectorAll('.feat-card, .hiw-step, .ci-row');
const revealObs = new IntersectionObserver(entries => {
  entries.forEach((e, i) => {
    if (e.isIntersecting) {
      setTimeout(() => {
        e.target.style.opacity  = '1';
        e.target.style.transform = 'translateY(0)';
      }, i * 80);
      revealObs.unobserve(e.target);
    }
  });
}, { threshold: 0.1 });

revealEls.forEach(el => {
  el.style.opacity   = '0';
  el.style.transform = 'translateY(18px)';
  el.style.transition = 'opacity 0.45s ease, transform 0.45s ease';
  revealObs.observe(el);
});
