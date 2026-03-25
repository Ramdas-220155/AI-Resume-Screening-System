from resume_reader import extract_resume_text
from resume_sections import extract_sections
from scoring import evaluate_sections
from scoring_matcher import keyword_match_score
from github_verifier import evaluate_github_bonus


def evaluate_resume(resume_path, job_description):
    resume_text = extract_resume_text(resume_path)
    sections = extract_sections(resume_text)

    # Dynamic semantic comparison
    job = {
        "skills": job_description,
        "experience": job_description,
        "education": job_description,
        "projects": job_description,
    }

    semantic = evaluate_sections(sections, job)

    # Dynamic keyword matching
    keyword_score, matched, resume_skills, job_skills = keyword_match_score(
        resume_text, job_description
    )

    # Final hybrid score
    final_score = keyword_score * 0.7 + semantic["final_score"] * 0.3

    github_result = evaluate_github_bonus(
        resume_text,
        sections.get("projects", ""),
        resume_path=resume_path,
    )
    final_score_with_bonus = min(final_score + github_result["github_bonus"], 100.0)

    return {
        "resume_skills": resume_skills,
        "job_skills": job_skills,
        "matched_skills": matched,

        # Keyword + semantic
        "keyword_score": round(keyword_score, 2),
        "semantic_score": round(float(semantic["final_score"]), 2),
        "final_score": round(float(final_score), 2),
        "final_score_with_bonus": round(float(final_score_with_bonus), 2),
        "github_bonus": github_result["github_bonus"],

        # ADD SECTION SCORES (important)
        "skills_score": round(float(semantic.get("skills_score", 0)), 2),
        "experience_score": round(float(semantic.get("experience_score", 0)), 2),
        "education_score": round(float(semantic.get("education_score", 0)), 2),
        "projects_score": round(float(semantic.get("projects_score", 0)), 2),

        # GitHub verification details
        "github_link_found": github_result["github_link_found"],
        "github_profile_valid": github_result["github_profile_valid"],
        "github_username": github_result["github_username"],
        "github_repo_count": github_result["github_repo_count"],
        "claimed_projects": github_result["claimed_projects"],
        "matched_projects": github_result["matched_projects"],
    }


if __name__ == "__main__":
    job_description = input("Enter Job Description:\n")

    resume_path = r"C:\Users\raman\OneDrive\Desktop\ai_module_hr\AI-Resume-Screening-System\ai_module\resume .pdf"
    result = evaluate_resume(resume_path, job_description)

    print("\n RESULT \n")

    print("\nKeyword Score:", result["keyword_score"])
    print("Semantic Score:", result["semantic_score"])
    print("Final Score:", result["final_score"])
    print("GitHub Bonus:", result["github_bonus"])
    print("Final Score (with bonus):", result["final_score_with_bonus"])

    print("\nMatched Skills:", result["matched_skills"])
    print("GitHub Profile Valid:", result["github_profile_valid"])
    print("Matched Projects:", result["matched_projects"])

