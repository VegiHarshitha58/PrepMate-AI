import re



from services.ai_service import generate_json





# =========================================================

# FALLBACK ROLE PROFILES

# =========================================================



ROLE_PROFILES = {

    "Python Developer": {

        "domain": "Software Development",

        "skills": [

            "python",

            "git",

            "github",

            "sql",

            "oop",


            "html",

            "css",

            "javascript",

            "typescript",

            "react",

            "node.js",

            "express",

            "python",

            "sql",

            "git",

        ],

    },



    "Data Analyst": {

        "domain": "Data Analytics",

        "skills": [

            "python",

            "sql",

            "pandas",

            "numpy",

            "excel",

            "power bi",

            "tableau",

            "looker studio",

            "data analysis",

            "statistics",

        ],

    },



    "Machine Learning Engineer": {

        "domain": "Artificial Intelligence & Machine Learning",

        "skills": [

            "python",

            "machine learning",

            "scikit-learn",

            "pandas",

            "numpy",

            "statistics",

            "data science",

        ],

    },



    "Data Scientist": {

        "domain": "Data Science",

        "skills": [

            "python",

            "pandas",

            "numpy",

            "scikit-learn",

            "machine learning",

            "statistics",

            "sql",

            "data science",

        ],

    },



    "Database Developer": {

        "domain": "Database Development",

        "skills": [

            "sql",

            "mysql",

            "postgresql",

            "postgres",

            "mongodb",

            "oracle",

            "sqlite",

            "database",

        ],

    },



    "Cloud / DevOps Engineer": {

        "domain": "Cloud & DevOps",

        "skills": [

            "aws",

            "azure",

            "docker",

            "kubernetes",

            "linux",

            "git",

            "github",

            "devops",

            "cloud",

        ],

    },



    "QA / Test Engineer": {

        "domain": "QA & Testing",

        "skills": [

            "testing",

            "software testing",

            "selenium",

            "pytest",

            "automation testing",

            "quality assurance",

            "debugging",

        ],

    },



    "Cybersecurity Analyst": {

        "domain": "Cybersecurity",

        "skills": [

            "cybersecurity",

            "network security",

            "ethical hacking",

            "penetration testing",

            "linux",

            "cryptography",

            "security",

        ],

    },

}





# =========================================================

# HELPERS

# =========================================================



def _normalize_skill(skill):

    return re.sub(

        r"\s+",

        " ",

        str(skill).strip().lower(),

    )





def _safe_percentage(value):

    try:

        return max(0, min(100, round(float(value))))

    except (TypeError, ValueError):

        return 0





def _normalize_list(value):

    if not isinstance(value, list):

        return []



    result = []



    for item in value:

        item = str(item).strip()



        if item and item not in result:

            result.append(item)



    return result





def _normalize_level(level):

    """

    Normalize AI-generated experience levels.

    """



    value = str(level or "").strip().lower()



    if any(

        phrase in value

        for phrase in [

            "senior",

            "lead",

            "principal",

            "staff",

            "experienced",

        ]

    ):

        return "Senior Level"



    if any(

        phrase in value

        for phrase in [

            "mid",

            "intermediate",

            "professional",

        ]

    ):

        return "Mid Level"



    if any(

        phrase in value

        for phrase in [

            "entry",

            "junior",

            "fresher",

            "graduate",

            "intern",

            "trainee",

        ]

    ):

        return "Entry Level"



    return str(level).strip() or "Entry Level"





def _estimate_experience_level(resume_analysis):

    """

    Estimate the candidate's experience level from actual

    resume evidence.



    This is used only by the deterministic fallback.

    The local AI remains the primary decision-maker.

    """



    experience = resume_analysis.get("experience", [])



    if not isinstance(experience, list):

        experience = []



    experience_text = " ".join(

        str(item)

        for item in experience

    ).lower()



    summary = str(

        resume_analysis.get("summary", "")

    ).lower()



    combined = experience_text + " " + summary



    # Explicit senior indicators

    senior_keywords = [

        "senior",

        "lead",

        "principal",

        "manager",

        "director",

        "head of",

        "team lead",

    ]



    if any(

        keyword in combined

        for keyword in senior_keywords

    ):

        return "Senior Level"



    # Look for explicit years of experience.

    

    year_matches = re.findall(
    r"(\d+(?:\.\d+)?)\s*\+?\s*(?:years?|yrs?)",
    combined,
)

    years = []



    for match in year_matches:

        try:

            years.append(float(match))

        except ValueError:

            pass



    if years:

        maximum_years = max(years)



        if maximum_years >= 5:

            return "Senior Level"



        if maximum_years >= 2:

            return "Mid Level"



    # Multiple substantial experience entries are a useful

    # fallback signal when exact years are unavailable.

    if len(experience) >= 3:

        return "Mid Level"



    if len(experience) >= 1:

        return "Entry Level"



    return "Entry Level"





def _normalize_jobs(jobs):

    if not isinstance(jobs, list):

        return []



    normalized = []

    seen_roles = set()



    for item in jobs:



        if not isinstance(item, dict):

            continue



        role = str(

            item.get("role", "")

        ).strip()



        if not role:

            continue



        role_key = role.lower()



        if role_key in seen_roles:

            continue



        seen_roles.add(role_key)



        normalized.append({

            "role": role,



            "domain": str(

                item.get(

                    "domain",

                    "Technology",

                )

            ).strip() or "Technology",



            "level": _normalize_level(

                item.get(

                    "level",

                    "Entry Level",

                )

            ),



            "match_percentage": _safe_percentage(

                item.get(

                    "match_percentage",

                    0,

                )

            ),



            "matching_skills": _normalize_list(

                item.get(

                    "matching_skills",

                    [],

                )

            ),



            "missing_skills": _normalize_list(

                item.get(

                    "missing_skills",

                    [],

                )

            ),



            "reason": str(

                item.get(

                    "reason",

                    "",

                )

            ).strip(),

        })



    return normalized





# =========================================================



def _enforce_candidate_level(jobs, resume_analysis):
    """
    Enforce experience levels supported by resume evidence.

    The local AI can choose roles, but it cannot assign a higher
    level than the candidate evidence supports. For experienced
    candidates, clearly junior roles are also filtered when there
    are other suitable matches.
    """
    if not jobs:
        return jobs

    estimated_level = _estimate_experience_level(resume_analysis)

    if estimated_level == "Entry Level":
        for job in jobs:
            job["level"] = "Entry Level"
        return jobs

    if estimated_level == "Mid Level":
        filtered = [
            job
            for job in jobs
            if not any(
                marker in str(job.get("role", "")).lower()
                for marker in [
                    "junior",
                    "intern",
                    "trainee",
                    "fresher",
                ]
            )
        ]
        if filtered:
            jobs = filtered
        for job in jobs:
            if job.get("level") == "Senior Level":
                job["level"] = "Mid Level"
        return jobs

    if estimated_level == "Senior Level":
        filtered = [
            job
            for job in jobs
            if not any(
                marker in str(job.get("role", "")).lower()
                for marker in [
                    "junior",
                    "intern",
                    "trainee",
                    "fresher",
                ]
            )
        ]
        if filtered:
            jobs = filtered
        for job in jobs:
            job["level"] = "Senior Level"

    return jobs

# FALLBACK MATCHING

# =========================================================



def _calculate_match(

    student_skills,

    required_skills,

):

    student_map = {

        _normalize_skill(skill): str(skill).strip()

        for skill in student_skills

        if str(skill).strip()

    }



    required = [

        _normalize_skill(skill)

        for skill in required_skills

    ]



    matching = []

    missing = []



    for skill in required:



        if skill in student_map:



            original = student_map[skill]



            if original not in matching:

                matching.append(original)



        elif skill not in missing:

            missing.append(skill)



    if not required:

        return 0, matching, missing



    percentage = round(

        len(matching) / len(required) * 100

    )



    return (

        _safe_percentage(percentage),

        matching,

        missing,

    )





def _display_missing_skill(skill):



    names = {

        "python": "Python",

        "java": "Java",

        "javascript": "JavaScript",

        "typescript": "TypeScript",

        "html": "HTML",

        "css": "CSS",

        "react": "React",

        "react.js": "React",

        "node.js": "Node.js",

        "express": "Express",

        "flask": "Flask",

        "fastapi": "FastAPI",

        "sql": "SQL",

        "mysql": "MySQL",

        "postgresql": "PostgreSQL",

        "postgres": "PostgreSQL",

        "mongodb": "MongoDB",

        "api": "API",

        "rest api": "REST API",

        "oop": "OOP",

        "data structures": "Data Structures",

        "algorithms": "Algorithms",

        "git": "Git",

        "github": "GitHub",

        "pandas": "Pandas",

        "numpy": "NumPy",

        "excel": "Excel",

        "power bi": "Power BI",

        "tableau": "Tableau",

        "looker studio": "Looker Studio",

        "statistics": "Statistics",

        "machine learning": "Machine Learning",

        "deep learning": "Deep Learning",

        "scikit-learn": "Scikit-learn",

        "data science": "Data Science",

        "aws": "AWS",

        "azure": "Azure",

        "docker": "Docker",

        "kubernetes": "Kubernetes",

        "linux": "Linux",

        "devops": "DevOps",

        "cloud": "Cloud",

        "testing": "Testing",

        "software testing": "Software Testing",

        "selenium": "Selenium",

        "pytest": "Pytest",

        "automation testing": "Automation Testing",

        "quality assurance": "Quality Assurance",

        "debugging": "Debugging",

        "cybersecurity": "Cybersecurity",

        "network security": "Network Security",

        "ethical hacking": "Ethical Hacking",

        "penetration testing": "Penetration Testing",

        "cryptography": "Cryptography",

        "security": "Security",

        "oracle": "Oracle",

        "sqlite": "SQLite",

        "database": "Database",

    }



    return names.get(

        _normalize_skill(skill),

        str(skill).title(),

    )





def _domain_matches_role(

    role_domain,

    domains,

):

    if not domains:

        return False



    role_domain_normalized = _normalize_skill(

        role_domain

    )



    for domain in domains:



        domain_normalized = _normalize_skill(

            domain

        )



        if (

            role_domain_normalized in domain_normalized

            or domain_normalized in role_domain_normalized

        ):

            return True



    return False





def match_jobs(

    skills: list[str],

    domains: list[str] | None = None,

    resume_analysis: dict | None = None,

):

    """

    Deterministic fallback.



    Used only when the local AI is unavailable.



    The fallback still considers the candidate's

    actual experience level.

    """



    if not skills:

        return []



    domains = domains or []

    resume_analysis = resume_analysis or {}



    experience_level = _estimate_experience_level(

        resume_analysis

    )



    candidates = []



    for role, profile in ROLE_PROFILES.items():



        percentage, matching, missing = (

            _calculate_match(

                skills,

                profile["skills"],

            )

        )



        if not matching:

            continue



        if _domain_matches_role(

            profile["domain"],

            domains,

        ):

            percentage += 5



        percentage = _safe_percentage(

            percentage

        )



        candidates.append({

            "role": role,



            "domain": profile["domain"],



            "level": experience_level,



            "match_percentage": percentage,



            "matching_skills": matching,



            "missing_skills": [

                _display_missing_skill(skill)

                for skill in missing

            ],



            "reason": (

                "Fallback role match based on "

                "resume-derived skills and "

                f"estimated {experience_level.lower()} "

                "experience level."

            ),

        })



    candidates = _normalize_jobs(

        candidates

    )



    candidates.sort(

        key=lambda item: (

            item["match_percentage"],

            len(item["matching_skills"]),

        ),

        reverse=True,

    )



    return candidates[:8]





# =========================================================

# AI JOB MATCHING

# =========================================================



def analyze_job_matches(

    resume_analysis: dict,

    career_analysis: dict,

):

    """

    Primary job-role analysis using the local LLM.



    The model considers the candidate's actual resume,

    career-domain recommendations, projects, experience,

    education, certifications and skills.

    """



    candidate_profile = {

        "skills": resume_analysis.get(

            "skills",

            [],

        ),



        "education": resume_analysis.get(

            "education",

            [],

        ),



        "projects": resume_analysis.get(

            "projects",

            [],

        ),



        "experience": resume_analysis.get(

            "experience",

            [],

        ),



        "certifications": resume_analysis.get(

            "certifications",

            [],

        ),



        "achievements": resume_analysis.get(

            "achievements",

            [],

        ),



        "summary": resume_analysis.get(

            "summary",

            "",

        ),

    }



    career_domains = career_analysis.get(

        "recommended_domains",

        [],

    )



    # -----------------------------------------------------

    # AI PROMPT

    # -----------------------------------------------------



    prompt = f"""

You are the Job Matching Agent in PrepMate AI.



Analyze this candidate and identify realistic job roles that fit their

actual profile.



IMPORTANT RULES:



1. Use the candidate's actual evidence from skills, projects, education,

   experience, certifications, achievements and career-domain analysis.



2. Determine the appropriate experience level from the candidate's

   actual evidence.



3. Do NOT assume every candidate is entry-level.



4. If the candidate is a student or fresher with little or no professional

   experience, recommend appropriate entry-level or graduate roles.



5. If the candidate has substantial professional experience, recommend

   mid-level or senior roles when supported by the evidence.



6. Never recommend a junior role merely because the candidate has skills

   associated with that role.



7. Do not invent skills, experience, achievements, qualifications or

   responsibilities.



8. Do not simply map one skill to one job. Consider the candidate's

   overall profile.



9. Consider both current skills and genuine missing skills.



10. You may suggest roles outside the listed career domains when the

    candidate evidence strongly supports them.



11. Do not restrict yourself to the fallback role list.



12. The match percentage is an estimated fit based on available evidence,

    not a guarantee of employment.



13. The recommended role level must be consistent with the candidate's

    demonstrated experience.



14. Recommend multiple relevant roles when supported by the candidate's

    profile.



15. Avoid recommending roles that are clearly below the candidate's

    demonstrated experience unless the candidate has explicitly shown

    interest in transitioning to that level.



16. Return ONLY valid JSON.



Return exactly:



{{

  "job_matches": [

    {{

      "role": "Role name",

      "domain": "Career domain",

      "level": "Entry Level, Mid Level, or Senior Level",

      "match_percentage": 0,

      "matching_skills": [

        "skill 1",

        "skill 2"

      ],

      "missing_skills": [

        "skill 1",

        "skill 2"

      ],

      "reason": "Short explanation based on candidate evidence and experience level."

    }}

  ],

  "skills_used": [

    "skill 1",

    "skill 2"

  ]

}}



Candidate profile:



{candidate_profile}



Career-domain analysis:



{career_domains}

"""



    # -----------------------------------------------------

    # CALL LOCAL AI

    # -----------------------------------------------------



    ai = generate_json(

        prompt,

        system=(

            "You are a careful job-matching AI. "

            "Use only candidate evidence. "

            "Never invent candidate qualifications. "

            "Determine role level from actual experience. "

            "Return only valid JSON."

        ),

    )



    # -----------------------------------------------------

    # VALIDATE AI RESPONSE

    # -----------------------------------------------------



    if isinstance(ai, dict):



        jobs = _normalize_jobs(

            ai.get(

                "job_matches",

                [],

            )

        )



        jobs = _enforce_candidate_level(
            jobs=jobs,
            resume_analysis=resume_analysis,
        )

        if jobs:



            return {

                "job_matches": jobs[:8],



                "skills_used": _normalize_list(

                    ai.get(

                        "skills_used",

                        resume_analysis.get(

                            "skills",

                            [],

                        ),

                    )

                ),

            }



    # -----------------------------------------------------

    # FALLBACK

    # -----------------------------------------------------



    skills = resume_analysis.get(

        "skills",

        [],

    )



    domains = [

        item.get(

            "domain",

            "",

        )

        for item in career_domains

        if isinstance(item, dict)

        and item.get("domain")

    ]



    matches = match_jobs(

        skills=skills,

        domains=domains,

        resume_analysis=resume_analysis,

    )



    return {

        "job_matches": matches,

        "skills_used": skills,

    }