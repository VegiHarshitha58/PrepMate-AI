from fastapi import (
    APIRouter,
    UploadFile,
    File,
    HTTPException,
    Form,
)

import fitz
import json

from sqlalchemy.orm import Session

from database.connection import engine
from database.models import ResumeAnalysis

from agents.resume_agent import analyze_resume
from agents.career_agent import analyze_career_domains
from agents.job_agent import analyze_job_matches
from agents.skill_gap_agent import analyze_skill_gaps
from agents.roadmap_agent import generate_roadmap
from agents.resume_optimizer_agent import optimize_resume
from agents.resume_rewrite_agent import rewrite_summary


router = APIRouter(
    prefix="/api/resume",
    tags=["Resume"],
)


def get_db():
    with Session(engine) as session:
        yield session


def load_json(value, default):
    try:
        return json.loads(value) if value else default
    except (json.JSONDecodeError, TypeError):
        return default


@router.post("/upload")
async def upload_resume(
    file: UploadFile = File(...),
    student_id: int = Form(...),
):
    if student_id <= 0:
        raise HTTPException(
            status_code=400,
            detail="Valid student ID is required.",
        )

    if not file.filename:
        raise HTTPException(
            status_code=400,
            detail="A resume file is required.",
        )

    if file.content_type != "application/pdf":
        raise HTTPException(
            status_code=400,
            detail="Only PDF files are allowed.",
        )

    contents = await file.read()

    if not contents:
        raise HTTPException(
            status_code=400,
            detail="Uploaded PDF is empty.",
        )

    pdf = None

    try:
        # =========================
        # EXTRACT RESUME TEXT
        # =========================
        pdf = fitz.open(
            stream=contents,
            filetype="pdf",
        )

        text_parts = []

        for page in pdf:
            page_text = page.get_text()

            if page_text:
                text_parts.append(page_text)

        text = "\n".join(text_parts).strip()

        if not text:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Could not extract text from the PDF. "
                    "Make sure the PDF contains selectable text."
                ),
            )

        # =========================
        # AGENT 1 — RESUME ANALYSIS
        # =========================
        resume_analysis = analyze_resume(text)

        # =========================
        # AGENT 2 — CAREER ANALYSIS
        # =========================
        career_analysis = analyze_career_domains(
            resume_analysis
        )

        # =========================
        # AGENT 3 — JOB MATCHING
        # =========================
        job_analysis = analyze_job_matches(
            resume_analysis,
            career_analysis,
        )

        # =========================
        # AGENT 4 — SKILL GAP
        # =========================
        skill_gap_analysis = analyze_skill_gaps(
            resume_analysis,
            job_analysis,
        )

        # =========================
        # AGENT 5 — ROADMAP
        # =========================
        roadmap_analysis = generate_roadmap(
            skill_gap_analysis=skill_gap_analysis,
            resume_analysis=resume_analysis,
            job_analysis=job_analysis,
        )

        # =========================
        # SAVE ANALYSIS
        # =========================
        db = next(get_db())

        try:
            new_analysis = ResumeAnalysis(
                student_id=student_id,
                filename=file.filename,

                candidate_email=resume_analysis.get(
                    "candidate_email"
                ),

                candidate_phone=resume_analysis.get(
                    "candidate_phone"
                ),

                resume_score=resume_analysis.get(
                    "resume_score",
                    0,
                ),

                word_count=resume_analysis.get(
                    "word_count",
                    0,
                ),

                skills=json.dumps(
                    resume_analysis.get(
                        "skills",
                        [],
                    )
                ),

                education=json.dumps(
                    resume_analysis.get(
                        "education",
                        [],
                    )
                ),

                detected_sections=json.dumps(
                    resume_analysis.get(
                        "detected_sections",
                        [],
                    )
                ),

                projects=json.dumps(
                    resume_analysis.get(
                        "projects",
                        [],
                    )
                ),

                experience=json.dumps(
                    resume_analysis.get(
                        "experience",
                        [],
                    )
                ),

                certifications=json.dumps(
                    resume_analysis.get(
                        "certifications",
                        [],
                    )
                ),

                achievements=json.dumps(
                    resume_analysis.get(
                        "achievements",
                        [],
                    )
                ),

                summary=resume_analysis.get(
                    "summary",
                    "",
                ),

                career_analysis=json.dumps(
                    career_analysis
                ),

                job_analysis=json.dumps(
                    job_analysis
                ),

                skill_gap_analysis=json.dumps(
                    skill_gap_analysis
                ),

                roadmap_analysis=json.dumps(
                    roadmap_analysis
                ),
            )

            db.add(new_analysis)
            db.commit()
            db.refresh(new_analysis)

            analysis_id = new_analysis.id

        except Exception:
            db.rollback()
            raise

        finally:
            db.close()

        return {
            "message": (
                "Resume processed and saved successfully."
            ),
            "analysis_id": analysis_id,
            "filename": file.filename,
            "resume_analysis": resume_analysis,
            "career_analysis": career_analysis,
            "job_analysis": job_analysis,
            "skill_gap_analysis": skill_gap_analysis,
            "roadmap_analysis": roadmap_analysis,
        }

    except HTTPException:
        raise

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Error processing resume: {str(exc)}",
        )

    finally:
        if pdf is not None:
            pdf.close()


@router.get("/latest/{student_id}")
def get_latest_resume_analysis(
    student_id: int,
):
    if student_id <= 0:
        raise HTTPException(
            status_code=400,
            detail="Valid student ID is required.",
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
                    "No resume analysis found "
                    "for this student."
                ),
            )

        return {
            "analysis_id": analysis.id,
            "student_id": analysis.student_id,
            "filename": analysis.filename,

            "candidate_email": (
                analysis.candidate_email
            ),

            "candidate_phone": (
                analysis.candidate_phone
            ),

            "resume_score": (
                analysis.resume_score or 0
            ),

            "word_count": (
                analysis.word_count or 0
            ),

            "skills": load_json(
                analysis.skills,
                [],
            ),

            "education": load_json(
                analysis.education,
                [],
            ),

            "detected_sections": load_json(
                analysis.detected_sections,
                [],
            ),

            "projects": load_json(
                analysis.projects,
                [],
            ),

            "experience": load_json(
                analysis.experience,
                [],
            ),

            "certifications": load_json(
                analysis.certifications,
                [],
            ),

            "achievements": load_json(
                analysis.achievements,
                [],
            ),

            "summary": analysis.summary or "",

            "career_analysis": load_json(
                analysis.career_analysis,
                {},
            ),

            "job_analysis": load_json(
                analysis.job_analysis,
                {},
            ),

            "skill_gap_analysis": load_json(
                analysis.skill_gap_analysis,
                {},
            ),

            "roadmap_analysis": load_json(
                analysis.roadmap_analysis,
                {},
            ),
        }

    finally:
        db.close()


@router.get("/optimize/{analysis_id}")
def optimize_existing_resume(
    analysis_id: int,
):
    if analysis_id <= 0:
        raise HTTPException(
            status_code=400,
            detail="Valid analysis ID is required.",
        )

    db = next(get_db())

    try:
        analysis = (
            db.query(ResumeAnalysis)
            .filter(
                ResumeAnalysis.id == analysis_id
            )
            .first()
        )

        if not analysis:
            raise HTTPException(
                status_code=404,
                detail="Resume analysis not found.",
            )

        # =========================
        # RESUME ANALYSIS
        # =========================
        resume_analysis = {
            "candidate_email": (
                analysis.candidate_email
            ),

            "candidate_phone": (
                analysis.candidate_phone
            ),

            "skills": load_json(
                analysis.skills,
                [],
            ),

            "education": load_json(
                analysis.education,
                [],
            ),

            "detected_sections": load_json(
                analysis.detected_sections,
                [],
            ),

            "projects": load_json(
                analysis.projects,
                [],
            ),

            "experience": load_json(
                analysis.experience,
                [],
            ),

            "certifications": load_json(
                analysis.certifications,
                [],
            ),

            "achievements": load_json(
                analysis.achievements,
                [],
            ),

            "summary": analysis.summary or "",

            "resume_score": (
                analysis.resume_score or 0
            ),

            "word_count": (
                analysis.word_count or 0
            ),
        }

        # =========================
        # PREVIOUS AI ANALYSES
        # =========================
        career_analysis = load_json(
            analysis.career_analysis,
            {},
        )

        job_analysis = load_json(
            analysis.job_analysis,
            {},
        )

        skill_gap_analysis = load_json(
            analysis.skill_gap_analysis,
            {},
        )

        # =========================
        # RESUME OPTIMIZER AI
        # =========================
        optimization = optimize_resume(
            resume_analysis=resume_analysis,
            career_analysis=career_analysis,
            job_analysis=job_analysis,
            skill_gap_analysis=skill_gap_analysis,
        )

        return {
            "analysis_id": analysis.id,
            "optimization": optimization,
        }

    finally:
        db.close()


@router.post("/rewrite-summary")
def rewrite_resume_summary(
    summary: str,
    analysis_id: int,
):
    if analysis_id <= 0:
        raise HTTPException(
            status_code=400,
            detail="Valid analysis ID is required.",
        )

    if not summary.strip():
        raise HTTPException(
            status_code=400,
            detail="Summary cannot be empty.",
        )

    db = next(get_db())

    try:
        analysis = (
            db.query(ResumeAnalysis)
            .filter(
                ResumeAnalysis.id == analysis_id
            )
            .first()
        )

        if not analysis:
            raise HTTPException(
                status_code=404,
                detail="Resume analysis not found.",
            )

        skills = load_json(
            analysis.skills,
            [],
        )

        result = rewrite_summary(
            summary=summary,
            skills=skills,
        )

        return {
            "analysis_id": analysis_id,
            "result": result,
        }

    finally:
        db.close()