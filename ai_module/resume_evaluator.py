from resume_reader import extract_resume_text
from resume_sections import extract_sections
from scoring import evaluate_sections
from scoring_matcher import keyword_match_score


def evaluate_resume(resume_path, job_description):

    resume_text = extract_resume_text(resume_path)

    sections = extract_sections(resume_text)

    # Dynamic semantic comparison
    job = {
        "skills": job_description,
        "experience": job_description,
        "education": job_description,
        "projects": job_description
    }

    semantic = evaluate_sections(sections, job)

    # Dynamic keyword matching
    keyword_score, matched, resume_skills, job_skills = keyword_match_score(
        resume_text, job_description
    )

    # Final hybrid score
    final_score = (
        keyword_score * 0.7 +
        semantic["final_score"] * 0.3
    )

    return {
    "resume_skills": resume_skills,
    "job_skills": job_skills,
    "matched_skills": matched,

    # Keyword + semantic
    "keyword_score": round(keyword_score, 2),
    "semantic_score": round(float(semantic["final_score"]), 2),
    "final_score": round(float(final_score), 2),

    # ADD SECTION SCORES (important)
    "skills_score": round(float(semantic.get("skills", 0)), 2),
    "experience_score": round(float(semantic.get("experience", 0)), 2),
    "education_score": round(float(semantic.get("education", 0)), 2),
    "projects_score": round(float(semantic.get("projects", 0)), 2),
}


if __name__ == "__main__":

    job_description = input("Enter Job Description:\n")

    resume_path = "data_analyst_resume_3.pdf"

    result = evaluate_resume(resume_path, job_description)

    print("\n RESULT \n")

    print("\nKeyword Score:", result["keyword_score"])
    print("Semantic Score:", result["semantic_score"])
    print("Final Score:", result["final_score"])

    print("\nMatched Skills:", result["matched_skills"])