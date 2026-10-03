from sqlalchemy import Column, Integer, String, Text, ForeignKey, Boolean, text
from sqlalchemy.orm import declarative_base
from database.connection import engine

Base = declarative_base()


class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, nullable=False)
    college = Column(String(200))
    branch = Column(String(100))
    cgpa = Column(String(20))
    password_hash = Column(String(255), nullable=False)


class ResumeAnalysis(Base):
    __tablename__ = "resume_analyses"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False, index=True)
    filename = Column(String(255))
    candidate_email = Column(String(150))
    candidate_phone = Column(String(30))
    resume_score = Column(Integer)
    word_count = Column(Integer)
    skills = Column(Text)
    education = Column(Text)
    detected_sections = Column(Text)
    career_analysis = Column(Text)
    job_analysis = Column(Text)
    skill_gap_analysis = Column(Text)
    roadmap_analysis = Column(Text)


class RoadmapProgress(Base):
    __tablename__ = "roadmap_progress"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False, index=True)
    analysis_id = Column(Integer, ForeignKey("resume_analyses.id"), nullable=False, index=True)
    week = Column(Integer, nullable=False)
    done = Column(Boolean, default=False, nullable=False)


def create_tables():
    Base.metadata.create_all(bind=engine)

    # Lightweight PostgreSQL migration for databases created by an older
    # version of PrepMate AI. create_all() does not add new columns.
    with engine.begin() as connection:
        connection.execute(text(
            "ALTER TABLE IF EXISTS resume_analyses "
            "ADD COLUMN IF NOT EXISTS candidate_email VARCHAR(150)"
        ))
        connection.execute(text(
            "ALTER TABLE IF EXISTS resume_analyses "
            "ADD COLUMN IF NOT EXISTS candidate_phone VARCHAR(30)"
        ))

    print("Database tables ready!")


if __name__ == "__main__":
    create_tables()
