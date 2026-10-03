from pydantic import BaseModel, EmailStr, Field


class StudentCreate(BaseModel):
    name: str = Field(
        min_length=2,
        max_length=100
    )

    email: EmailStr

    college: str | None = Field(
        default=None,
        max_length=200
    )

    branch: str | None = Field(
        default=None,
        max_length=100
    )

    cgpa: str | None = Field(
        default=None,
        max_length=20
    )