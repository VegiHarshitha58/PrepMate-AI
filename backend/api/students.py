from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database.connection import engine
from database.models import Student
from schemas.student import StudentCreate


router = APIRouter(
    prefix="/api/students",
    tags=["Students"]
)


def get_db():
    with Session(engine) as session:
        yield session


@router.post("/")
def create_student(
    student: StudentCreate,
    db: Session = Depends(get_db)
):
    existing_student = (
        db.query(Student)
        .filter(Student.email == student.email)
        .first()
    )

    if existing_student:
        raise HTTPException(
            status_code=400,
            detail="Student with this email already exists."
        )

    new_student = Student(
        name=student.name,
        email=student.email,
        college=student.college,
        branch=student.branch,
        cgpa=student.cgpa,
        password_hash=""
    )

    db.add(new_student)
    db.commit()
    db.refresh(new_student)

    return {
        "message": "Student created successfully",
        "student_id": new_student.id,
    }


@router.get("/{student_id}")
def get_student(
    student_id: int,
    db: Session = Depends(get_db)
):
    student = (
        db.query(Student)
        .filter(Student.id == student_id)
        .first()
    )

    if not student:
        raise HTTPException(
            status_code=404,
            detail="Student not found."
        )

    return {
        "id": student.id,
        "name": student.name,
        "email": student.email,
        "college": student.college,
        "branch": student.branch,
        "cgpa": student.cgpa,
    }


@router.put("/{student_id}")
def update_student(
    student_id: int,
    student_data: StudentCreate,
    db: Session = Depends(get_db)
):
    student = (
        db.query(Student)
        .filter(Student.id == student_id)
        .first()
    )

    if not student:
        raise HTTPException(
            status_code=404,
            detail="Student not found."
        )

    # Check if another student already uses this email
    existing_student = (
        db.query(Student)
        .filter(
            Student.email == student_data.email,
            Student.id != student_id
        )
        .first()
    )

    if existing_student:
        raise HTTPException(
            status_code=400,
            detail="Another student is already using this email."
        )

    student.name = student_data.name
    student.email = student_data.email
    student.college = student_data.college
    student.branch = student_data.branch
    student.cgpa = student_data.cgpa

    db.commit()
    db.refresh(student)

    return {
        "message": "Student profile updated successfully.",
        "student": {
            "id": student.id,
            "name": student.name,
            "email": student.email,
            "college": student.college,
            "branch": student.branch,
            "cgpa": student.cgpa,
        }
    }