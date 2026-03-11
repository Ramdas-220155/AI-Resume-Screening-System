const reviews = [
  {
    text: "This portfolio demonstrates strong frontend development skills with a clear focus on user experience and clean design.",
    name: "– Sarah Johnson, Hiring Manager",
  },
  {
    text: "A well-structured portfolio that highlights technical ability and creativity. The use of modern web design principles makes it visually appealing perfectly.",
    name: "– Michael Chen, Tech Recruiter",
  },
  {
    text: "The portfolio is organized, easy to navigate, and communicates the candidate's work effectively. Recruiters appreciate portfolios that present information clearly, and this one does exactly that.",
    name: "– Emily Davis, HR Specialist",
  },
];

let index = 0;

document.addEventListener("DOMContentLoaded", function () {
  // ----------- REVIEW CAROUSEL -----------
  const reviewText = document.getElementById("reviewText");
  const reviewName = document.getElementById("reviewName");

  function showReview() {
    reviewText.textContent = reviews[index].text;
    reviewName.textContent = reviews[index].name;
  }

  function nextReview() {
    index = (index + 1) % reviews.length;
    showReview();
  }

  function prevReview() {
    index = (index - 1 + reviews.length) % reviews.length;
    showReview();
  }

  // Show first review
  showReview();

  // Attach arrow buttons
  document.querySelector(".arrow.right").addEventListener("click", nextReview);
  document.querySelector(".arrow.left").addEventListener("click", prevReview);

  // ----------- DROPDOWN -----------
  function toggleDropdown() {
    document.getElementById("loginMenu").classList.toggle("show");
  }

  window.toggleDropdown = toggleDropdown; // make global for onclick

  window.onclick = function (e) {
    if (!e.target.matches(".login")) {
      const dropdown = document.getElementById("loginMenu");
      if (dropdown.classList.contains("show")) {
        dropdown.classList.remove("show");
      }
    }
  };
});
