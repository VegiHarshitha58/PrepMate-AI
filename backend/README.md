# PrepMate AI Backend

FastAPI backend for PrepMate AI.

## Requirements
- Python 3.11+ / 3.12+ / 3.13
- PostgreSQL
- Ollama with the `llama3.2:3b` model

## Setup

```cmd
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

Create `.env` from `.env.example` and add your PostgreSQL settings.

Start Ollama:

```cmd
ollama serve
```

Start the backend:

```cmd
python -m uvicorn main:app --reload
```

Backend: `http://127.0.0.1:8000`
Health: `http://127.0.0.1:8000/api/health`
