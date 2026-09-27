def generate_roadmap(skill_gap_analysis):
    """
    Generate a personalized learning roadmap
    from the Skill Gap Agent output.
    """

    target_role = skill_gap_analysis.get(
        "target_role",
        "Target Role"
    )

    target_domain = skill_gap_analysis.get(
        "target_domain",
        "General"
    )

    skill_gaps = skill_gap_analysis.get(
        "skill_gaps",
        []
    )

    # Only consider missing skills
    missing_skills = [
        gap["skill"]
        for gap in skill_gaps
        if gap.get("status") == "Missing"
    ]

    roadmap = []

    # Create one learning stage for every
    # group of skills.
    week = 1

    for skill in missing_skills:
        roadmap.append({
            "week": week,
            "title": f"Learn {skill}",
            "description": (
                f"Study the fundamentals of {skill} "
                f"and practice basic problems or exercises "
                f"related to {skill}."
            ),
            "skill": skill,
            "done": False
        })

        week += 1

    # Add a project stage after learning
    if missing_skills:
        roadmap.append({
            "week": week,
            "title": f"Build a {target_role} Project",
            "description": (
                f"Build a practical project related to "
                f"{target_domain} using the skills learned "
                f"in the roadmap."
            ),
            "skill": "Project",
            "done": False
        })

        week += 1

    # Add interview preparation
    roadmap.append({
        "week": week,
        "title": "Interview Preparation",
        "description": (
            f"Practice technical and interview questions "
            f"for the {target_role} role."
        ),
        "skill": "Interview",
        "done": False
    })

    return {
        "target_role": target_role,
        "target_domain": target_domain,
        "total_weeks": len(roadmap),
        "roadmap": roadmap
    }