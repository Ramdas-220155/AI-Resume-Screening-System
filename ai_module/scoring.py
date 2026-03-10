from section_matcher import semantic_score


def evaluate_sections(resume_sections, job_requirements):

    skills_score = semantic_score(
        resume_sections["skills"],
        job_requirements["skills"]
    )

    experience_score = semantic_score(
        resume_sections["experience"],
        job_requirements["experience"]
    )

    education_score = semantic_score(
        resume_sections["education"],
        job_requirements["education"]
    )

    projects_score = semantic_score(
        resume_sections["projects"],
        job_requirements["projects"]
    )

    final_score = (
        skills_score * 0.4 +
        experience_score * 0.3 +
        projects_score * 0.2 +
        education_score * 0.1
    )

    return {
        "skills_score": skills_score,
        "experience_score": experience_score,
        "education_score": education_score,
        "projects_score": projects_score,
        "final_score": round(final_score, 2)
    }