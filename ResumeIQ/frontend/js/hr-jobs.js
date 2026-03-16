document.addEventListener("DOMContentLoaded", async () => {
  const grid = document.getElementById("jobsGrid");
  const searchInput = document.getElementById("jobSearch");
  const typeFilter = document.getElementById("typeFilter");
  const locFilter = document.getElementById("locFilter");
  const levelFilter = document.getElementById("levelFilter");
  const resultCount = document.getElementById("resultCount");

  let allJobs = [];

  /* Remove emojis for better search */
  function stripEmojis(str) {
    return (str || "").replace(
      /([\u2700-\u27BF]|[\uE000-\uF8FF]|[\uD83C-\uDBFF\uDC00-\uDFFF])/g,
      "",
    );
  }

  /* Create Job Card */
  function buildCard(job) {
    const skills = (job.skills || [])
      .map((s) => `<span class="skill-tag">${s}</span>`)
      .join("");

    return `
<div class="job-card">

  <div class="jc-title">${job.title}</div>

  <div class="jc-company">${job.company}</div>

  <div class="jc-meta">
    <i class="fa-solid fa-location-dot"></i> ${job.loc}
  </div>

  <div class="jc-meta">
    <i class="fa-solid fa-layer-group"></i> ${job.level}
  </div>

  <div class="jc-skills">
    ${skills}
  </div>

  <div class="jc-meta">
    ${job.salary || ""}
  </div>

  <button class="btn btn-primary apply-btn"
      data-id="${job.id}"
      data-title="${job.title}">
      Apply
  </button>

</div>
`;
  }

  /* Render Jobs */
  function renderCards(jobs) {
    if (!grid) return;

    if (!jobs.length) {
      grid.innerHTML = "<h3>No jobs found</h3>";

      if (resultCount) resultCount.textContent = "0 jobs";

      return;
    }

    grid.innerHTML = jobs.map(buildCard).join("");

    if (resultCount) resultCount.textContent = `${jobs.length} jobs`;

    bindApplyBtns();
  }

  /* Filter Jobs */
  function filterJobs() {
    const q = stripEmojis((searchInput?.value || "").toLowerCase());

    const type = typeFilter?.value || "all";
    const loc = locFilter?.value || "all";
    const level = levelFilter?.value || "all";

    const filtered = allJobs.filter((j) => {
      const matchQuery =
        !q ||
        [j.title, j.company, ...(j.skills || [])].some((v) =>
          stripEmojis(v).toLowerCase().includes(q),
        );

      return (
        matchQuery &&
        (type === "all" || j.type === type) &&
        (loc === "all" || j.loc === loc) &&
        (level === "all" || j.level === level)
      );
    });

    renderCards(filtered);
  }

  /* Apply Button */
  function bindApplyBtns() {
    document.querySelectorAll(".apply-btn").forEach((btn) => {
      btn.addEventListener("click", function () {
        this.classList.add("applied");

        this.innerHTML = "Applied";
      });
    });
  }

  /* Load Jobs (Demo Data) */
  async function loadJobs() {
    allJobs = [
      {
        id: "1",
        title: "Frontend Developer",
        company: "TechCorp",
        type: "full-time",
        loc: "Hyderabad",
        level: "Junior",
        skills: ["HTML", "CSS", "JavaScript"],
        salary: "6 LPA",
      },

      {
        id: "2",
        title: "Backend Developer",
        company: "InnovateX",
        type: "remote",
        loc: "Remote",
        level: "Mid",
        skills: ["NodeJS", "MongoDB"],
        salary: "10 LPA",
      },

      {
        id: "3",
        title: "UI Designer",
        company: "PixelLab",
        type: "internship",
        loc: "Bangalore",
        level: "Junior",
        skills: ["Figma", "UX"],
        salary: "Stipend",
      },
    ];

    renderCards(allJobs);
  }

  /* Event Listeners (Safe) */

  searchInput?.addEventListener("input", filterJobs);

  typeFilter?.addEventListener("change", filterJobs);

  locFilter?.addEventListener("change", filterJobs);

  levelFilter?.addEventListener("change", filterJobs);

  /* Load Jobs */

  loadJobs();
});
