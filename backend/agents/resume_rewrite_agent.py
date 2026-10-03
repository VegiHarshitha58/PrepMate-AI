from services.ai_service import generate_text


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


def _build_improved_summary(
    summary,
    skills,
):
    """
    Improve wording locally without introducing
    information that was not supplied by the student.
    """

    summary = _clean_text(summary)
    skills = _normalize_skills(skills)

    if not summary:
        return ""

    # --------------------------------------------------
    # Split summary into sentences
    # --------------------------------------------------

    sentences = [
        sentence.strip()
        for sentence in summary.replace(
            "\n",
            " ",
        ).split(".")
        if sentence.strip()
    ]

    cleaned_sentences = []

    for sentence in sentences:

        sentence = _clean_text(
            sentence
        )

        if not sentence:
            continue

        if sentence not in cleaned_sentences:
            cleaned_sentences.append(
                sentence
            )

    improved = ". ".join(
        cleaned_sentences
    )

    if improved and not improved.endswith("."):
        improved += "."

    # --------------------------------------------------
    # Add supplied skills only when not already mentioned
    # --------------------------------------------------

    summary_lower = improved.lower()

    additional_skills = [
        skill
        for skill in skills
        if skill.lower() not in summary_lower
    ]

    if additional_skills:

        improved += (
            " Technical skills include "
            + ", ".join(
                additional_skills
            )
            + "."
        )

    return improved


def rewrite_summary(
    summary: str,
    skills: list[str],
):
    """
    Rewrite a student's resume summary.

    Primary:
        Local Ollama LLM.

    Fallback:
        Local deterministic rewriting.

    The AI is instructed to preserve only information
    actually supplied by the student.
    """

    summary = _clean_text(
        summary
    )

    skills = _normalize_skills(
        skills
    )

    # --------------------------------------------------
    # Empty input
    # --------------------------------------------------

    if not summary:
        return {
            "original": "",
            "improved": "",
        }

    # --------------------------------------------------
    # PRIMARY AI PATH
    # --------------------------------------------------

    ai = generate_text(
        f"""
Rewrite the following resume summary for a
college student or entry-level candidate.

The goal is to make it:

- Professional
- Clear
- Concise
- Placement-friendly
- Grammatically polished

IMPORTANT RULES:

1. Preserve only facts explicitly present in the
   original summary.

2. You may use the supplied skills.

3. Do NOT invent years of experience.

4. Do NOT invent employers.

5. Do NOT invent projects.

6. Do NOT invent certifications.

7. Do NOT invent achievements.

8. Do NOT invent metrics or percentages.

9. Do NOT invent technologies that are not supplied.

10. Do NOT claim professional experience if it is not
    present in the original summary.

11. Do not add generic claims such as "highly experienced"
    unless supported by the supplied information.

12. Keep the summary concise.

13. Return ONLY the rewritten summary.
    Do not include headings, explanations or quotation marks.

Original summary:
{summary}

Known skills:
{skills}
""",
        system=(
            "You are a careful resume-writing AI. "
            "Improve wording without fabricating facts. "
            "Preserve the candidate's actual information. "
            "Return only the improved resume summary."
        ),
    )

    # --------------------------------------------------
    # Validate AI response
    # --------------------------------------------------

    if ai:

        improved = _clean_text(
            ai
        )

        # Remove accidental quotation marks
        # surrounding the complete response.
        if (
            len(improved) >= 2
            and improved[0] == '"'
            and improved[-1] == '"'
        ):
            improved = improved[1:-1].strip()

        if improved:

            return {
                "original": summary,
                "improved": improved,
            }

    # --------------------------------------------------
    # FALLBACK
    # --------------------------------------------------

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