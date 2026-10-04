from services.ai_service import generate_json


# ============================================================
# HELPERS
# ============================================================

def _normalize_list(value):
    if not isinstance(value, list):
        return []

    result = []
    seen = set()

    for item in value:
        if isinstance(item, dict):
            item = str(item)

        item = str(item).strip()

        if not item:
            continue

        key = item.lower()

        if key not in seen:
            seen.add(key)
            result.append(item)

    return result


def _safe_score(value):
    try:
        return max(
            0,
            min(
                100,
                round(float(value)),
            ),
        )
    except (TypeError, ValueError):
        return 0


def _has_section(sections, *names):
    normalized = {
        str(section).strip().lower()
        for section in sections
    }

    return any(
        name.lower() in normalized
        for name in names
    )


def _clean_value(value):
    if value is None:
        return ""

    return str(value).strip()


def _extract_missing_skills(skill_gap_analysis):
    """
    Extract missing skills from different possible
    Skill Gap Agent response formats.
    """

    if not isinstance(skill_gap_analysis, dict):
        return []

    missing_skills = []

    possible_keys = [
        "missing_skills",
        "gaps",
        "skill_gaps",
        "missing",
    ]

    for key in possible_keys:
        value = skill_gap_analysis.get(key, [])

        if not isinstance(value, list):
            continue

        for item in value:
            if isinstance(item, dict):
                skill = (
                    item.get("skill")
                    or item.get("name")
                    or ""
                )

                if skill:
                    missing_skills.append(
                        str(skill)
                    )

            elif item:
                missing_skills.append(
                    str(item)
                )

    return _normalize_list(missing_skills)


# ============================================================
# DETERMINISTIC FALLBACK
# ============================================================

def _optimize_resume(
    resume_analysis: dict,
    career_analysis: dict | None = None,
    job_analysis: dict | None = None,
    skill_gap_analysis: dict | None = None,
):
    """
    Deterministic fallback.

    This is used only when the local AI model does not
    return a valid response.
    """

    career_analysis = (
        career_analysis
        if isinstance(career_analysis, dict)
        else {}
    )

    job_analysis = (
        job_analysis
        if isinstance(job_analysis, dict)
        else {}
    )

    skill_gap_analysis = (
        skill_gap_analysis
        if isinstance(skill_gap_analysis, dict)
        else {}
    )

    score = _safe_score(
        resume_analysis.get(
            "resume_score",
            0,
        )
    )

    skills = _normalize_list(
        resume_analysis.get(
            "skills",
            [],
        )
    )

    education = _normalize_list(
        resume_analysis.get(
            "education",
            [],
        )
    )

    sections = _normalize_list(
        resume_analysis.get(
            "detected_sections",
            [],
        )
    )

    candidate_email = _clean_value(
        resume_analysis.get(
            "candidate_email"
        )
    )

    candidate_phone = _clean_value(
        resume_analysis.get(
            "candidate_phone"
        )
    )

    suggestions = []
    warnings = []

    # --------------------------------------------------------
    # CONTACT INFORMATION
    # --------------------------------------------------------

    if not candidate_email:
        warnings.append(
            "Email address was not detected in the resume."
        )

        suggestions.append(
            "Add a professional email address to the resume header."
        )

    if not candidate_phone:
        warnings.append(
            "Phone number was not detected in the resume."
        )

        suggestions.append(
            "Add a reachable phone number to the resume contact section."
        )

    # --------------------------------------------------------
    # EDUCATION
    # --------------------------------------------------------

    if not education:
        warnings.append(
            "Education information was not detected."
        )

        suggestions.append(
            "Add your relevant education details, including degree and institution."
        )

    # --------------------------------------------------------
    # SKILLS
    # --------------------------------------------------------

    if not skills:
        warnings.append(
            "No technical skills were detected."
        )

        suggestions.append(
            "Add the technical skills that you can genuinely demonstrate."
        )

    # --------------------------------------------------------
    # RESUME SECTIONS
    # --------------------------------------------------------

    if not _has_section(
        sections,
        "Projects",
        "Project",
    ):
        suggestions.append(
            "Add a Projects section containing relevant academic, personal or verified projects."
        )

    if not _has_section(
        sections,
        "Experience",
        "Internships",
        "Internship",
        "Work Experience",
    ):
        suggestions.append(
            "If you have verified internship or work experience, present it in a clearly labeled Experience section."
        )

    if not _has_section(
        sections,
        "Certifications",
        "Certificates",
    ):
        suggestions.append(
            "Add relevant certifications only when you have actually completed them."
        )

    if not _has_section(
        sections,
        "Summary",
        "Objective",
        "Profile",
    ):
        suggestions.append(
            "Consider adding a concise professional summary aligned with your target role."
        )

    # --------------------------------------------------------
    # CAREER DOMAIN
    # --------------------------------------------------------

    recommended_domains = career_analysis.get(
        "recommended_domains",
        [],
    )

    domain_names = []

    if isinstance(
        recommended_domains,
        list,
    ):
        for item in recommended_domains[:3]:
            if isinstance(item, dict):
                domain = (
                    item.get("domain")
                    or item.get("name")
                    or ""
                )

                if domain:
                    domain_names.append(
                        str(domain)
                    )

    if domain_names:
        suggestions.append(
            "Align the resume summary, projects and skills presentation with the strongest recommended career domains: "
            + ", ".join(domain_names)
            + "."
        )

    # --------------------------------------------------------
    # JOB ROLE
    # --------------------------------------------------------

    job_matches = job_analysis.get(
        "job_matches",
        [],
    )

    role_names = []

    if isinstance(
        job_matches,
        list,
    ):
        for job in job_matches[:3]:
            if isinstance(job, dict):
                role = (
                    job.get("role")
                    or job.get("title")
                    or ""
                )

                if role:
                    role_names.append(
                        str(role)
                    )

    if role_names:
        suggestions.append(
            "Prioritize resume evidence that is relevant to realistic target roles such as: "
            + ", ".join(role_names)
            + "."
        )

    # --------------------------------------------------------
    # SKILL GAPS
    # --------------------------------------------------------

    missing_skills = _extract_missing_skills(
        skill_gap_analysis
    )

    if missing_skills:
        suggestions.append(
            "Where truthful and supported by your actual learning or experience, strengthen evidence for relevant skill gaps identified by the Skill Gap Agent: "
            + ", ".join(missing_skills[:8])
            + ". Do not claim skills you have not learned."
        )

    # --------------------------------------------------------
    # SCORE-BASED SUGGESTIONS
    # --------------------------------------------------------

    if score < 50:
        suggestions.append(
            "Improve completeness, structure and evidence of technical work before using the resume for placements."
        )

    elif score < 70:
        suggestions.append(
            "Strengthen the resume by improving project evidence, technical detail and clarity of the existing sections."
        )

    elif score < 85:
        suggestions.append(
            "Refine project descriptions and existing achievements with concise, specific evidence where available."
        )

    else:
        suggestions.append(
            "Keep the resume concise and continue updating it with new verified projects, skills and achievements."
        )

    # --------------------------------------------------------
    # GENERAL QUALITY
    # --------------------------------------------------------

    suggestions.append(
        "Use consistent formatting, section headings and bullet-point structure throughout the resume."
    )

    suggestions.append(
        "Describe only skills, projects, experience and achievements that you can genuinely demonstrate."
    )

    return {
        "resume_score": score,
        "suggestions": _normalize_list(
            suggestions
        ),
        "warnings": _normalize_list(
            warnings
        ),
        "detected_skills": skills,
        "detected_sections": sections,
    }


# ============================================================
# MAIN RESUME OPTIMIZER
# ============================================================

def optimize_resume(
    resume_analysis: dict,
    career_analysis: dict | None = None,
    job_analysis: dict | None = None,
    skill_gap_analysis: dict | None = None,
):
    """
    Optimize a resume using the local AI model.

    AI receives:
        1. Resume analysis
        2. Career-domain analysis
        3. Job-matching analysis
        4. Skill-gap analysis

    Primary:
        Ollama / local LLM

    Fallback:
        Deterministic resume optimization
    """

    # --------------------------------------------------------
    # VALIDATE INPUT
    # --------------------------------------------------------

    if not isinstance(
        resume_analysis,
        dict,
    ):
        raise ValueError(
            "resume_analysis must be a dictionary."
        )

    if not isinstance(
        career_analysis,
        dict,
    ):
        career_analysis = {}

    if not isinstance(
        job_analysis,
        dict,
    ):
        job_analysis = {}

    if not isinstance(
        skill_gap_analysis,
        dict,
    ):
        skill_gap_analysis = {}

    # --------------------------------------------------------
    # RESUME INFORMATION
    # --------------------------------------------------------

    current_score = _safe_score(
        resume_analysis.get(
            "resume_score",
            0,
        )
    )

    current_skills = _normalize_list(
        resume_analysis.get(
            "skills",
            [],
        )
    )

    current_education = _normalize_list(
        resume_analysis.get(
            "education",
            [],
        )
    )

    current_sections = _normalize_list(
        resume_analysis.get(
            "detected_sections",
            [],
        )
    )

    projects = _normalize_list(
        resume_analysis.get(
            "projects",
            [],
        )
    )

    experience = _normalize_list(
        resume_analysis.get(
            "experience",
            [],
        )
    )

    certifications = _normalize_list(
        resume_analysis.get(
            "certifications",
            [],
        )
    )

    achievements = _normalize_list(
        resume_analysis.get(
            "achievements",
            [],
        )
    )

    # --------------------------------------------------------
    # CAREER INFORMATION
    # --------------------------------------------------------

    recommended_domains = (
        career_analysis.get(
            "recommended_domains",
            [],
        )
    )

    # --------------------------------------------------------
    # JOB INFORMATION
    # --------------------------------------------------------

    job_matches = (
        job_analysis.get(
            "job_matches",
            [],
        )
    )

    # --------------------------------------------------------
    # SKILL GAP INFORMATION
    # --------------------------------------------------------

    missing_skills = _extract_missing_skills(
        skill_gap_analysis
    )

    # --------------------------------------------------------
    # TARGET ROLE
    # --------------------------------------------------------

    target_role = (
        skill_gap_analysis.get(
            "target_role"
        )
        or ""
    )

    target_domain = (
        skill_gap_analysis.get(
            "target_domain"
        )
        or ""
    )

    # --------------------------------------------------------
    # LOCAL AI
    # --------------------------------------------------------

    ai = generate_json(
        f"""
You are the Resume Optimization Agent in PrepMate AI.

Your task is to analyze the candidate's actual resume together
with the output of the Career, Job Matching and Skill Gap agents.

Your goal is to provide personalized resume improvement advice
for the candidate's actual career direction.

Do NOT give generic advice when the supplied information allows
you to be specific.

IMPORTANT RULES:

1. Use only information actually present in the supplied
   candidate data and previous agent analyses.

2. Never invent skills, projects, internships, certifications,
   achievements, education or experience.

3. Never tell the candidate to claim something they have not
   actually done.

4. Career domains, target roles and skill gaps are guidance
   for resume positioning. They are NOT proof that the
   candidate possesses those skills.

5. If a skill appears as a missing skill, do NOT list it as
   an existing candidate skill.

6. Suggestions must explain how the candidate can improve the
   resume using evidence they already have.

7. If recommending a missing skill, clearly phrase it as
   something to learn or demonstrate later, not something
   to falsely add to the resume.

8. Use the candidate's actual target roles when suggesting
   resume improvements.

9. Do not invent job titles, achievements or metrics.

10. Do not fabricate experience.

11. Do not automatically recommend every possible resume
    section.

12. Distinguish between:
    - detected information
    - recommended improvements
    - missing skills

13. Keep suggestions practical for student placements and
    entry-level roles unless the supplied evidence clearly
    indicates otherwise.

14. Do not simply repeat the Career, Job or Skill Gap analysis.
    Convert those results into useful resume improvement actions.

15. Avoid duplicate suggestions.

16. Return ONLY valid JSON.

------------------------------------------------------------
TARGET CAREER DIRECTION
------------------------------------------------------------

Target role:
{target_role}

Target domain:
{target_domain}

------------------------------------------------------------
CURRENT RESUME SCORE
------------------------------------------------------------

{current_score}

------------------------------------------------------------
DETECTED RESUME SKILLS
------------------------------------------------------------

{current_skills}

------------------------------------------------------------
DETECTED EDUCATION
------------------------------------------------------------

{current_education}

------------------------------------------------------------
DETECTED RESUME SECTIONS
------------------------------------------------------------

{current_sections}

------------------------------------------------------------
DETECTED PROJECTS
------------------------------------------------------------

{projects}

------------------------------------------------------------
DETECTED EXPERIENCE
------------------------------------------------------------

{experience}

------------------------------------------------------------
DETECTED CERTIFICATIONS
------------------------------------------------------------

{certifications}

------------------------------------------------------------
DETECTED ACHIEVEMENTS
------------------------------------------------------------

{achievements}

------------------------------------------------------------
CAREER DOMAIN ANALYSIS
------------------------------------------------------------

{career_analysis}

Recommended career domains:
{recommended_domains}

------------------------------------------------------------
JOB MATCHING ANALYSIS
------------------------------------------------------------

{job_analysis}

Matched job roles:
{job_matches}

------------------------------------------------------------
SKILL GAP ANALYSIS
------------------------------------------------------------

{skill_gap_analysis}

Missing skills:
{missing_skills}

------------------------------------------------------------
COMPLETE RESUME ANALYSIS
------------------------------------------------------------

{resume_analysis}

------------------------------------------------------------
RETURN EXACTLY THIS JSON STRUCTURE
------------------------------------------------------------

{{
    "resume_score": 0,
    "suggestions": [
        "Specific personalized resume improvement"
    ],
    "warnings": [
        "Important resume issue"
    ],
    "detected_skills": [
        "Skill actually detected in the resume"
    ],
    "detected_sections": [
        "Section actually detected in the resume"
    ]
}}
""",
        system=(
            "You are a careful Resume Optimization AI "
            "for PrepMate AI. "
            "Give honest, evidence-based and personalized "
            "resume advice. "
            "Use the supplied resume, career analysis, "
            "job analysis and skill-gap analysis. "
            "Never invent candidate qualifications, "
            "experience, projects, metrics or achievements. "
            "Never turn missing skills into existing skills. "
            "Return only valid JSON."
        ),
    )

    # --------------------------------------------------------
    # VALIDATE AI RESPONSE
    # --------------------------------------------------------

    if isinstance(
        ai,
        dict,
    ):
        suggestions = _normalize_list(
            ai.get(
                "suggestions",
                [],
            )
        )

        warnings = _normalize_list(
            ai.get(
                "warnings",
                [],
            )
        )

        if suggestions:
            ai_score = _safe_score(
                ai.get(
                    "resume_score",
                    current_score,
                )
            )

            detected_skills = _normalize_list(
                ai.get(
                    "detected_skills",
                    current_skills,
                )
            )

            detected_sections = _normalize_list(
                ai.get(
                    "detected_sections",
                    current_sections,
                )
            )

            return {
                "resume_score": ai_score,
                "suggestions": suggestions,
                "warnings": warnings,
                "detected_skills": (
                    detected_skills
                    if detected_skills
                    else current_skills
                ),
                "detected_sections": (
                    detected_sections
                    if detected_sections
                    else current_sections
                ),
            }

    # --------------------------------------------------------
    # FALLBACK
    # --------------------------------------------------------

    return _optimize_resume(
        resume_analysis=resume_analysis,
        career_analysis=career_analysis,
        job_analysis=job_analysis,
        skill_gap_analysis=skill_gap_analysis,
    )