from fastapi import APIRouter, HTTPException
from sqlalchemy.orm import Session
import json

from database.connection import engine
from database.models import ResumeAnalysis

from agents.interview_agent import generate_interview_questions
from agents.evaluation_agent import evaluate_interview


router = APIRouter(
    prefix="/api/interview",
    tags=["Interview"]
)


def get_db():
    with Session(engine) as session:
        yield session


def load_json(value, default):
    try:
        return json.loads(value) if value else default
    except (json.JSONDecodeError, TypeError):
        return default


@router.post("/generate")
def generate_mock_interview(payload: dict):
    if not isinstance(payload, dict):
        raise HTTPException(
            status_code=400,
            detail="Invalid request payload."
        )

    student_id = payload.get("student_id")

    try:
        student_id = int(student_id)
    except (TypeError, ValueError):
        raise HTTPException(
            status_code=400,
            detail="Valid student ID is required."
        )

    if student_id <= 0:
        raise HTTPException(
            status_code=400,
            detail="Valid student ID is required."
        )

    try:
        question_count = int(
            payload.get("question_count", 10)
        )
    except (TypeError, ValueError):
        raise HTTPException(
            status_code=400,
            detail="Question count must be a number."
        )

    interview_type = payload.get(
        "interview_type",
        "Mixed"
    )

    difficulty = payload.get(
        "difficulty",
        "Medium"
    )

    if question_count < 1 or question_count > 30:
        raise HTTPException(
            status_code=400,
            detail="Question count must be between 1 and 30."
        )

    if interview_type not in {
        "Mixed",
        "Technical",
        "HR",
        "Role-specific"
    }:
        raise HTTPException(
            status_code=400,
            detail="Invalid interview type."
        )

    if difficulty not in {
        "Easy",
        "Medium",
        "Hard"
    }:
        raise HTTPException(
            status_code=400,
            detail="Invalid difficulty."
        )

    db = next(get_db())

    try:
        analysis = (
            db.query(ResumeAnalysis)
            .filter(
                ResumeAnalysis.student_id == student_id
            )
            .order_by(
                ResumeAnalysis.id.desc()
            )
            .first()
        )

        if not analysis:
            raise HTTPException(
                status_code=404,
                detail=(
                    "No resume analysis found. "
                    "Upload and analyze your resume first."
                )
            )

        resume_analysis = {
            "skills": load_json(
                analysis.skills,
                []
            ),
            "education": load_json(
                analysis.education,
                []
            ),
            "detected_sections": load_json(
                analysis.detected_sections,
                []
            ),
            "resume_score": analysis.resume_score or 0,
            "word_count": analysis.word_count or 0
        }

        career_analysis = load_json(
            analysis.career_analysis,
            {}
        )

        job_analysis = load_json(
            analysis.job_analysis,
            {}
        )

        skill_gap_analysis = load_json(
            analysis.skill_gap_analysis,
            {}
        )

        interview = generate_interview_questions(
            resume_analysis=resume_analysis,
            career_analysis=career_analysis,
            job_analysis=job_analysis,
            skill_gap_analysis=skill_gap_analysis,
            question_count=question_count,
            interview_type=interview_type,
            difficulty=difficulty
        )

        return {
            "analysis_id": analysis.id,
            "student_id": student_id,
            "interview": interview
        }

    except HTTPException:
        raise

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Interview generation failed: {str(exc)}"
        )

    finally:
        db.close()


@router.post("/evaluate")
def evaluate_mock_interview(payload: dict):
    if not isinstance(payload, dict):
        raise HTTPException(
            status_code=400,
            detail="Invalid request payload."
        )

    questions = payload.get(
        "questions",
        []
    )

    answers = payload.get(
        "answers",
        []
    )

    if not isinstance(questions, list):
        raise HTTPException(
            status_code=400,
            detail="Questions must be provided as a list."
        )

    if not isinstance(answers, list):
        raise HTTPException(
            status_code=400,
            detail="Answers must be provided as a list."
        )

    if not questions:
        raise HTTPException(
            status_code=400,
            detail="No interview questions were provided."
        )

    try:
        result = evaluate_interview(
            questions=questions,
            answers=answers
        )

        return {
            "evaluation": result
        }

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Interview evaluation failed: {str(exc)}"
        )