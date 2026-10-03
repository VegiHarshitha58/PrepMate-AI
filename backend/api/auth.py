import hashlib
import hmac
import secrets

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from database.connection import engine
from database.models import Student
from schemas.auth import RegisterRequest, LoginRequest


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)


def get_db():
    with Session(engine) as session:
        yield session


def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)

    password_hash = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt,
        100_000
    )

    return f"{salt.hex()}:{password_hash.hex()}"


def verify_password(
    password: str,
    stored_hash: str
) -> bool:
    try:
        salt_hex, hash_hex = stored_hash.split(":", 1)

        salt = bytes.fromhex(salt_hex)

        new_hash = hashlib.pbkdf2_hmac(
            "sha256",
            password.encode("utf-8"),
            salt,
            100_000
        )

        return hmac.compare_digest(
            new_hash.hex(),
            hash_hex
        )

    except (ValueError, TypeError):
        return False


@router.post("/register")
def register(
    data: RegisterRequest,
    db: Session = Depends(get_db)
):
    name = data.name.strip()
    email = data.email.strip().lower()

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

    if not data.password:
        raise HTTPException(
            status_code=400,
            detail="Password is required."
        )

    existing_student = (
        db.query(Student)
        .filter(Student.email == email)
        .first()
    )

    if existing_student:
        raise HTTPException(
            status_code=400,
            detail="An account with this email already exists."
        )

    new_student = Student(
        name=name,
        email=email,
        college=(
            data.college.strip()
            if data.college
            else None
        ),
        password_hash=hash_password(data.password)
    )

    try:
        db.add(new_student)
        db.commit()
        db.refresh(new_student)

    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=400,
            detail="An account with this email already exists."
        )

    return {
        "message": "Account created successfully.",
        "student_id": new_student.id,
        "name": new_student.name,
        "email": new_student.email,
        "college": new_student.college
    }


@router.post("/login")
def login(
    data: LoginRequest,
    db: Session = Depends(get_db)
):
    email = data.email.strip().lower()

    student = (
        db.query(Student)
        .filter(Student.email == email)
        .first()
    )

    if not student:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password."
        )

    if not student.password_hash:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password."
        )

    if not verify_password(
        data.password,
        student.password_hash
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password."
        )

    return {
        "message": "Login successful.",
        "student_id": student.id,
        "name": student.name,
        "email": student.email,
        "college": student.college
    }