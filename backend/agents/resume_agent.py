import re
import spacy

nlp = spacy.load("en_core_web_sm")

SKILLS = [
    "python", "java", "c", "c++", "javascript", "typescript",
    "html", "css", "react", "node.js", "express", "fastapi",
    "flask", "sql", "mysql", "postgresql", "mongodb",
    "git", "github", "docker", "aws",
    "machine learning", "deep learning", "artificial intelligence",
    "data science", "data analysis", "power bi", "tableau",
    "tensorflow", "pytorch", "scikit-learn", "pandas", "numpy",
    "nlp", "langchain", "langgraph"
]

EDUCATION_KEYWORDS = [
    "b.tech", "btech", "b.e", "bachelor", "m.tech", "mtech",
    "mca", "degree", "computer science", "engineering"
]

SECTION_NAMES = [
    "education",
    "skills",
    "technical skills",
    "projects",
    "experience",
    "work experience",
    "internships",
    "certifications",
    "achievements"
]


def extract_skills(text: str):
    text_lower = text.lower()
    found_skills = []

    for skill in SKILLS:
        if skill in text_lower:
            found_skills.append(skill)

    return sorted(set(found_skills))


def extract_email(text: str):
    match = re.search(
        r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}",
        text
    )
    return match.group(0) if match else None


def extract_phone(text: str):
    match = re.search(
        r"(?:\+91[\s-]?)?[6-9]\d{9}",
        text
    )
    return match.group(0) if match else None


def detect_sections(text: str):
    text_lower = text.lower()
    detected = []

    for section in SECTION_NAMES:
        if section in text_lower:
            detected.append(section)

    return sorted(set(detected))


def extract_education(text: str):
    lines = text.splitlines()
    education = []

    for line in lines:
        line_clean = line.strip()

        if not line_clean:
            continue

        line_lower = line_clean.lower()

        if any(keyword in line_lower for keyword in EDUCATION_KEYWORDS):
            education.append(line_clean)

    return education[:10]


def calculate_resume_score(
    skills,
    education,
    sections,
    email,
    phone
):
    score = 0

    if email:
        score += 10

    if phone:
        score += 10

    if skills:
        score += 25

    if education:
        score += 20

    important_sections = {
        "projects",
        "experience",
        "internships",
        "certifications"
    }

    score += min(
        len(set(sections) & important_sections) * 8,
        24
    )

    return min(score, 100)


def analyze_resume(text: str):
    doc = nlp(text)

    skills = extract_skills(text)
    education = extract_education(text)
    sections = detect_sections(text)

    email = extract_email(text)
    phone = extract_phone(text)

    score = calculate_resume_score(
        skills,
        education,
        sections,
        email,
        phone
    )

    return {
        "candidate_email": email,
        "candidate_phone": phone,
        "skills": skills,
        "education": education,
        "detected_sections": sections,
        "resume_score": score,
        "word_count": len(doc),
    }