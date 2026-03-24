/* ============================================================
   api.js — ResumeIQ Centralized API Client v3.0
   Shared by User + HR dashboards
   ⚡ Updated for Node.js backend (Express + MongoDB Atlas)
   ============================================================ */

/* ── API Base URL ────────────────────────────────────────── */
// 🔧 CHANGE THIS to your deployed backend URL when hosting online
// Local dev:   http://localhost:5000/api
// Render/Railway/etc: https://your-app.onrender.com/api
const API_BASE = "http://localhost:5000/api";

/* ── Theme init ─────────────────────────────────────────── */
(function initTheme() {
  const t = localStorage.getItem("riq_theme") || "dark";
  document.documentElement.setAttribute("data-theme", t);
})();

function toggleTheme() {
  const cur = document.documentElement.getAttribute("data-theme");
  const next = cur === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", next);
  localStorage.setItem("riq_theme", next);
  syncThemeIcons(next);
}
function syncThemeIcons(theme) {
  document.querySelectorAll(".theme-icon").forEach((i) => {
    i.className =
      "fa-solid theme-icon " + (theme === "dark" ? "fa-sun" : "fa-moon");
  });
}

/* ── Auth ───────────────────────────────────────────────── */
const Auth = {
  get userId() {
    return localStorage.getItem("riq_uid");
  },
  get userName() {
    return localStorage.getItem("riq_name");
  },
  get initials() {
    return localStorage.getItem("riq_init");
  },
  get plan() {
    return localStorage.getItem("riq_plan");
  },
  get role() {
    return localStorage.getItem("riq_role");
  },

  save(data, role = "user") {
    localStorage.setItem("riq_uid", data.user_id);
    localStorage.setItem("riq_name", data.name);
    localStorage.setItem(
      "riq_init",
      data.initials || (data.name?.[0]?.toUpperCase() ?? "U"),
    );
    localStorage.setItem("riq_plan", data.plan || "Free");
    localStorage.setItem("riq_role", role);
  },
  clear() {
    ["riq_uid", "riq_name", "riq_init", "riq_plan", "riq_role"].forEach((k) =>
      localStorage.removeItem(k),
    );
  },
  isLoggedIn() {
    return !!this.userId;
  },
  isHR() {
    return this.role === "hr";
  },
  isUser() {
    return this.role === "user";
  },

  requireLogin(expectedRole = null) {
    if (!this.isLoggedIn()) {
      const base = expectedRole === "hr" ? "hr/login.html" : "user/login.html";
      const isHrPath = window.location.pathname.includes("/hr/");
      const isUserPath = window.location.pathname.includes("/user/");
      if (isHrPath || isUserPath) {
        window.location.replace("http://localhost:3000/" + base);
      } else {
        window.location.replace("http://localhost:3000/" + base);
      }
      return false;
    }
    if (expectedRole && this.role !== expectedRole) {
      this.clear();
      window.location.reload();
      return false;
    }
    return true;
  },
};

/* ── Core fetch ─────────────────────────────────────────── */
async function apiFetch(path, options = {}) {
  const headers = { "Content-Type": "application/json" };
  if (Auth.userId) {
    headers["X-User-ID"] = Auth.userId;
    headers["X-User-Role"] = Auth.role || "user";
  }
  try {
    const res = await fetch(`${API_BASE}/${path}`, {
      ...options,
      headers: { ...headers, ...(options.headers || {}) },
    });
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch (err) {
      console.error("Invalid JSON from server:", text);
      return { success: false, error: "Invalid server response" };
    }
  } catch (e) {
    return { success: false, error: "Network error — is the backend running?" };
  }
}

async function apiUpload(path, fd) {
  const headers = {};
  if (Auth.userId) {
    headers["X-User-ID"] = Auth.userId;
    headers["X-User-Role"] = Auth.role || "user";
  }
  try {
    const res = await fetch(`${API_BASE}/${path}`, {
      method: "POST",
      headers,
      body: fd,
    });
    return await res.json();
  } catch (e) {
    return { success: false, error: "Upload failed" };
  }
}

/* ── API namespaces ─────────────────────────────────────── */
// NOTE: PHP routes like "auth.php?action=register" are now mapped to:
//       POST /api/auth/register
//       POST /api/auth/login
//       etc. — the mapping table is below.

const AuthAPI = {
  register: (name, email, password, role = "user", company = "") =>
    apiFetch("auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password, role, company }),
    }),
  login: (email, password, role = "user") =>
    apiFetch("auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password, role }),
    }),
};

const DashboardAPI = { get: () => apiFetch("dashboard") };

const ProfileAPI = {
  get: () => apiFetch("profile"),
  update: (data) =>
    apiFetch("profile/update", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  changePassword: (c, n, cf) =>
    apiFetch("profile/password", {
      method: "POST",
      body: JSON.stringify({
        current_password: c,
        new_password: n,
        confirm_password: cf,
      }),
    }),
  saveNotifPrefs: (prefs) =>
    apiFetch("profile/notif", {
      method: "POST",
      body: JSON.stringify(prefs),
    }),
  uploadResume: (file) => {
    const fd = new FormData();
    fd.append("resume", file);
    return apiUpload("profile/resume", fd);
  },
};

const JobsAPI = {
  list: (p = {}) => apiFetch(`jobs/list?${new URLSearchParams(p)}`),
  apply: (id) =>
    apiFetch("jobs/apply", {
      method: "POST",
      body: JSON.stringify({ job_id: id }),
    }),
  seed: () => apiFetch("jobs/seed"),
  get: (id) => apiFetch(`jobs/get?id=${id}`),
  create: (data) =>
    apiFetch("jobs/create", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  myJobs: () => apiFetch("jobs/myjobs"),
  close: (id) =>
    apiFetch("jobs/close", {
      method: "POST",
      body: JSON.stringify({ job_id: id }),
    }),
  del: (id) =>
    apiFetch("jobs/delete", {
      method: "POST",
      body: JSON.stringify({ job_id: id }),
    }),
};

const ApplicationsAPI = {
  list: (p = {}) =>
    apiFetch(`applications/list?${new URLSearchParams(p)}`),
  withdraw: (app_id) =>
    apiFetch("applications/withdraw", {
      method: "POST",
      body: JSON.stringify({ app_id }),
    }),
  stats: () => apiFetch("applications/stats"),
  forJob: (job_id, p = {}) =>
    apiFetch(
      `applications/for_job?job_id=${job_id}&${new URLSearchParams(p)}`,
    ),
  updateStatus: (app_id, status, notes = "") =>
    apiFetch("applications/update_status", {
      method: "POST",
      body: JSON.stringify({ app_id, status, notes }),
    }),
  hrStats: () => apiFetch("applications/hr_stats"),
  allForHR: (p = {}) =>
    apiFetch(`applications/all_hr?${new URLSearchParams(p)}`),
};

const HRAPI = {
  dashboard: () => apiFetch("hr_dashboard"),
  candidates: (p = {}) =>
    apiFetch(`hr_dashboard?action=candidates&${new URLSearchParams(p)}`),
};

const ContactAPI = {
  send: (data) =>
    apiFetch("contact/send", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

/* ── DOM identity ───────────────────────────────────────── */
function applyIdentityToDOM() {
  const name = Auth.userName || "User";
  const initials = Auth.initials || name[0]?.toUpperCase() || "U";
  const theme = document.documentElement.getAttribute("data-theme");
  document
    .querySelectorAll("[data-user-name]")
    .forEach((el) => (el.textContent = name));
  document
    .querySelectorAll("[data-user-initials]")
    .forEach((el) => (el.textContent = initials));
  document
    .querySelectorAll(".sb-user-name")
    .forEach((el) => (el.textContent = name));
  document
    .querySelectorAll(".sb-user-av")
    .forEach((el) => (el.textContent = initials));
  document
    .querySelectorAll(".tb-av-circle")
    .forEach((el) => (el.textContent = initials));
  document
    .querySelectorAll(".tb-av-name")
    .forEach((el) => (el.textContent = name.split(" ")[0]));
  document.querySelectorAll(".sb-user-role").forEach((el) => {
    el.textContent = Auth.isHR()
      ? `Recruiter · ${Auth.plan}`
      : `Job Seeker · ${Auth.plan}`;
  });
  syncThemeIcons(theme);
}

document.addEventListener("DOMContentLoaded", () => {
  document
    .querySelectorAll(".theme-btn")
    .forEach((b) => b.addEventListener("click", toggleTheme));
  document.querySelectorAll(".nav-logout").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      if (confirm("Log out of ResumeIQ?")) {
        const isHR = Auth.isHR();
        Auth.clear();
        if (typeof showToast === "function") showToast("Logged out", "info");
        setTimeout(() => {
          window.location.replace(isHR
            ? "http://localhost:3000/hr/login.html"
            : "http://localhost:3000/user/login.html");
        }, 700);
      }
    });
  });
  // Sidebar
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("sbOverlay");
  const openBtn = document.getElementById("hamburgerBtn");
  const closeBtn = document.getElementById("sbCloseBtn");
  if (sidebar) {
    openBtn?.addEventListener("click", () => {
      sidebar.classList.add("open");
      overlay?.classList.add("active");
      document.body.style.overflow = "hidden";
    });
    closeBtn?.addEventListener("click", () => {
      sidebar.classList.remove("open");
      overlay?.classList.remove("active");
      document.body.style.overflow = "";
    });
    overlay?.addEventListener("click", () => {
      sidebar.classList.remove("open");
      overlay?.classList.remove("active");
      document.body.style.overflow = "";
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        sidebar.classList.remove("open");
        overlay?.classList.remove("active");
        document.body.style.overflow = "";
      }
    });
    // Active nav link
    const cur = window.location.pathname.split("/").pop() || "index.html";
    document.querySelectorAll(".nav-link[href]").forEach((a) => {
      if (a.getAttribute("href") === cur) a.classList.add("active");
    });
  }
});

/* ── Utils ──────────────────────────────────────────────── */
function escHtml(str) {
  const d = document.createElement("div");
  d.textContent = str || "";
  return d.innerHTML;
}
function capitalize(s) {
  return s ? s[0].toUpperCase() + s.slice(1) : "";
}
function animateCount(el, target) {
  if (!el) return;
  let cur = 0;
  const inc = Math.max(1, Math.ceil(target / 48));
  const t = setInterval(() => {
    cur = Math.min(cur + inc, target);
    el.textContent = cur.toLocaleString();
    if (cur >= target) clearInterval(t);
  }, 26);
}
function animateScoreBars() {
  const fills = document.querySelectorAll(".score-fill[data-score]");
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.style.width = e.target.dataset.score + "%";
          io.unobserve(e.target);
        }
      });
    },
    { threshold: 0.1 },
  );
  fills.forEach((f) => {
    f.style.width = "0%";
    io.observe(f);
  });
}