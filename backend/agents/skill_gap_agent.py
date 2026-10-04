import re



from services.ai_service import generate_json





# =========================================================

# HELPERS

# =========================================================



def _normalize_skill(skill):

    return re.sub(

        r"\s+",

        " ",

        str(skill).strip().lower(),

    )





def _normalize_list(value):

    if not isinstance(value, list):

        return []



    result = []



    for item in value:

        item = str(item).strip()



        if item and item not in result:

            result.append(item)



    return result





def _safe_int(value, default=0):

    try:

        return int(value)

    except (TypeError, ValueError):

        return default





def _normalize_gaps(gaps):

    if not isinstance(gaps, list):

        return []



    normalized = []



    for item in gaps:



        if not isinstance(item, dict):

            continue



        skill = str(

            item.get("skill", "")

        ).strip()



        if not skill:

            continue



        status = str(

            item.get("status", "Missing")

        ).strip().title()



        if status not in {"Current", "Missing"}:

            status = "Missing"



        priority = str(

            item.get("priority", "Medium")

        ).strip().title()



        if priority not in {

            "High",

            "Medium",

            "Low",

        }:

            priority = "Medium"



        reason = str(

            item.get("reason", "")

        ).strip()



        normalized.append({

            "skill": skill,

            "status": status,

            "priority": priority,

            "reason": reason,

        })



    return normalized





def _skill_key(skill):

    return _normalize_skill(skill)





def _find_matching_skill(
    skill,
    current_skills,
):
    target = _skill_key(skill)

    aliases = {
        "react.js": "react",
        "node.js": "node",
        "rest api": "api",
        "postgres": "postgresql",
        "scikit learn": "scikit-learn",
        "powerbi": "power bi",
        "machine-learning": "machine learning",
        "data-structures": "data structures",
        "data visualisation tools": "data visualization",
        "data visualisation": "data visualization",
        "data visualization tools": "data visualization",
        "business intelligence tools": "business intelligence",
    }

    target = aliases.get(target, target)

    for current in current_skills:
        current_key = _skill_key(current)
        current_key = aliases.get(current_key, current_key)
        if target == current_key:
            return str(current).strip()

    visualization_tools = {
        "power bi", "tableau", "looker studio", "matplotlib",
        "seaborn", "plotly", "qlik", "powerbi",
    }

    if target == "data visualization":
        for current in current_skills:
            if _skill_key(current) in visualization_tools:
                return str(current).strip()

    business_intelligence_tools = {
        "power bi", "tableau", "looker studio", "qlik",
    }

    if target == "business intelligence":
        for current in current_skills:
            if _skill_key(current) in business_intelligence_tools:
                return str(current).strip()

    return None


def analyze_skill_gaps(

    resume_analysis: dict,

    job_analysis: dict,

):

    """

    Primary skill-gap analysis using the local LLM.



    The model compares the candidate's actual skills with

    the requirements implied by the matched roles.



    If local AI is unavailable, a deterministic fallback

    is used.

    """



    current_skills = _normalize_list(

        resume_analysis.get(

            "skills",

            []

        )

    )



    job_matches = job_analysis.get(

        "job_matches",

        []

    )



    if not isinstance(job_matches, list):

        job_matches = []



    if not job_matches:



        return {

            "target_role": "",

            "target_domain": "",

            "skill_gaps": [],

            "missing_skills_count": 0,

            "total_required_skills": 0,

        }



    primary_job = job_matches[0]



    target_role = str(

        primary_job.get(

            "role",

            ""

        )

    ).strip()



    target_domain = str(

        primary_job.get(

            "domain",

            ""

        )

    ).strip()



    prompt = f"""

You are the Skill Gap Analysis Agent in PrepMate AI.



Determine what the candidate currently has and what they

need to learn to become better prepared for the target role.



IMPORTANT RULES:



1. Use only evidence from the candidate profile and job analysis.

2. Do not invent skills the candidate has.

3. Do not mark a skill as missing if it is clearly present

   in the candidate profile.

4. Consider equivalent/common skill names where appropriate.

   Example: React.js and React can represent the same skill.

5. Focus on skills that are genuinely relevant to the target role.

6. Consider technical skills, tools, frameworks and important

   supporting skills.

7. Do not require every possible industry skill.

8. Prioritize skills that would have meaningful impact on

   entry-level readiness.

9. Use:

   - Current = candidate already demonstrates the skill.

   - Missing = candidate does not currently demonstrate it.

10. Priority must be High, Medium or Low.

11. Return ONLY valid JSON.



Return exactly:



{{

  "target_role": "{target_role}",

  "target_domain": "{target_domain}",

  "skill_gaps": [

    {{

      "skill": "Skill name",

      "status": "Current",

      "priority": "Low",

      "reason": "Why this skill matters for the target role."

    }},

    {{

      "skill": "Skill name",

      "status": "Missing",

      "priority": "High",

      "reason": "Why the candidate should develop this skill."

    }}

  ],

  "missing_skills_count": 0,

  "total_required_skills": 0

}}



Candidate profile:



{{

  "skills": {current_skills},

  "education": {resume_analysis.get("education", [])},

  "projects": {resume_analysis.get("projects", [])},

  "experience": {resume_analysis.get("experience", [])},

  "certifications": {resume_analysis.get("certifications", [])}

}}



Target job analysis:



{primary_job}

"""



    ai = generate_json(

        prompt,

        system=(

            "You are a careful career skill-gap AI. "

            "Use only candidate evidence. "

            "Never invent qualifications. "

            "Return only valid JSON."

        ),

    )



    # =====================================================

    # VALIDATE AI RESULT

    # =====================================================



    if isinstance(ai, dict):



        gaps = _normalize_gaps(

            ai.get(

                "skill_gaps",

                []

            )

        )



        if gaps:



            # Safety check:

            # never allow an AI response to say a skill is

            # missing when it clearly exists in the resume.

            cleaned_gaps = []



            for gap in gaps:



                if gap["status"] == "Missing":



                    existing = _find_matching_skill(

                        gap["skill"],

                        current_skills,

                    )



                    if existing:

                        gap["status"] = "Current"

                        gap["priority"] = "Low"

                        gap["reason"] = (

                            f"{existing} is already present "

                            "in the candidate profile."

                        )



                cleaned_gaps.append(gap)



            missing_count = sum(

                1

                for gap in cleaned_gaps

                if gap["status"] == "Missing"

            )



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



                "skill_gaps": cleaned_gaps,



                "missing_skills_count":

                    missing_count,



                "total_required_skills":

                    len(cleaned_gaps),

            }



    # =====================================================

    # FALLBACK

    # =====================================================



    return _fallback_skill_gaps(

        resume_analysis,

        job_analysis,

    )





# =========================================================

# FALLBACK SKILL GAP ANALYSIS

# =========================================================



def _fallback_skill_gaps(

    resume_analysis,

    job_analysis,

):

    current_skills = _normalize_list(

        resume_analysis.get(

            "skills",

            []

        )

    )



    job_matches = job_analysis.get(

        "job_matches",

        []

    )



    if not job_matches:



        return {

            "target_role": "",

            "target_domain": "",

            "skill_gaps": [],

            "missing_skills_count": 0,

            "total_required_skills": 0,

        }



    primary_job = job_matches[0]



    target_role = str(

        primary_job.get(

            "role",

            ""

        )

    ).strip()



    target_domain = str(

        primary_job.get(

            "domain",

            ""

        )

    ).strip()



    matching_skills = _normalize_list(

        primary_job.get(

            "matching_skills",

            []

        )

    )



    missing_skills = _normalize_list(

        primary_job.get(

            "missing_skills",

            []

        )

    )



    gaps = []



    # Current skills

    for skill in matching_skills:



        actual_skill = _find_matching_skill(

            skill,

            current_skills,

        )



        if actual_skill:



            gaps.append({

                "skill": actual_skill,

                "status": "Current",

                "priority": "Low",

                "reason": (

                    f"{actual_skill} is already present "

                    f"in the candidate profile and supports "

                    f"the {target_role} role."

                ),

            })



    # Missing skills

    seen = set()



    for skill in missing_skills:



        key = _skill_key(skill)



        if key in seen:

            continue



        seen.add(key)



        if _find_matching_skill(

            skill,

            current_skills,

        ):

            continue



        priority = _fallback_priority(

            skill

        )



        gaps.append({

            "skill": skill,

            "status": "Missing",

            "priority": priority,

            "reason": (

                f"{skill} is relevant to {target_role} "

                "and is not currently demonstrated "

                "in the candidate profile."

            ),

        })



    priority_order = {

        "High": 0,

        "Medium": 1,

        "Low": 2,

    }



    gaps.sort(

        key=lambda item: (

            priority_order.get(

                item["priority"],

                3,

            ),

            item["skill"].lower(),

        )

    )



    missing_count = sum(

        1

        for gap in gaps

        if gap["status"] == "Missing"

    )



    return {

        "target_role": target_role,

        "target_domain": target_domain,

        "skill_gaps": gaps,

        "missing_skills_count": missing_count,

        "total_required_skills": len(gaps),

    }





def _fallback_priority(skill):



    high_priority = {

        "python",

        "java",

        "javascript",

        "typescript",

        "sql",

        "react",

        "node.js",

        "fastapi",

        "flask",

        "django",

        "machine learning",

        "data analysis",

        "pandas",

        "numpy",

        "scikit-learn",

        "html",

        "css",

        "git",

        "docker",

        "aws",

        "azure",

        "testing",

    }



    medium_priority = {

        "github",

        "oop",

        "api",

        "rest api",

        "data structures",

        "algorithms",

        "statistics",

        "excel",

        "power bi",

        "tableau",

        "linux",

        "mongodb",

        "postgresql",

        "mysql",

    }



    normalized = _skill_key(skill)



    if normalized in high_priority:

        return "High"



    if normalized in medium_priority:

        return "Medium"



    return "Low"