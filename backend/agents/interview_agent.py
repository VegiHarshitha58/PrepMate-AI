from services.ai_service import generate_json


def _clean(value):
    return str(value).strip() if value is not None else ""


def _unique(values):
    result = []
    seen = set()

    for value in values:
        value = _clean(value)

        if not value:
            continue

        key = value.lower()

        if key not in seen:
            seen.add(key)
            result.append(value)

    return result


def _get_skills(resume_analysis):
    skills = resume_analysis.get("skills", [])

    if not isinstance(skills, list):
        return []

    return _unique(skills)


def _get_projects(resume_analysis):
    """
    Extract project-like information when it is present
    in the existing resume analysis.
    """
    projects = resume_analysis.get("projects", [])

    if not isinstance(projects, list):
        return []

    return _unique(projects)


def _get_target(
    job_analysis,
    skill_gap_analysis,
):
    jobs = job_analysis.get(
        "job_matches",
        [],
    )

    primary_job = (
        jobs[0]
        if isinstance(jobs, list)
        and jobs
        and isinstance(jobs[0], dict)
        else {}
    )

    target_role = _clean(
        skill_gap_analysis.get("target_role")
        or primary_job.get("role")
        or "Technology Role"
    )

    target_domain = _clean(
        skill_gap_analysis.get("target_domain")
        or primary_job.get("domain")
        or "Technology"
    )

    return target_role, target_domain


def _missing_skills(skill_gap_analysis):
    gaps = skill_gap_analysis.get(
        "skill_gaps",
        [],
    )

    if not isinstance(gaps, list):
        return []

    result = []

    for gap in gaps:
        if not isinstance(gap, dict):
            continue

        if _clean(
            gap.get("status")
        ).lower() != "missing":
            continue

        skill = _clean(
            gap.get("skill")
        )

        if skill and skill.lower() not in {
            item.lower()
            for item in result
        }:
            result.append(skill)

    return result


def _matching_skills(job_analysis):
    jobs = job_analysis.get(
        "job_matches",
        [],
    )

    if not isinstance(jobs, list):
        return []

    if not jobs or not isinstance(jobs[0], dict):
        return []

    return _unique(
        jobs[0].get(
            "matching_skills",
            [],
        )
    )


def _technical_question(
    skill,
    difficulty,
):
    if difficulty == "Easy":
        return (
            f"What is {skill}, and where would you "
            f"use it in a practical application?"
        )

    if difficulty == "Hard":
        return (
            f"Suppose you are using {skill} in a real "
            f"application and the implementation is not "
            f"performing as expected. How would you "
            f"identify the problem and improve it?"
        )

    return (
        f"Explain how you would use {skill} to solve "
        f"a practical problem in a software project. "
        f"What important considerations would you make?"
    )


def _role_question(
    target_role,
    target_domain,
    skill,
    difficulty,
):
    if difficulty == "Easy":
        return (
            f"What responsibilities would you expect "
            f"in a {target_role} role within "
            f"{target_domain}?"
        )

    if difficulty == "Hard":
        return (
            f"As a {target_role}, how would you approach "
            f"a project in {target_domain} when you have "
            f"limited time and need to choose which "
            f"technical tasks to prioritize?"
        )

    return (
        f"For a {target_role} position in {target_domain}, "
        f"how would you apply {skill} in a real project "
        f"and explain your implementation to an interviewer?"
    )


def _gap_question(
    skill,
    target_role,
    difficulty,
):
    if difficulty == "Easy":
        return (
            f"You are preparing for a {target_role} role. "
            f"What would you need to learn about {skill} "
            f"before using it in a project?"
        )

    if difficulty == "Hard":
        return (
            f"{skill} is one of the identified gaps for "
            f"your {target_role} preparation. Explain how "
            f"you would learn it efficiently and then "
            f"validate your understanding through a project "
            f"or practical problem."
        )

    return (
        f"Why could {skill} be important for a "
        f"{target_role} role, and what practical task "
        f"would you use to demonstrate that you understand it?"
    )


def _project_question(
    project,
    target_role,
):
    return (
        f"Explain your project '{project}' and describe "
        f"the main technical decisions you made while "
        f"building it for a {target_role} role."
    )


def _hr_question(
    target_role,
    skills,
):
    if skills:
        skill_text = ", ".join(
            skills[:3]
        )

        return (
            f"Why are you interested in a {target_role} role, "
            f"and how do your current skills such as "
            f"{skill_text} support that direction?"
        )

    return (
        f"Why are you interested in a {target_role} role, "
        f"and what are you currently doing to prepare for it?"
    )


def _build_question_pool(
    resume_analysis,
    career_analysis,
    job_analysis,
    skill_gap_analysis,
    interview_type,
    difficulty,
):
    skills = _get_skills(
        resume_analysis
    )

    projects = _get_projects(
        resume_analysis
    )

    missing = _missing_skills(
        skill_gap_analysis
    )

    matching = _matching_skills(
        job_analysis
    )

    target_role, target_domain = _get_target(
        job_analysis,
        skill_gap_analysis,
    )

    pool = []

    # -----------------------------------------------------
    # Technical questions from actual candidate skills
    # -----------------------------------------------------

    for skill in skills:
        pool.append({
            "question": _technical_question(
                skill,
                difficulty,
            ),
            "skill": skill,
            "type": "Technical",
        })

    # -----------------------------------------------------
    # Questions from role-relevant matching skills
    # -----------------------------------------------------

    existing_skills = {
        item["skill"].lower()
        for item in pool
        if item.get("skill")
    }

    for skill in matching:
        if skill.lower() not in existing_skills:
            pool.append({
                "question": _technical_question(
                    skill,
                    difficulty,
                ),
                "skill": skill,
                "type": "Technical",
            })

            existing_skills.add(
                skill.lower()
            )

    # -----------------------------------------------------
    # Questions from actual skill gaps
    # -----------------------------------------------------

    for skill in missing:
        pool.append({
            "question": _gap_question(
                skill,
                target_role,
                difficulty,
            ),
            "skill": skill,
            "type": "Role-specific",
        })

    # -----------------------------------------------------
    # Questions based on actual projects
    # -----------------------------------------------------

    for project in projects:
        pool.append({
            "question": _project_question(
                project,
                target_role,
            ),
            "skill": None,
            "type": "Role-specific",
        })

    # -----------------------------------------------------
    # Role-specific question
    # -----------------------------------------------------

    role_skill = (
        matching[0]
        if matching
        else skills[0]
        if skills
        else target_domain
    )

    pool.append({
        "question": _role_question(
            target_role,
            target_domain,
            role_skill,
            difficulty,
        ),
        "skill": role_skill,
        "type": "Role-specific",
    })

    # -----------------------------------------------------
    # HR question
    # -----------------------------------------------------

    pool.append({
        "question": _hr_question(
            target_role,
            skills,
        ),
        "skill": None,
        "type": "HR",
    })

    return pool


def _select_questions(
    pool,
    question_count,
    interview_type,
):
    if not pool:
        return []

    selected = []
    seen = set()

    if interview_type == "Mixed":
        preferred_types = [
            "Technical",
            "Role-specific",
            "HR",
        ]

    elif interview_type == "Technical":
        preferred_types = [
            "Technical",
        ]

    elif interview_type == "Role-specific":
        preferred_types = [
            "Role-specific",
        ]

    else:
        preferred_types = [
            "HR",
        ]

    # -----------------------------------------------------
    # First select requested interview type
    # -----------------------------------------------------

    for question_type in preferred_types:

        for item in pool:

            if len(selected) >= question_count:
                break

            if item["type"] != question_type:
                continue

            key = item["question"].lower()

            if key in seen:
                continue

            seen.add(key)
            selected.append(item)

    # -----------------------------------------------------
    # Fill remaining questions if required
    # -----------------------------------------------------

    if len(selected) < question_count:

        for item in pool:

            if len(selected) >= question_count:
                break

            key = item["question"].lower()

            if key in seen:
                continue

            seen.add(key)
            selected.append(item)

    return selected


def generate_interview_questions(
    resume_analysis: dict,
    career_analysis: dict,
    job_analysis: dict,
    skill_gap_analysis: dict,
    question_count: int = 10,
    interview_type: str = "Mixed",
    difficulty: str = "Medium",
):
    """
    Generate personalized interview questions.

    Primary path:
        Local LLM through Ollama.

    Fallback path:
        Profile-based deterministic question generation.

    The fallback ensures the application remains usable
    when the local AI model is unavailable.
    """

    # -----------------------------------------------------
    # Validate question count
    # -----------------------------------------------------

    try:
        question_count = int(
            question_count
        )
    except (TypeError, ValueError):
        question_count = 10

    question_count = max(
        1,
        min(question_count, 30),
    )

    # -----------------------------------------------------
    # Validate interview type
    # -----------------------------------------------------

    valid_types = {
        "Mixed",
        "Technical",
        "HR",
        "Role-specific",
    }

    if interview_type not in valid_types:
        interview_type = "Mixed"

    # -----------------------------------------------------
    # Validate difficulty
    # -----------------------------------------------------

    valid_difficulties = {
        "Easy",
        "Medium",
        "Hard",
    }

    if difficulty not in valid_difficulties:
        difficulty = "Medium"

    # -----------------------------------------------------
    # Extract candidate information
    # -----------------------------------------------------

    target_role, target_domain = _get_target(
        job_analysis,
        skill_gap_analysis,
    )

    current_skills = _get_skills(
        resume_analysis
    )

    projects = _get_projects(
        resume_analysis
    )

    missing_skills = _missing_skills(
        skill_gap_analysis
    )

    matching_skills = _matching_skills(
        job_analysis
    )

    # -----------------------------------------------------
    # PRIMARY AI PATH
    # -----------------------------------------------------

    prompt = f"""
You are the Interview Preparation Agent in PrepMate AI.

Generate personalized interview questions for this
specific candidate.

The questions must be based on the candidate's actual
resume, skills, projects, target role, job match and
identified skill gaps.

IMPORTANT RULES:

1. Do not invent candidate experience.

2. Do not claim the candidate used a technology unless
   it appears in the supplied candidate information.

3. Questions should feel like realistic placement
   interview questions.

4. Adapt the questions to the requested difficulty.

5. Adapt the questions to the requested interview type.

6. Technical questions should relate to actual skills.

7. Role-specific questions should relate to the target role.

8. HR questions should relate to the candidate's actual
   background and career direction.

9. Missing skills may be asked about as learning or
   preparation questions, but must not be treated as
   existing candidate experience.

10. Project questions must use only projects actually
    present in the candidate profile.

11. Avoid duplicate or nearly identical questions.

12. Questions should be specific enough to evaluate the
    candidate rather than being generic filler.

13. Do not generate questions about unrelated technologies.

14. Return ONLY valid JSON.

Interview type:
{interview_type}

Difficulty:
{difficulty}

Number of questions:
{question_count}

Target role:
{target_role}

Target domain:
{target_domain}

Current skills:
{current_skills}

Matching role skills:
{matching_skills}

Missing skills:
{missing_skills}

Projects:
{projects}

Full candidate resume analysis:
{resume_analysis}

Career analysis:
{career_analysis}

Job analysis:
{job_analysis}

Skill-gap analysis:
{skill_gap_analysis}

Return exactly:

{{
    "questions": [
        {{
            "question": "Interview question",
            "skill": "Relevant skill or null",
            "type": "Technical"
        }}
    ]
}}

Allowed question types:

Technical
Role-specific
HR
General
"""

    ai = generate_json(
        prompt,
        system=(
            "You are a careful interview-preparation AI. "
            "Personalize questions using only supplied "
            "candidate evidence. Never invent experience. "
            "Return only valid JSON."
        ),
    )

    # -----------------------------------------------------
    # VALIDATE AI RESPONSE
    # -----------------------------------------------------

    if isinstance(ai, dict):

        raw_questions = ai.get(
            "questions",
            [],
        )

        if isinstance(
            raw_questions,
            list,
        ):

            questions = []
            seen = set()

            for item in raw_questions:

                if not isinstance(
                    item,
                    dict,
                ):
                    continue

                question = str(
                    item.get(
                        "question",
                        "",
                    )
                ).strip()

                if not question:
                    continue

                key = question.lower()

                if key in seen:
                    continue

                seen.add(key)

                question_type = str(
                    item.get(
                        "type",
                        "General",
                    )
                ).strip()

                if question_type not in {
                    "Technical",
                    "Role-specific",
                    "HR",
                    "General",
                }:
                    question_type = "General"

                skill = item.get(
                    "skill"
                )

                skill = (
                    str(skill).strip()
                    if skill
                    else None
                )

                questions.append({
                    "question": question,
                    "skill": skill,
                    "type": question_type,
                })

            if questions:

                return {
                    "target_role": target_role,
                    "target_domain": target_domain,
                    "questions": questions[
                        :question_count
                    ],
                    "total_questions": min(
                        len(questions),
                        question_count,
                    ),
                }

    # -----------------------------------------------------
    # FALLBACK PATH
    # -----------------------------------------------------

    pool = _build_question_pool(
        resume_analysis=resume_analysis,
        career_analysis=career_analysis,
        job_analysis=job_analysis,
        skill_gap_analysis=skill_gap_analysis,
        interview_type=interview_type,
        difficulty=difficulty,
    )

    questions = _select_questions(
        pool=pool,
        question_count=question_count,
        interview_type=interview_type,
    )

    # -----------------------------------------------------
    # FALLBACK TO MIXED IF REQUESTED TYPE
    # DOES NOT HAVE ENOUGH QUESTIONS
    # -----------------------------------------------------

    if len(questions) < question_count:

        all_questions = _build_question_pool(
            resume_analysis=resume_analysis,
            career_analysis=career_analysis,
            job_analysis=job_analysis,
            skill_gap_analysis=skill_gap_analysis,
            interview_type="Mixed",
            difficulty=difficulty,
        )

        questions = _select_questions(
            pool=all_questions,
            question_count=question_count,
            interview_type="Mixed",
        )

    # -----------------------------------------------------
    # SAFETY CHECK
    # -----------------------------------------------------

    if not questions:
        raise RuntimeError(
            "Not enough student information to generate "
            "personalized interview questions."
        )

    questions = questions[
        :question_count
    ]

    # -----------------------------------------------------
    # FINAL RESPONSE
    # -----------------------------------------------------

    return {
        "target_role": target_role,
        "target_domain": target_domain,
        "questions": questions,
        "total_questions": len(questions),
    }