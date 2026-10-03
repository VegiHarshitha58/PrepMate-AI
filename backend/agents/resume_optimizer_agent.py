from services.ai_service import generate_json


def _normalize_list(value):
    if not isinstance(value, list):
        return []

    result = []
    seen = set()

    for item in value:
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
            min(100, round(float(value))),
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


def _optimize_resume(
    resume_analysis: dict,
):
    """
    Generate resume improvement suggestions locally
    from information actually detected in the resume.

    This is the fallback used when the local AI model
    is unavailable.
    """

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

    # --------------------------------------------------
    # Contact information
    # --------------------------------------------------

    if not candidate_email:
        warnings.append(
            "Email address was not detected in the resume."
        )

        suggestions.append(
            "Add a professional email address to the "
            "resume header."
        )

    if not candidate_phone:
        warnings.append(
            "Phone number was not detected in the resume."
        )

        suggestions.append(
            "Add a reachable phone number to the resume "
            "contact section."
        )

    # --------------------------------------------------
    # Education
    # --------------------------------------------------

    if not education:
        warnings.append(
            "Education information was not detected."
        )

        suggestions.append(
            "Add your current degree, institution, branch "
            "or specialization, and relevant academic details."
        )

    # --------------------------------------------------
    # Skills
    # --------------------------------------------------

    if not skills:
        warnings.append(
            "No technical or professional skills were "
            "detected from the resume."
        )

        suggestions.append(
            "Add a clearly labeled Skills section containing "
            "technologies you actually know."
        )

    elif not _has_section(
        sections,
        "Skills",
    ):
        suggestions.append(
            "Use a clearly labeled Skills section so your "
            "technical abilities are easy to identify."
        )

    # --------------------------------------------------
    # Projects
    # --------------------------------------------------

    if not _has_section(
        sections,
        "Projects",
    ):
        warnings.append(
            "A Projects section was not detected."
        )

        suggestions.append(
            "Add relevant academic or personal projects "
            "with technologies used and your actual contribution."
        )

    # --------------------------------------------------
    # Experience / internships
    # --------------------------------------------------

    has_experience = _has_section(
        sections,
        "Experience",
        "Internships",
        "Internship",
    )

    if not has_experience:
        suggestions.append(
            "If you have completed internships, training or "
            "relevant practical work, present them in a clear "
            "Experience or Internship section."
        )

    # --------------------------------------------------
    # Certifications
    # --------------------------------------------------

    if not _has_section(
        sections,
        "Certifications",
        "Certificates",
    ):
        suggestions.append(
            "If you have relevant certifications, include a "
            "separate Certifications section."
        )

    # --------------------------------------------------
    # Summary / objective
    # --------------------------------------------------

    if not _has_section(
        sections,
        "Summary",
        "Objective",
        "Profile",
    ):
        suggestions.append(
            "Consider adding a concise professional summary "
            "that reflects your actual skills and placement "
            "direction."
        )

    # --------------------------------------------------
    # Achievements
    # --------------------------------------------------

    if not _has_section(
        sections,
        "Achievements",
    ):
        suggestions.append(
            "Include relevant academic, hackathon or other "
            "verifiable achievements if you have them."
        )

    # --------------------------------------------------
    # Resume score
    # --------------------------------------------------

    if score < 50:

        warnings.append(
            "The detected resume information indicates that "
            "several important resume elements may need "
            "improvement."
        )

        suggestions.append(
            "Improve completeness, structure and evidence of "
            "technical work before using the resume for placements."
        )

    elif score < 70:

        suggestions.append(
            "Strengthen the resume by improving project evidence, "
            "technical detail and clarity of the existing sections."
        )

    elif score < 85:

        suggestions.append(
            "Refine project descriptions and existing achievements "
            "with concise, specific evidence where available."
        )

    else:

        suggestions.append(
            "Keep the resume concise and continue updating it with "
            "new verified projects, skills and achievements."
        )

    # --------------------------------------------------
    # General quality suggestions
    # --------------------------------------------------

    suggestions.append(
        "Use consistent formatting, section headings and "
        "bullet-point structure throughout the resume."
    )

    suggestions.append(
        "Describe only skills, projects, experience and "
        "achievements that you can genuinely demonstrate."
    )

    # --------------------------------------------------
    # Remove duplicates
    # --------------------------------------------------

    suggestions = _normalize_list(
        suggestions
    )

    warnings = _normalize_list(
        warnings
    )

    return {
        "resume_score": score,
        "suggestions": suggestions,
        "warnings": warnings,
        "detected_skills": skills,
        "detected_sections": sections,
    }


def _clean_value(value):
    if value is None:
        return ""

    return str(value).strip()


def optimize_resume(
    resume_analysis: dict,
):
    """
    Optimize a resume using the local AI model.

    Primary:
        Ollama / local LLM

    Fallback:
        Rule-based resume optimization
    """

    # --------------------------------------------------
    # Validate input
    # --------------------------------------------------

    if not isinstance(
        resume_analysis,
        dict,
    ):
        raise ValueError(
            "resume_analysis must be a dictionary."
        )

    # --------------------------------------------------
    # Extract useful candidate information
    # --------------------------------------------------

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

    # --------------------------------------------------
    # PRIMARY AI PATH
    # --------------------------------------------------

    ai = generate_json(
        f"""
You are the Resume Optimization Agent in PrepMate AI.

Analyze this candidate's resume information and provide
honest, personalized resume improvement advice.

The goal is to help the candidate improve the resume for
student placements and entry-level technology roles.

IMPORTANT RULES:

1. Use only information actually present in the supplied
   resume analysis.

2. Never invent skills, projects, internships,
   certifications, achievements or experience.

3. Do not tell the candidate to claim something they have
   not actually done.

4. Suggestions must be actionable and specific.

5. Distinguish between detected problems and optional
   improvements.

6. If a section is missing, suggest adding it only when
   relevant.

7. Do not automatically assume that every candidate needs
   every possible resume section.

8. Preserve the candidate's actual information.

9. Do not fabricate a new resume score without considering
   the supplied resume evidence.

10. Detected skills and sections should reflect the supplied
    resume analysis.

11. Avoid duplicate suggestions.

12. Return ONLY valid JSON.

Current resume score:
{current_score}

Detected skills:
{current_skills}

Detected education:
{current_education}

Detected sections:
{current_sections}

Detected projects:
{projects}

Detected experience:
{experience}

Detected certifications:
{certifications}

Detected achievements:
{achievements}

Complete resume analysis:
{resume_analysis}

Return exactly:

{{
    "resume_score": 0,
    "suggestions": [
        "Specific improvement suggestion"
    ],
    "warnings": [
        "Important issue detected"
    ],
    "detected_skills": [
        "Skill"
    ],
    "detected_sections": [
        "Section"
    ]
}}
""",
        system=(
            "You are a careful resume optimization AI. "
            "Give honest, evidence-based advice using only "
            "the supplied candidate information. "
            "Never invent candidate experience. "
            "Return only valid JSON."
        ),
    )

    # --------------------------------------------------
    # VALIDATE AI RESPONSE
    # --------------------------------------------------

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

    # --------------------------------------------------
    # FALLBACK
    # --------------------------------------------------

    return _optimize_resume(
        resume_analysis
    )