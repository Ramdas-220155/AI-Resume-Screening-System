const reviews = [
  {
    text: "This portfolio demonstrates strong frontend development skills with a clear focus on user experience and clean design.",
    name: "– Sarah Johnson, Hiring Manager",
  },
  {
    text: "A well-structured portfolio that highlights technical ability and creativity. The use of modern web design principles makes it visually appealling perfectly.",
    name: "– Michael Chen, Tech Recruiter",
  },
  {
    text: "The portfolio is organized, easy to navigate, and communicates the candidate's work effectively. Recruiters appreciate portfolios that present information clearly, and this one does exactly that.",
    name: "– Emily Davis, HR Specialist",
  },
];

let index = 0;

function showReview() {
  document.getElementById("reviewText").textContent = reviews[index].text;
  document.getElementById("reviewName").textContent = reviews[index].name;
}

function nextReview() {
  index = (index + 1) % reviews.length;
  showReview();
}

function prevReview() {
  index = (index - 1 + reviews.length) % reviews.length;
  showReview();
}
const faqItems = document.querySelectorAll(".faq-item");

faqItems.forEach((item) => {
  item.addEventListener("click", () => {
    item.classList.toggle("active");
  });
});
