JOB_ROLES = [
    {
        "role": "Python Developer",
        "domain": "Software Development",
        "skills": {"python", "sql", "git"},
        "level": "Entry Level"
    },
    {
        "role": "Frontend Developer",
        "domain": "Web Development",
        "skills": {"html", "css", "javascript", "react"},
        "level": "Entry Level"
    },
    {
        "role": "Backend Developer",
        "domain": "Backend Development",
        "skills": {"python", "fastapi", "flask", "sql", "postgresql"},
        "level": "Entry Level"
    },
    {
        "role": "Data Analyst",
        "domain": "Data Analytics",
        "skills": {"python", "sql", "excel", "power bi", "tableau"},
        "level": "Entry Level"
    },
    {
        "role": "Data Scientist",
        "domain": "Data Science",
        "skills": {"python", "pandas", "numpy", "sql", "machine learning"},
        "level": "Entry Level"
    },
    {
        "role": "Machine Learning Engineer",
        "domain": "AI / Machine Learning",
        "skills": {
            "python",
            "machine learning",
            "scikit-learn",
            "tensorflow",
            "pytorch"
        },
        "level": "Entry Level"
    },
    {
        "role": "AI/ML Intern",
        "domain": "AI / Machine Learning",
        "skills": {"python", "machine learning", "nlp"},
        "level": "Internship"
    },
    {
        "role": "Web Developer",
        "domain": "Web Development",
        "skills": {"html", "css", "javascript"},
        "level": "Entry Level"
    }
]


def match_jobs(skills: list[str], domains: list[str] | None = None):

    user_skills = {skill.lower() for skill in skills}
    domains = domains or []

    matches = []

    for job in JOB_ROLES:

        required_skills = job["skills"]

        matching_skills = sorted(
            user_skills.intersection(required_skills)
        )

        missing_skills = sorted(
            required_skills - user_skills
        )

        skill_match = (
            len(matching_skills) / len(required_skills) * 100
            if required_skills
            else 0
        )

        domain_bonus = (
            10
            if job["domain"] in domains
            else 0
        )

        match_percentage = min(
            round(skill_match + domain_bonus),
            100
        )

        matches.append({
            "role": job["role"],
            "domain": job["domain"],
            "level": job["level"],
            "match_percentage": match_percentage,
            "matching_skills": matching_skills,
            "missing_skills": missing_skills
        })

    matches.sort(
        key=lambda x: x["match_percentage"],
        reverse=True
    )

    return matches


def analyze_job_matches(
    resume_analysis: dict,
    career_analysis: dict
):

    skills = resume_analysis.get("skills", [])

    domains = [
        item["domain"]
        for item in career_analysis.get(
            "recommended_domains", []
        )
    ]

    matches = match_jobs(
        skills,
        domains
    )

    return {
        "job_matches": matches[:5],
        "skills_used": skills
    }