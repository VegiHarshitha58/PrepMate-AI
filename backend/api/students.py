from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
import json

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


def load_list(value):
    """Safely convert stored JSON text into a Python list."""
    if not value:
        return []

    try:
        data = json.loads(value)

        if isinstance(data, list):
            return data

    except (json.JSONDecodeError, TypeError):
        pass

    return []


def save_list(value):
    """Convert a Python list into JSON text for PostgreSQL."""
    if not value:
        return "[]"

    return json.dumps(value)


@router.post("/")
def create_student(
    student: StudentCreate,
    db: Session = Depends(get_db)
):
    name = student.name.strip()
    email = student.email.strip().lower()

    if not name:
        raise HTTPException(
            status_code=400,
            detail="Name is required."
        )

    if not email:
        raise HTTPException(
            status_code=400,
            detail="Email is required."
        )

    existing_student = (
        db.query(Student)
        .filter(Student.email == email)
        .first()
    )

    if existing_student:
        raise HTTPException(
            status_code=400,
            detail="Student with this email already exists."
        )

    new_student = Student(
        name=name,
        email=email,
        college=(
            student.college.strip()
            if student.college
            else None
        ),
        branch=(
            student.branch.strip()
            if student.branch
            else None
        ),
        cgpa=(
            student.cgpa.strip()
            if student.cgpa
            else None
        ),

        # Extended profile fields
        phone=(
            student.phone.strip()
            if student.phone
            else None
        ),
        location=(
            student.location.strip()
            if student.location
            else None
        ),
        degree=(
            student.degree.strip()
            if student.degree
            else "B.Tech"
        ),
        skills=save_list(student.skills),
        soft_skills=save_list(student.softSkills),
        interests=save_list(student.interests),

        password_hash=""
    )

    try:
        db.add(new_student)
        db.commit()
        db.refresh(new_student)

    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=400,
            detail="Student with this email already exists."
        )

    return {
        "message": "Student created successfully.",
        "student_id": new_student.id
    }


@router.get("/{student_id}")
def get_student(
    student_id: int,
    db: Session = Depends(get_db)
):
    if student_id <= 0:
        raise HTTPException(
            status_code=400,
            detail="Valid student ID is required."
        )

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

        # Extended profile
        "phone": student.phone or "",
        "location": student.location or "",
        "degree": student.degree or "B.Tech",
        "skills": load_list(student.skills),
        "softSkills": load_list(student.soft_skills),
        "interests": load_list(student.interests)
    }


@router.put("/{student_id}")
def update_student(
    student_id: int,
    student_data: StudentCreate,
    db: Session = Depends(get_db)
):
    if student_id <= 0:
        raise HTTPException(
            status_code=400,
            detail="Valid student ID is required."
        )

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

    email = student_data.email.strip().lower()

    existing_student = (
        db.query(Student)
        .filter(
            Student.email == email,
            Student.id != student_id
        )
        .first()
    )

    if existing_student:
        raise HTTPException(
            status_code=400,
            detail="Another student is already using this email."
        )

    student.name = student_data.name.strip()
    student.email = email

    student.college = (
        student_data.college.strip()
        if student_data.college
        else None
    )

    student.branch = (
        student_data.branch.strip()
        if student_data.branch
        else None
    )

    student.cgpa = (
        student_data.cgpa.strip()
        if student_data.cgpa
        else None
    )

    # Extended profile
    student.phone = (
        student_data.phone.strip()
        if student_data.phone
        else None
    )

    student.location = (
        student_data.location.strip()
        if student_data.location
        else None
    )

    student.degree = (
        student_data.degree.strip()
        if student_data.degree
        else "B.Tech"
    )

    student.skills = save_list(student_data.skills)
    student.soft_skills = save_list(student_data.softSkills)
    student.interests = save_list(student_data.interests)

    try:
        db.commit()
        db.refresh(student)

    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=400,
            detail="Could not update student profile."
        )

    return {
        "message": "Student profile updated successfully.",
        "student": {
            "id": student.id,
            "name": student.name,
            "email": student.email,
            "college": student.college,
            "branch": student.branch,
            "cgpa": student.cgpa,

            "phone": student.phone or "",
            "location": student.location or "",
            "degree": student.degree or "B.Tech",
            "skills": load_list(student.skills),
            "softSkills": load_list(student.soft_skills),
            "interests": load_list(student.interests)
        }
    }