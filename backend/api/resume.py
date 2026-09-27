from fastapi import APIRouter, UploadFile, File, HTTPException, Form
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


router = APIRouter(
    prefix="/api/resume",
    tags=["Resume"]
)


def get_db():
    with Session(engine) as session:
        yield session


@router.post("/upload")
async def upload_resume(
    file: UploadFile = File(...),
    student_id: int = Form(...)
):

    if file.content_type != "application/pdf":
        raise HTTPException(
            status_code=400,
            detail="Only PDF files are allowed."
        )

    contents = await file.read()

    try:
        pdf = fitz.open(
            stream=contents,
            filetype="pdf"
        )

        text = ""

        for page in pdf:
            text += page.get_text() + "\n"

        pdf.close()

        if not text.strip():
            raise HTTPException(
                status_code=400,
                detail="Could not extract text from the PDF."
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
            career_analysis
        )

        # =========================
        # AGENT 4 — SKILL GAP
        # =========================
        skill_gap_analysis = analyze_skill_gaps(
            resume_analysis,
            job_analysis
        )

        # =========================
        # AGENT 5 — ROADMAP
        # =========================
        roadmap_analysis = generate_roadmap(
            skill_gap_analysis
        )

        # =========================
        # SAVE TO POSTGRESQL
        # =========================
        db = next(get_db())

        try:
            new_analysis = ResumeAnalysis(
                student_id=student_id,

                filename=file.filename,

                resume_score=resume_analysis.get(
                    "resume_score",
                    0
                ),

                word_count=resume_analysis.get(
                    "word_count",
                    0
                ),

                skills=json.dumps(
                    resume_analysis.get(
                        "skills",
                        []
                    )
                ),

                education=json.dumps(
                    resume_analysis.get(
                        "education",
                        []
                    )
                ),

                detected_sections=json.dumps(
                    resume_analysis.get(
                        "detected_sections",
                        []
                    )
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
                )
            )

            db.add(new_analysis)

            db.commit()

            db.refresh(new_analysis)

        finally:
            db.close()

        return {
            "message": "Resume processed and saved successfully.",

            "analysis_id": new_analysis.id,

            "filename": file.filename,

            "resume_analysis": resume_analysis,

            "career_analysis": career_analysis,

            "job_analysis": job_analysis,

            "skill_gap_analysis": skill_gap_analysis,

            "roadmap_analysis": roadmap_analysis
        }

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error processing resume: {str(e)}"
        )


@router.get("/latest/{student_id}")
def get_latest_resume_analysis(
    student_id: int
):
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
                detail="No resume analysis found for this student."
            )

        return {
            "analysis_id": analysis.id,

            "student_id": analysis.student_id,

            "filename": analysis.filename,

            "resume_score": analysis.resume_score,

            "word_count": analysis.word_count,

            "skills": json.loads(
                analysis.skills or "[]"
            ),

            "education": json.loads(
                analysis.education or "[]"
            ),

            "detected_sections": json.loads(
                analysis.detected_sections or "[]"
            ),

            "career_analysis": json.loads(
                analysis.career_analysis or "{}"
            ),

            "job_analysis": json.loads(
                analysis.job_analysis or "{}"
            ),

            "skill_gap_analysis": json.loads(
                analysis.skill_gap_analysis or "{}"
            ),

            "roadmap_analysis": json.loads(
                analysis.roadmap_analysis or "{}"
            )
        }

    finally:
        db.close()