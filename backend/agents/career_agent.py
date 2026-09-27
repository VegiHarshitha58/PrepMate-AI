DOMAIN_SKILLS = {
    "Software Development": {
        "python", "java", "c", "c++", "javascript", "typescript",
        "git", "github", "sql", "data structures"
    },
    "Web Development": {
        "html", "css", "javascript", "typescript", "react",
        "node.js", "express", "frontend", "backend"
    },
    "Data Science": {
        "python", "pandas", "numpy", "sql", "statistics",
        "data science", "machine learning", "scikit-learn"
    },
    "Data Analytics": {
        "python", "sql", "excel", "power bi", "tableau",
        "data analysis", "pandas", "statistics"
    },
    "AI / Machine Learning": {
        "python", "machine learning", "deep learning",
        "artificial intelligence", "tensorflow", "pytorch",
        "scikit-learn", "nlp"
    },
    "Backend Development": {
        "python", "java", "node.js", "express", "fastapi",
        "flask", "sql", "postgresql", "mysql"
    },
    "Cybersecurity": {
        "python", "linux", "networking", "cybersecurity",
        "cryptography", "ethical hacking"
    }
}


def recommend_domains(skills: list[str]):
    user_skills = {skill.lower() for skill in skills}

    recommendations = []

    for domain, required_skills in DOMAIN_SKILLS.items():
        matching_skills = sorted(
            user_skills.intersection(required_skills)
        )

        percentage = round(
            (len(matching_skills) / len(required_skills)) * 100
        )

        recommendations.append({
            "domain": domain,
            "match_percentage": min(percentage, 100),
            "matching_skills": matching_skills
        })

    recommendations.sort(
        key=lambda x: x["match_percentage"],
        reverse=True
    )

    return recommendations


def analyze_career_domains(resume_analysis: dict):
    skills = resume_analysis.get("skills", [])

    recommendations = recommend_domains(skills)

    return {
        "recommended_domains": recommendations[:5],
        "skills_used": skills
    }