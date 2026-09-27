from pydantic import BaseModel, EmailStr


class StudentCreate(BaseModel):
    name: str
    email: EmailStr
    college: str | None = None
    branch: str | None = None
    cgpa: str | None = None