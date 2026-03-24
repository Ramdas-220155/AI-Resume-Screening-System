/* post-job.js */

document.addEventListener("DOMContentLoaded", () => {
  if (!Auth.requireLogin("hr")) return;
  applyIdentityToDOM();

  const typeMap = {
    "full-time": "jt-full",
    remote: "jt-remote",
    internship: "jt-intern",
    "part-time": "jt-part",
    contract: "jt-contract",
  };

  // =========================
  // Helper Functions
  // =========================

  function capitalize(str) {
    if (!str) return "";
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  function escHtml(str) {
    return (str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  // =========================
  // Live Preview
  // =========================

  function updatePreview() {
    const title = document.getElementById("jobTitle")?.value || "Job Title";

    const company =
      document.getElementById("jobCompany")?.value || "Company Name";

    const type = document.getElementById("jobType")?.value || "full-time";

    const loc = document.getElementById("jobLoc")?.value || "Location";

    const level = document.getElementById("jobLevel")?.value || "Level";

    const salary = document.getElementById("jobSalary")?.value || "";

    const emoji = document.getElementById("jobEmoji")?.value || "🏢";

    const skills = (document.getElementById("jobSkills")?.value || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    // Update preview elements safely

    const prevTitle = document.getElementById("prevTitle");
    if (prevTitle) prevTitle.textContent = title;

    const prevCompany = document.getElementById("prevCompany");
    if (prevCompany) prevCompany.textContent = company;

    const prevEmoji = document.getElementById("prevEmoji");
    if (prevEmoji) prevEmoji.textContent = emoji;

    const prevLoc = document.getElementById("prevLoc");
    if (prevLoc) prevLoc.textContent = loc;

    const prevLevel = document.getElementById("prevLevel");
    if (prevLevel) prevLevel.textContent = capitalize(level);

    const typeEl = document.getElementById("prevType");

    if (typeEl) {
      typeEl.textContent = capitalize(type);
      typeEl.className = "jc-type " + (typeMap[type] || "jt-full");
    }

    const skillsEl = document.getElementById("prevSkills");

    if (skillsEl) {
      skillsEl.innerHTML =
        skills
          .map((s) => `<span class="skill-tag">${escHtml(s)}</span>`)
          .join("") || '<span class="skill-tag">Skills</span>';
    }

    const salEl = document.getElementById("prevSalary");

    if (salEl) {
      salEl.textContent = salary;
      salEl.style.display = salary ? "" : "none";
    }
  }

  // =========================
  // Input listeners
  // =========================

  [
    "jobTitle",
    "jobCompany",
    "jobType",
    "jobLoc",
    "jobLevel",
    "jobSalary",
    "jobEmoji",
    "jobSkills",
  ].forEach((id) => {
    document.getElementById(id)?.addEventListener("input", updatePreview);
    document.getElementById(id)?.addEventListener("change", updatePreview);
  });

  updatePreview();

  // =========================
  // Submit Job
  // =========================

  document
    .getElementById("postJobForm")
    ?.addEventListener("submit", async function (e) {
      e.preventDefault();

      const btn = this.querySelector('[type="submit"]');

      const orig = btn.innerHTML;

      btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Posting…';

      btn.disabled = true;

      const data = {
        title: document.getElementById("jobTitle")?.value?.trim(),

        company: document.getElementById("jobCompany")?.value?.trim(),

        type: document.getElementById("jobType")?.value,

        level: document.getElementById("jobLevel")?.value,

        loc: document.getElementById("jobLoc")?.value,

        salary: document.getElementById("jobSalary")?.value?.trim(),

        logo_emoji: document.getElementById("jobEmoji")?.value?.trim() || "🏢",

        skills: (document.getElementById("jobSkills")?.value || "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),

        description: document.getElementById("jobDesc")?.value?.trim(),

        openings: parseInt(
          document.getElementById("jobOpenings")?.value || "1",
        ),

        deadline: document.getElementById("jobDeadline")?.value || null,
      };

      const res = await JobsAPI.create(data);

      btn.disabled = false;

      btn.innerHTML = orig;

      if (res.success) {
        showToast(`Job "${data.title}" posted successfully! 🎉`, "success");

        setTimeout(() => {
          window.location.href = "jobs.html";
        }, 1200);
      } else {
        showToast(res.error || "Failed to post job", "error");
      }
    });
});
