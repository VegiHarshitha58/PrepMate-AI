from fastapi import FastAPI

from fastapi.middleware.cors import CORSMiddleware
from api.students import router as student_router
from api.resume import router as resume_router
app = FastAPI(title="PrepMate AI Backend")


# Allow our React frontend to communicate with the backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(student_router)
app.include_router(resume_router)
@app.get("/")
def home():
    return {
        "message": "PrepMate AI Backend is running!"
    }


@app.get("/api/health")
def health_check():
    return {
        "status": "success",
        "message": "Frontend can connect to PrepMate AI backend!"
    }