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

  // Live preview
  function updatePreview() {
    const title = document.getElementById("jobTitle")?.value || "Job Title";
    const company =
      document.getElementById("jobCompany")?.value || "Company Name";
    const type = document.getElementById("jobType")?.value || "";
    const loc = document.getElementById("jobLoc")?.value || "Location";
    const level = document.getElementById("jobLevel")?.value || "Level";
    const salary = document.getElementById("jobSalary")?.value || "";

    const skills = (document.getElementById("jobSkills")?.value || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    document.getElementById("prevTitle")?.textContent &&
      (document.getElementById("prevTitle").textContent = title);
    document.getElementById("prevCompany").textContent = company;
    document.getElementById("prevEmoji").textContent = emoji;
    document.getElementById("prevLoc").textContent = loc;
    document.getElementById("prevLevel").textContent = capitalize(level);
    const typeEl = document.getElementById("prevType");
    if (typeEl) {
      typeEl.textContent = type || "Full-time";
      typeEl.className = "jc-type " + (typeMap[type] || "jt-full");
    }
    const skillsEl = document.getElementById("prevSkills");
    if (skillsEl)
      skillsEl.innerHTML =
        skills
          .map((s) => `<span class="skill-tag">${escHtml(s)}</span>`)
          .join("") || '<span class="skill-tag">Skills</span>';
    const salEl = document.getElementById("prevSalary");
    if (salEl) {
      salEl.textContent = salary;
      salEl.style.display = salary ? "" : "none";
    }
  }

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
        setTimeout(() => (window.location.href = "jobs.html"), 1200);
      } else showToast(res.error || "Failed to post job", "error");
    });
});
