import json
import os
import re
from urllib.error import HTTPError, URLError
from urllib.parse import urlparse
from urllib.request import Request, urlopen

import pdfplumber


GITHUB_URL_PATTERN = re.compile(
    r"(?:https?://)?(?:www\.)?github\.com/[A-Za-z0-9_.-]+(?:/[A-Za-z0-9_.-]+)?",
    re.IGNORECASE,
)
GITHUB_HANDLE_PATTERN = re.compile(
    r"github(?:\s*(?:id|profile|handle))?\s*[:\-]?\s*@?([A-Za-z0-9-]{1,39})",
    re.IGNORECASE,
)


def _fetch_json(url):
    request = Request(
        url,
        headers={
            "Accept": "application/vnd.github+json",
            "User-Agent": "ai-resume-screening-system",
        },
    )
    with urlopen(request, timeout=10) as response:
        data = response.read().decode("utf-8")
        return json.loads(data)


def extract_github_links_from_pdf(pdf_path):
    if not pdf_path or not os.path.exists(pdf_path):
        return []
    if os.path.splitext(pdf_path)[1].lower() != ".pdf":
        return []

    links = []
    try:
        with pdfplumber.open(pdf_path) as pdf:
            for page in pdf.pages:
                for hyperlink in (getattr(page, "hyperlinks", []) or []):
                    uri = hyperlink.get("uri")
                    if uri and "github.com" in uri.lower():
                        links.append(uri)
    except Exception:
        return []

    return list(set(links))


def extract_github_links(text, resume_path=None):
    text_links = []
    if text:
        raw_links = GITHUB_URL_PATTERN.findall(text)
        text_links = [
            link if link.lower().startswith(("http://", "https://")) else f"https://{link}"
            for link in raw_links
        ]
        if not text_links:
            handles = GITHUB_HANDLE_PATTERN.findall(text)
            text_links = [f"https://github.com/{handle}" for handle in handles]

    pdf_links = extract_github_links_from_pdf(resume_path)
    normalized_pdf_links = [
        link if link.lower().startswith(("http://", "https://")) else f"https://{link}"
        for link in pdf_links
    ]
    return list(set(text_links + normalized_pdf_links))


def select_primary_github_link(links):
    if not links:
        return None

    # Prefer profile URLs over repository URLs.
    for link in links:
        _, repo = parse_profile_and_repo(link)
        if repo is None:
            return link
    return links[0]


def parse_profile_and_repo(url):
    parsed = urlparse(url)
    parts = [part for part in parsed.path.strip("/").split("/") if part]
    if not parts:
        return None, None
    username = parts[0]
    repo = parts[1] if len(parts) > 1 else None
    return username, repo


def verify_github_profile(username):
    if not username:
        return False, None
    try:
        profile = _fetch_json(f"https://api.github.com/users/{username}")
        return True, profile
    except (HTTPError, URLError, TimeoutError, json.JSONDecodeError):
        return False, None


def fetch_repo_names(username, max_pages=3):
    repo_names = []
    for page in range(1, max_pages + 1):
        try:
            repos = _fetch_json(
                f"https://api.github.com/users/{username}/repos?per_page=100&page={page}"
            )
        except (HTTPError, URLError, TimeoutError, json.JSONDecodeError):
            break
        if not isinstance(repos, list) or not repos:
            break
        for repo in repos:
            name = (repo.get("name") or "").strip().lower()
            if name:
                repo_names.append(name)
    return list(set(repo_names))


def extract_claimed_projects(project_text):
    if not project_text:
        return []

    candidates = []
    lines = re.split(r"[\n\r•\-|]+", project_text.lower())

    for line in lines:
        clean = re.sub(r"[^a-z0-9 _-]", " ", line)
        clean = re.sub(r"\s+", " ", clean).strip()
        if len(clean) < 4:
            continue
        # Keep compact project title-like chunks.
        if len(clean.split()) <= 8:
            candidates.append(clean)

    return list(set(candidates))


def _token_overlap_score(a, b):
    a_tokens = set(re.findall(r"[a-z0-9]+", a.lower()))
    b_tokens = set(re.findall(r"[a-z0-9]+", b.lower()))
    if not a_tokens or not b_tokens:
        return 0.0
    return len(a_tokens & b_tokens) / len(a_tokens)


def match_projects_with_repos(claimed_projects, repo_names):
    matched = []
    repo_set = set(repo_names)

    for claim in claimed_projects:
        normalized_claim = claim.replace(" ", "-")
        if normalized_claim in repo_set or claim in repo_set:
            matched.append(claim)
            continue

        # Fuzzy token overlap for human-written resume project titles.
        for repo in repo_names:
            if _token_overlap_score(claim, repo) >= 0.6:
                matched.append(claim)
                break

    return list(set(matched))


def evaluate_github_bonus(resume_text, project_section_text, resume_path=None):
    links = extract_github_links(resume_text, resume_path=resume_path)
    if not links:
        return {
            "github_link_found": False,
            "github_profile_valid": False,
            "github_username": None,
            "github_repo_count": 0,
            "claimed_projects": [],
            "matched_projects": [],
            "github_bonus": 0.0,
        }

    primary_link = select_primary_github_link(links)
    username, linked_repo = parse_profile_and_repo(primary_link)
    profile_valid, _ = verify_github_profile(username)

    if not profile_valid:
        return {
            "github_link_found": True,
            "github_profile_valid": False,
            "github_username": username,
            "github_repo_count": 0,
            "claimed_projects": [],
            "matched_projects": [],
            "github_bonus": 0.0,
        }

    repo_names = fetch_repo_names(username)
    claimed_projects = extract_claimed_projects(project_section_text)
    if linked_repo:
        claimed_projects.append(linked_repo.lower())
        claimed_projects = list(set(claimed_projects))

    matched_projects = match_projects_with_repos(claimed_projects, repo_names)

    profile_bonus = 3.0  # valid GitHub profile
    project_bonus = min(len(matched_projects) * 1.5, 7.0)  # capped project verification bonus
    total_bonus = profile_bonus + project_bonus

    return {
        "github_link_found": True,
        "github_profile_valid": True,
        "github_username": username,
        "github_repo_count": len(repo_names),
        "claimed_projects": claimed_projects,
        "matched_projects": matched_projects,
        "github_bonus": round(total_bonus, 2),
    }
