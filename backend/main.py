from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from api.students import router as student_router
from api.resume import router as resume_router
from api.auth import router as auth_router
from api.roadmap import router as roadmap_router
from api.interview import router as interview_router
from database.models import create_tables
from services.ai_service import provider_status


load_dotenv()


app = FastAPI(
    title="PrepMate AI Backend",
    version="2.0.0"
)


@app.on_event("startup")
def startup():
    create_tables()


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(student_router)
app.include_router(resume_router)
app.include_router(auth_router)
app.include_router(roadmap_router)
app.include_router(interview_router)


@app.get("/")
def home():
    return {
        "message": "PrepMate AI Backend is running!"
    }


@app.get("/api/health")
def health_check():
    return {
        "status": "success",
        "message": "Frontend can connect to PrepMate AI backend!",
        "ai": provider_status(),
    }