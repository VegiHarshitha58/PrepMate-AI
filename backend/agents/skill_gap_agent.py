SKILL_LEVELS = {
    "beginner": 0,
    "basic": 1,
    "intermediate": 2,
    "advanced": 3
}

SKILL_PRIORITY = {
    "python": "High",
    "sql": "High",
    "data structures": "High",
    "javascript": "High",
    "react": "High",
    "machine learning": "High",
    "statistics": "Medium",
    "pandas": "Medium",
    "numpy": "Medium",
    "scikit-learn": "Medium",
    "git": "Medium",
    "github": "Low",
    "html": "Low",
    "css": "Low"
}


def analyze_skill_gaps(
    resume_analysis: dict,
    job_analysis: dict
):
    current_skills = {
        skill.lower()
        for skill in resume_analysis.get("skills", [])
    }

    job_matches = job_analysis.get("job_matches", [])

    if not job_matches:
        return {
            "skill_gaps": [],
            "total_gaps": 0
        }

    # Use the highest matched job as the primary target
    primary_job = job_matches[0]

    required_skills = set()

    required_skills.update(
        skill.lower()
        for skill in primary_job.get("missing_skills", [])
    )

    required_skills.update(
        skill.lower()
        for skill in primary_job.get("matching_skills", [])
    )

    gaps = []

    for skill in sorted(required_skills):

        if skill in current_skills:
            status = "Already Have"
            priority = "None"
            reason = "This skill is already present in the resume."

        else:
            status = "Missing"
            priority = SKILL_PRIORITY.get(
                skill,
                "Medium"
            )
            reason = (
                f"{skill.title()} is required for "
                f"{primary_job['role']}."
            )

        gaps.append({
            "skill": skill,
            "status": status,
            "priority": priority,
            "reason": reason
        })

    missing_count = sum(
        1 for gap in gaps
        if gap["status"] == "Missing"
    )

    return {
        "target_role": primary_job["role"],
        "target_domain": primary_job["domain"],
        "skill_gaps": gaps,
        "missing_skills_count": missing_count,
        "total_required_skills": len(gaps)
    }