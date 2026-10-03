from services.ai_service import generate_json


def _normalize_roadmap(roadmap):
    if not isinstance(roadmap, list):
        return []

    normalized = []

    for index, item in enumerate(roadmap, start=1):

        if not isinstance(item, dict):
            continue

        title = str(
            item.get("title", "")
        ).strip()

        description = str(
            item.get("description", "")
        ).strip()

        if not title or not description:
            continue

        skill = str(
            item.get("skill", "General")
        ).strip()

        try:
            week = int(
                item.get("week", index)
            )
        except (TypeError, ValueError):
            week = index

        normalized.append({
            "week": week,
            "title": title,
            "description": description,
            "skill": skill or "General",
            "done": bool(
                item.get("done", False)
            ),
        })

    normalized.sort(
        key=lambda item: item["week"]
    )

    for index, item in enumerate(
        normalized,
        start=1
    ):
        item["week"] = index

    return normalized


def _unique_skills(skills):

    result = []
    seen = set()

    for skill in skills:

        skill = str(skill).strip()

        if not skill:
            continue

        key = skill.lower()

        if key not in seen:
            seen.add(key)
            result.append(skill)

    return result


def _get_priority_gaps(skill_gap_analysis):

    gaps = skill_gap_analysis.get(
        "skill_gaps",
        []
    )

    if not isinstance(gaps, list):
        return []

    priority_order = {
        "high": 0,
        "medium": 1,
        "low": 2,
    }

    missing = []

    for gap in gaps:

        if not isinstance(gap, dict):
            continue

        if str(
            gap.get("status", "")
        ).lower() != "missing":
            continue

        skill = str(
            gap.get("skill", "")
        ).strip()

        if not skill:
            continue

        priority = str(
            gap.get("priority", "Medium")
        ).strip()

        reason = str(
            gap.get("reason", "")
        ).strip()

        missing.append({
            "skill": skill,
            "priority": priority,
            "reason": reason,
        })

    missing.sort(
        key=lambda item:
        priority_order.get(
            item["priority"].lower(),
            3,
        )
    )

    return missing


# =========================================================
# FALLBACK ROADMAP
# =========================================================

def _build_roadmap(
    target_role,
    target_domain,
    current_skills,
    gaps,
    primary_job,
):

    roadmap = []

    week = 1

    # -----------------------------------------------------
    # Role orientation
    # -----------------------------------------------------

    roadmap.append({
        "week": week,
        "title": f"Understand the {target_role} Role",
        "description": (
            f"Study the responsibilities, common tools, "
            f"skills and expectations associated with "
            f"{target_role}."
        ),
        "skill": target_role,
        "done": False,
    })

    week += 1

    # -----------------------------------------------------
    # High-priority gaps
    # -----------------------------------------------------

    high_priority = [
        gap
        for gap in gaps
        if gap["priority"].lower() == "high"
    ]

    medium_priority = [
        gap
        for gap in gaps
        if gap["priority"].lower() == "medium"
    ]

    low_priority = [
        gap
        for gap in gaps
        if gap["priority"].lower() == "low"
    ]

    for gap in high_priority:

        skill = gap["skill"]

        roadmap.append({
            "week": week,
            "title": f"Learn {skill}",
            "description": (
                f"Build a strong foundation in {skill}. "
                f"Focus on concepts and practical usage "
                f"relevant to {target_role}."
            ),
            "skill": skill,
            "done": False,
        })

        week += 1

        roadmap.append({
            "week": week,
            "title": f"Practice {skill}",
            "description": (
                f"Solve practical exercises using {skill}. "
                f"Apply it to small role-related problems."
            ),
            "skill": skill,
            "done": False,
        })

        week += 1

    # -----------------------------------------------------
    # Medium-priority gaps
    # -----------------------------------------------------

    for gap in medium_priority:

        skill = gap["skill"]

        roadmap.append({
            "week": week,
            "title": f"Develop {skill}",
            "description": (
                f"Learn the important concepts of {skill} "
                f"and practice the parts most relevant to "
                f"{target_role}."
            ),
            "skill": skill,
            "done": False,
        })

        week += 1

    # -----------------------------------------------------
    # Supporting skills
    # -----------------------------------------------------

    if low_priority:

        skills = _unique_skills([
            gap["skill"]
            for gap in low_priority
        ])

        roadmap.append({
            "week": week,
            "title": "Build Supporting Skills",
            "description": (
                "Practice the supporting skills identified "
                "for your target role: "
                + ", ".join(skills)
                + "."
            ),
            "skill": ", ".join(skills),
            "done": False,
        })

        week += 1

    # -----------------------------------------------------
    # Project
    # -----------------------------------------------------

    matching_skills = _unique_skills(
        primary_job.get(
            "matching_skills",
            []
        )
        if isinstance(primary_job, dict)
        else []
    )

    project_skills = _unique_skills(
        matching_skills
        + [
            gap["skill"]
            for gap in gaps
            if gap["priority"].lower()
            in {"high", "medium"}
        ]
    )

    project_focus = (
        ", ".join(project_skills[:5])
        if project_skills
        else target_role
    )

    roadmap.append({
        "week": week,
        "title": f"Build a {target_role} Project",
        "description": (
            f"Build one practical project related to "
            f"{target_role} using {project_focus}. "
            f"Include implementation, testing and "
            f"documentation."
        ),
        "skill": project_focus,
        "done": False,
    })

    week += 1

    # -----------------------------------------------------
    # Resume
    # -----------------------------------------------------

    roadmap.append({
        "week": week,
        "title": "Strengthen Resume Evidence",
        "description": (
            f"Document the work completed for your "
            f"{target_role} preparation. Add measurable "
            f"project outcomes and technologies actually used."
        ),
        "skill": "Resume & Project Presentation",
        "done": False,
    })

    week += 1

    # -----------------------------------------------------
    # Interview
    # -----------------------------------------------------

    roadmap.append({
        "week": week,
        "title": f"Prepare for {target_role} Interviews",
        "description": (
            f"Practice technical questions related to "
            f"{target_role}, your skill gaps and your projects."
        ),
        "skill": "Interview Preparation",
        "done": False,
    })

    return _normalize_roadmap(roadmap)


# =========================================================
# MAIN ROADMAP FUNCTION
# =========================================================

def generate_roadmap(
    skill_gap_analysis,
    resume_analysis=None,
    job_analysis=None,
):

    resume_analysis = resume_analysis or {}
    job_analysis = job_analysis or {}

    target_role = str(
        skill_gap_analysis.get(
            "target_role",
            "Target Role",
        )
    ).strip()

    target_domain = str(
        skill_gap_analysis.get(
            "target_domain",
            "General",
        )
    ).strip()

    current_skills = _unique_skills(
        resume_analysis.get(
            "skills",
            []
        )
    )

    gaps = _get_priority_gaps(
        skill_gap_analysis
    )

    jobs = job_analysis.get(
        "job_matches",
        []
    )

    if not isinstance(jobs, list):
        jobs = []

    primary_job = (
        jobs[0]
        if jobs and isinstance(jobs[0], dict)
        else {}
    )

    # =====================================================
    # PRIMARY: LOCAL AI
    # =====================================================

    prompt = f"""
You are the Personalized Learning Roadmap Agent
in PrepMate AI.

Create a realistic placement-preparation roadmap
for this candidate.

The roadmap must be based on the candidate's ACTUAL
skills, actual missing skills, target role and available
resume evidence.

IMPORTANT RULES:

1. Do not invent candidate experience or achievements.
2. Prioritize missing skills identified by the Skill Gap Agent.
3. High-priority gaps should receive more learning/practice time.
4. Build practical learning steps, not generic motivational advice.
5. Include hands-on practice.
6. Include at least one role-relevant project.
7. Include resume/project presentation preparation.
8. Include interview preparation.
9. Do not teach skills the candidate already clearly possesses
   unless they are needed for advanced role preparation.
10. Keep the roadmap realistic for a student preparing for
    entry-level placement.
11. Create between 6 and 12 weeks.
12. Each week must have a clear learning objective.
13. Return ONLY valid JSON.

Return exactly:

{{
  "target_role": "{target_role}",
  "target_domain": "{target_domain}",
  "total_weeks": 0,
  "roadmap": [
    {{
      "week": 1,
      "title": "Short weekly objective",
      "description": "Specific actions the student should complete.",
      "skill": "Primary skill",
      "done": false
    }}
  ]
}}

Candidate skills:

{current_skills}

Resume evidence:

{{
  "education": {resume_analysis.get("education", [])},
  "projects": {resume_analysis.get("projects", [])},
  "experience": {resume_analysis.get("experience", [])},
  "certifications": {resume_analysis.get("certifications", [])},
  "achievements": {resume_analysis.get("achievements", [])}
}}

Skill-gap analysis:

{skill_gap_analysis}

Primary job match:

{primary_job}
"""

    ai = generate_json(
        prompt,
        system=(
            "You are a careful placement-learning AI. "
            "Create practical personalized roadmaps. "
            "Never invent candidate information. "
            "Return only valid JSON."
        ),
    )

    if isinstance(ai, dict):

        normalized = _normalize_roadmap(
            ai.get("roadmap", [])
        )

        if normalized:

            return {
                "target_role": str(
                    ai.get(
                        "target_role",
                        target_role,
                    )
                ).strip() or target_role,

                "target_domain": str(
                    ai.get(
                        "target_domain",
                        target_domain,
                    )
                ).strip() or target_domain,

                "total_weeks": len(
                    normalized
                ),

                "roadmap": normalized,
            }

    # =====================================================
    # FALLBACK
    # =====================================================

    roadmap = _build_roadmap(
        target_role=target_role,
        target_domain=target_domain,
        current_skills=current_skills,
        gaps=gaps,
        primary_job=primary_job,
    )

    return {
        "target_role": target_role,
        "target_domain": target_domain,
        "total_weeks": len(roadmap),
        "roadmap": roadmap,
    }