import re

def extract_sections(text):

    text = text.lower()

    sections = {
        "skills": "",
        "experience": "",
        "education": "",
        "projects": ""
    }

    patterns = {
        "skills": r"(skills|technical skills)(.*?)(experience|education|projects)",
        "experience": r"(experience|work experience)(.*?)(education|projects)",
        "education": r"(education|academic)(.*?)(projects)",
        "projects": r"(projects|portfolio)(.*)"
    }

    for key, pattern in patterns.items():
        match = re.search(pattern, text, re.DOTALL)
        if match:
            sections[key] = match.group(2)

    return sections