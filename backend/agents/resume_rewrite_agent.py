from services.ai_service import generate_text


# ============================================================
# HELPERS
# ============================================================

def _clean_text(text):
    return " ".join(
        str(text or "").strip().split()
    )


def _normalize_skills(skills):
    if not isinstance(skills, list):
        return []

    result = []
    seen = set()

    for skill in skills:
        skill = _clean_text(skill)

        if not skill:
            continue

        key = skill.lower()

        if key not in seen:
            seen.add(key)
            result.append(skill)

    return result


def _remove_wrapping_quotes(text):
    text = _clean_text(text)

    if (
        len(text) >= 2
        and text[0] == '"'
        and text[-1] == '"'
    ):
        text = text[1:-1].strip()

    return text


def _remove_ai_prefix(text):
    """
    Remove common accidental prefixes such as:
    'Here is the rewritten summary:'
    'Rewritten summary:'
    'Improved summary:'
    """

    text = _clean_text(text)

    prefixes = [
        "Here is the rewritten summary:",
        "Here is the improved summary:",
        "Rewritten summary:",
        "Improved summary:",
        "Rewritten resume summary:",
        "Improved resume summary:",
        "Resume summary:",
    ]

    changed = True

    while changed:
        changed = False

        for prefix in prefixes:
            if text.lower().startswith(prefix.lower()):
                text = text[len(prefix):].strip()
                changed = True
                break

    return text


def _has_unsupported_experience_claim(original, improved):
    """
    Detect unsupported experience-level claims introduced by the AI.

    If the original summary clearly describes a student/fresher and the
    rewritten summary introduces a professional-level experience claim,
    reject the AI output and use the deterministic fallback instead.
    """

    original_lower = _clean_text(original).lower()
    improved_lower = _clean_text(improved).lower()

    student_indicators = [
        "student",
        "undergraduate",
        "b.tech",
        "btech",
        "b.e.",
        "bachelor",
        "college student",
        "university student",
        "fresher",
        "graduate student",
        "third-year",
        "third year",
        "second-year",
        "second year",
        "final-year",
        "final year",
    ]

    original_is_student = any(
        phrase in original_lower
        for phrase in student_indicators
    )

    if not original_is_student:
        return False

    unsupported_claims = [
        "highly experienced",
        "extensive professional experience",
        "seasoned professional",
        "senior professional",
        "proven track record",
        "industry expert",
        "expert professional",
        "years of experience",
        "experienced professional",
    ]

    return any(
        phrase in improved_lower
        and phrase not in original_lower
        for phrase in unsupported_claims
    ) or (
        "experienced" in improved_lower
        and "experienced" not in original_lower
    )


# ============================================================
# DETERMINISTIC FALLBACK
# ============================================================

def _build_improved_summary(summary, skills):
    """
    Deterministic fallback.

    Improves structure and wording without introducing
    unsupported facts.
    """

    summary = _clean_text(summary)
    skills = _normalize_skills(skills)

    if not summary:
        return ""

    sentences = [
        sentence.strip()
        for sentence in summary.replace("\n", " ").split(".")
        if sentence.strip()
    ]

    cleaned_sentences = []

    for sentence in sentences:
        sentence = _clean_text(sentence)

        if not sentence:
            continue

        if sentence not in cleaned_sentences:
            cleaned_sentences.append(sentence)

    improved = ". ".join(cleaned_sentences)

    if improved and not improved.endswith("."):
        improved += "."

    summary_lower = improved.lower()

    additional_skills = [
        skill
        for skill in skills
        if skill.lower() not in summary_lower
    ]

    if additional_skills:
        improved += (
            " Technical skills include "
            + ", ".join(additional_skills)
            + "."
        )

    return improved


# ============================================================
# MAIN SUMMARY REWRITER
# ============================================================

def rewrite_summary(summary: str, skills: list[str]):
    """
    Rewrite a student's or professional candidate's resume summary.

    Primary:
        Local Ollama LLM.

    Fallback:
        Deterministic rewriting.

    The AI must preserve the candidate's actual career level,
    experience and facts.
    """

    summary = _clean_text(summary)
    skills = _normalize_skills(skills)

    if not summary:
        return {
            "original": "",
            "improved": "",
        }

    ai = generate_text(
        f"""
Rewrite the following resume summary professionally.

The candidate's original summary is the source of truth.

Your job is ONLY to improve:
- wording
- grammar
- clarity
- structure
- conciseness
- professional tone

IMPORTANT FACT-PRESERVATION RULES:

1. Preserve the candidate's actual career level.
2. If the candidate is a student/fresher, keep them a student/fresher.
3. If the candidate is a professional, preserve their professional level.
4. Never downgrade or upgrade the candidate's experience level.
5. Never invent years of experience.
6. Never invent employers.
7. Never invent projects.
8. Never invent certifications.
9. Never invent achievements.
10. Never invent metrics or percentages.
11. Never invent technologies or tools that are not supplied.
12. You may use the supplied skills when they genuinely fit the original summary.
13. Do not turn a skill into an achievement.
14. Do not claim professional experience that is not supported.
15. Do not add phrases such as "highly experienced", "proven track record", "expert",
    "seasoned", or "years of experience" unless the original information clearly supports them.
16. Do not change the meaning of the original summary.
17. Do not add information simply because it sounds good.
18. Keep the summary concise and suitable for a resume.
19. Return ONLY the rewritten summary.
20. Do NOT write a heading or explanation.
21. Do NOT use quotation marks around the answer.

ORIGINAL SUMMARY:
{summary}

KNOWN SKILLS:
{skills}
""",
        system=(
            "You are a strict evidence-based resume rewriting AI. "
            "Improve wording only. Preserve the candidate's actual career level, "
            "experience and facts. Never downgrade a professional to a student and "
            "never upgrade a student to an experienced professional. Never invent "
            "qualifications, employers, projects, achievements, metrics or experience. "
            "Return only the rewritten summary with no heading or explanation."
        ),
    )

    if ai:
        improved = _clean_text(ai)
        improved = _remove_wrapping_quotes(improved)
        improved = _remove_ai_prefix(improved)

        if improved and not _has_unsupported_experience_claim(
            original=summary,
            improved=improved,
        ):
            return {
                "original": summary,
                "improved": improved,
            }

    improved = _build_improved_summary(
        summary=summary,
        skills=skills,
    )

    if not improved:
        raise RuntimeError(
            "Unable to generate an improved resume summary."
        )

    return {
        "original": summary,
        "improved": improved,
    }
