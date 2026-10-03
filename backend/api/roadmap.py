from fastapi import APIRouter, HTTPException
from sqlalchemy.orm import Session

from database.connection import engine
from database.models import RoadmapProgress


router = APIRouter(
    prefix="/api/roadmap",
    tags=["Roadmap"]
)


def get_db():
    with Session(engine) as session:
        yield session


@router.post("/progress")
def update_roadmap_progress(
    student_id: int,
    analysis_id: int,
    week: int,
    done: bool
):
    if student_id <= 0:
        raise HTTPException(
            status_code=400,
            detail="Valid student ID is required."
        )

    if analysis_id <= 0:
        raise HTTPException(
            status_code=400,
            detail="Valid analysis ID is required."
        )

    if week <= 0:
        raise HTTPException(
            status_code=400,
            detail="Week must be greater than 0."
        )

    db = next(get_db())

    try:
        progress = (
            db.query(RoadmapProgress)
            .filter(
                RoadmapProgress.student_id == student_id,
                RoadmapProgress.analysis_id == analysis_id,
                RoadmapProgress.week == week
            )
            .first()
        )

        if progress:
            progress.done = done
        else:
            progress = RoadmapProgress(
                student_id=student_id,
                analysis_id=analysis_id,
                week=week,
                done=done
            )
            db.add(progress)

        db.commit()
        db.refresh(progress)

        return {
            "message": "Roadmap progress updated successfully.",
            "student_id": student_id,
            "analysis_id": analysis_id,
            "week": week,
            "done": progress.done
        }

    except Exception as exc:
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail=f"Failed to update roadmap progress: {str(exc)}"
        )

    finally:
        db.close()


@router.get("/progress/{student_id}/{analysis_id}")
def get_roadmap_progress(
    student_id: int,
    analysis_id: int
):
    if student_id <= 0:
        raise HTTPException(
            status_code=400,
            detail="Valid student ID is required."
        )

    if analysis_id <= 0:
        raise HTTPException(
            status_code=400,
            detail="Valid analysis ID is required."
        )

    db = next(get_db())

    try:
        progress = (
            db.query(RoadmapProgress)
            .filter(
                RoadmapProgress.student_id == student_id,
                RoadmapProgress.analysis_id == analysis_id
            )
            .order_by(
                RoadmapProgress.week.asc()
            )
            .all()
        )

        return [
            {
                "week": item.week,
                "done": item.done
            }
            for item in progress
        ]

    finally:
        db.close()