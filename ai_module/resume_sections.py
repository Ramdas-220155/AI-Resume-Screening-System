import re

def extract_sections(text):

    text = text.lower()

    sections = {
        "skills": "",
        "experience": "",
        "education": "",
        "projects": ""
    }

    skills_patterns = ["skills", "technical skills", "core competencies"]
    experience_patterns = ["experience", "work experience", "professional experience"]
    education_patterns = ["education", "academic background", "qualifications"]
    project_patterns = ["projects", "portfolio"]

    for pattern in skills_patterns:
        match = re.search(pattern + r"(.*?)(experience|education|projects)", text, re.DOTALL)
        if match:
            sections["skills"] = match.group(1)
            break

    for pattern in experience_patterns:
        match = re.search(pattern + r"(.*?)(education|projects)", text, re.DOTALL)
        if match:
            sections["experience"] = match.group(1)
            break

    for pattern in education_patterns:
        match = re.search(pattern + r"(.*?)(projects)", text, re.DOTALL)
        if match:
            sections["education"] = match.group(1)
            break

    for pattern in project_patterns:
        match = re.search(pattern + r"(.*)", text, re.DOTALL)
        if match:
            sections["projects"] = match.group(1)
            break

    return sections