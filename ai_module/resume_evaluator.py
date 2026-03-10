from resume_reader import extract_resume_text
from resume_sections import extract_sections
from scoring import evaluate_sections


job_requirements = {
    "skills": "python sql machine learning data analysis",
    "experience": "software development backend engineering",
    "education": "computer science degree",
    "projects": "machine learning backend or data projects"
}


def evaluate_resume(resume_path):

    resume_text = extract_resume_text(resume_path)

    sections = extract_sections(resume_text)

    scores = evaluate_sections(sections, job_requirements)

    return scores


if __name__ == "__main__":

    resume_path = "ai_module/data_analyst_resume_3.pdf"

    result = evaluate_resume(resume_path)

    print("\nCandidate Evaluation\n")

    print("Skills Score:", result["skills_score"])
    print("Experience Score:", result["experience_score"])
    print("Education Score:", result["education_score"])
    print("Projects Score:", result["projects_score"])

    print("\nExtracted Sections\n")
    print(sections)

    print("\nFinal Score:", result["final_score"])