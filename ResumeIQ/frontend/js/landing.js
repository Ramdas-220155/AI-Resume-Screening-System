/* ============================================================
   landing.js — Landing Page Interactions · ResumeIQ v3
   ============================================================ */

// ── Theme ────────────────────────────────────────────────
const savedTheme = localStorage.getItem("riq_theme") || "dark";
document.documentElement.setAttribute("data-theme", savedTheme);
updateThemeIcon(savedTheme);

document.getElementById("themeBtn")?.addEventListener("click", () => {
  const current = document.documentElement.getAttribute("data-theme");
  const next = current === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", next);
  localStorage.setItem("riq_theme", next);
  updateThemeIcon(next);
});

function updateThemeIcon(theme) {
  const icon = document.getElementById("themeIcon");
  if (!icon) return;
  icon.className = theme === "dark" ? "fa-solid fa-sun" : "fa-solid fa-moon";
}

// ── Login dropdown ───────────────────────────────────────
const loginTrigger = document.getElementById("loginTrigger");
const loginDropdown = document.getElementById("loginDropdown");
const loginChevron = document.getElementById("loginChevron");

loginTrigger?.addEventListener("click", (e) => {
  e.stopPropagation();
  const isOpen = loginDropdown.classList.toggle("open");
  loginChevron?.classList.toggle("open", isOpen);
});

document.addEventListener("click", () => {
  loginDropdown?.classList.remove("open");
  loginChevron?.classList.remove("open");
});

loginDropdown?.addEventListener("click", (e) => e.stopPropagation());

// ── Mobile nav ───────────────────────────────────────────
document.getElementById("lnavMobBtn")?.addEventListener("click", () => {
  document.getElementById("lnavMobPanel")?.classList.toggle("open");
});

document.querySelectorAll(".lnav-mob-panel a:not(.btn)").forEach((a) => {
  a.addEventListener("click", () => {
    document.getElementById("lnavMobPanel")?.classList.remove("open");
  });
});

// ── Navbar scroll effect ─────────────────────────────────
window.addEventListener("scroll", () => {
  const nav = document.getElementById("lnav");
  if (!nav) return;
  nav.style.boxShadow = window.scrollY > 50 ? "0 4px 24px rgba(0,0,0,0.4)" : "";
});

// ── Smooth scroll for nav links ──────────────────────────
document.querySelectorAll('a[href^="#"]').forEach((a) => {
  a.addEventListener("click", (e) => {
    const target = document.querySelector(a.getAttribute("href"));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });
});

// ── Count-up animations ──────────────────────────────────
const countEls = document.querySelectorAll(".count-up[data-target]");
const countObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const el = e.target;
      const target = parseInt(el.dataset.target, 10);
      let current = 0;
      const suffix = el.dataset.suffix || "";
      const inc = Math.max(1, Math.ceil(target / 60));
      const timer = setInterval(() => {
        current = Math.min(current + inc, target);
        el.textContent = current.toLocaleString() + suffix;
        if (current >= target) clearInterval(timer);
      }, 24);
      countObserver.unobserve(el);
    });
  },
  { threshold: 0.3 },
);
countEls.forEach((el) => countObserver.observe(el));

// ── Contact Form — Backend Connected ─────────────────────
document
  .getElementById("contactForm")
  ?.addEventListener("submit", async function (e) {
    e.preventDefault();

    const btn = this.querySelector('[type="submit"]');
    const orig = btn.innerHTML;

    // Get form values
    const name = this.querySelector('input[type="text"]')?.value?.trim() || "";
    const email =
      this.querySelector('input[type="email"]')?.value?.trim() || "";
    const subject =
      this.querySelector('input[name="subject"]')?.value?.trim() ||
      "General Inquiry";
    const message = this.querySelector("textarea")?.value?.trim() || "";

    // Basic client-side validation
    if (!name) {
      showFormMsg("Please enter your name", "error");
      return;
    }
    if (!email) {
      showFormMsg("Please enter your email", "error");
      return;
    }
    if (!message) {
      showFormMsg("Please enter a message", "error");
      return;
    }

    // Show loading state
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Sending…';
    btn.disabled = true;
    hideFormMsg();

    try {
      // API base — matches the API_BASE in api.js
      // 🔧 Change this to your deployed backend URL when hosting online
      const apiBase = "http://localhost:5000/api";

      const res = await fetch(`${apiBase}/contact/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, subject, message }),
      });

      const data = await res.json();

      if (data.success) {
        // Success state
        btn.innerHTML = '<i class="fa-solid fa-check"></i> Message Sent!';
        btn.style.background = "linear-gradient(135deg,#10b981,#059669)";
        showFormMsg(
          `✅ Thanks ${name}! We'll get back to you within 24 hours.`,
          "success",
        );
        this.reset();

        // Reset button after 4 seconds
        setTimeout(() => {
          btn.innerHTML = orig;
          btn.style.background = "";
          btn.disabled = false;
          hideFormMsg();
        }, 4000);
      } else {
        // Server-side error
        btn.innerHTML = orig;
        btn.disabled = false;
        showFormMsg(
          `❌ ${data.error || "Failed to send message. Please try again."}`,
          "error",
        );
      }
    } catch (err) {
      // Network error
      btn.innerHTML = orig;
      btn.disabled = false;
      showFormMsg(
        "❌ Network error — please check your connection and try again.",
        "error",
      );
      console.error("Contact form error:", err);
    }
  });

/* Show/hide inline form feedback message */
function showFormMsg(text, type) {
  let msgEl = document.getElementById("contactFormMsg");
  if (!msgEl) {
    msgEl = document.createElement("div");
    msgEl.id = "contactFormMsg";
    msgEl.style.cssText = `
      padding: 12px 16px; border-radius: 8px; font-size: 14px;
      font-weight: 600; margin-bottom: 14px; display: flex;
      align-items: center; gap: 8px; font-family: var(--ff-body);
    `;
    const form = document.getElementById("contactForm");
    form?.insertBefore(msgEl, form.firstChild);
  }
  if (type === "success") {
    msgEl.style.background = "rgba(16,185,129,0.1)";
    msgEl.style.border = "1px solid rgba(16,185,129,0.25)";
    msgEl.style.color = "#34d399";
  } else {
    msgEl.style.background = "rgba(239,68,68,0.1)";
    msgEl.style.border = "1px solid rgba(239,68,68,0.25)";
    msgEl.style.color = "#f87171";
  }
  msgEl.textContent = text;
  msgEl.style.display = "flex";
}

function hideFormMsg() {
  const msgEl = document.getElementById("contactFormMsg");
  if (msgEl) msgEl.style.display = "none";
}

// ── Scroll-reveal cards ──────────────────────────────────
const revealEls = document.querySelectorAll(".feat-card, .hiw-step, .ci-row");
const revealObs = new IntersectionObserver(
  (entries) => {
    entries.forEach((e, i) => {
      if (e.isIntersecting) {
        setTimeout(() => {
          e.target.style.opacity = "1";
          e.target.style.transform = "translateY(0)";
        }, i * 80);
        revealObs.unobserve(e.target);
      }
    });
  },
  { threshold: 0.1 },
);

revealEls.forEach((el) => {
  el.style.opacity = "0";
  el.style.transform = "translateY(18px)";
  el.style.transition = "opacity 0.45s ease, transform 0.45s ease";
  revealObs.observe(el);
});
