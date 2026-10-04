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

    # Extended profile information
    phone: str | None = Field(
        default=None,
        max_length=30
    )

    location: str | None = Field(
        default=None,
        max_length=200
    )

    degree: str | None = Field(
        default="B.Tech",
        max_length=100
    )

    skills: list[str] = Field(
        default_factory=list
    )

    softSkills: list[str] = Field(
        default_factory=list
    )

    interests: list[str] = Field(
        default_factory=list
    )