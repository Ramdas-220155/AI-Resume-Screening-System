SKILLS = [
    "python","java","c++","sql","excel","power bi","tableau",
    "machine learning","deep learning","data analysis","analytics",
    "html","css","javascript","react","node","mongodb",
    "aws","azure","docker","kubernetes",
    "communication","leadership","management"
]

def extract_skills(text):

    text = text.lower()
    found = []

    for skill in SKILLS:
        if skill in text:
            found.append(skill)

    return list(set(found))


def keyword_match_score(resume_text, job_text):

    resume_skills = extract_skills(resume_text)
    job_skills = extract_skills(job_text)

    matched = set(resume_skills) & set(job_skills)

    if len(job_skills) == 0:
        return 0, [], resume_skills, job_skills

    score = (len(matched) / len(job_skills)) * 100

    return round(score, 2), list(matched), resume_skills, job_skills