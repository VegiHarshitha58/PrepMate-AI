
PREPMATE AI
AI-Powered Multi-Agent Placement Assistant
================================================

## 1. Overview

PrepMate AI is an AI-powered multi-agent placement assistant designed to help students understand their career readiness and prepare for placements through a personalized, end-to-end workflow.

The system analyzes a student's profile and resume, identifies suitable career domains and job roles, detects skill gaps, generates a personalized learning roadmap, improves resume content, prepares interview questions, evaluates interview performance, and provides an overall placement-readiness report.

The system is designed around the principle:

"Code provides the framework; AI provides the intelligence."

The recommendations are intended to be personalized to the individual student's actual profile, resume, skills, education, experience, projects, certifications, and career interests.

---

## 2. Core Workflow

Student Profile / Resume
        ↓
Resume Screening Agent
        ↓
Career Domain Recommendation
        ↓
Job Matching
        ↓
Skill Gap Analysis
        ↓
Personalized Learning Roadmap
        ↓
Resume Builder / Optimizer
        ↓
Interview Preparation
        ↓
Mock Interview
        ↓
Interview Evaluation
        ↓
Placement Readiness
        ↓
Final Report


---

## 3. Key Features

### Resume Screening
- Upload and analyze a resume.
- Extract candidate information.
- Detect skills and education.
- Detect resume sections.
- Calculate a resume score.
- Identify areas for improvement.

### Career Domain Recommendation
- Analyze the student's profile and resume.
- Recommend suitable career domains.
- Provide relevance/match scores.
- Support multiple possible career directions.

### Job Matching
- Recommend suitable job roles based on the candidate's profile.
- Consider skills, education, experience, projects, certifications, and career direction.
- Avoid assuming every candidate is entry-level.
- Provide multiple relevant job-role recommendations.

### Skill Gap Analysis
- Compare current skills with skills relevant to recommended roles.
- Identify missing skills.
- Identify current skills.
- Avoid incorrectly treating equivalent skills as missing.
- Provide personalized skill-gap information.

### Personalized Roadmap
- Generate a week-by-week learning roadmap.
- Focus on the student's actual gaps and target roles.
- Provide actionable learning goals.
- Track roadmap progress.

### Resume Builder
- Generate/edit professional summary content.
- Provide project descriptions.
- Display a live resume preview.
- Use the student's actual information.
- Avoid fabricating experience, projects, skills, or achievements.

### Resume Optimization
- Analyze resume quality.
- Provide personalized suggestions.
- Identify detected skills and sections.
- Improve resume content without inventing information.
- Consider the candidate's actual career level.

### Interview Preparation
- Generate interview questions based on:
  - Candidate skills
  - Career domain
  - Target roles
  - Resume
  - Experience level
- Support different difficulty levels and interview types.

### Mock Interview
- Present generated interview questions.
- Allow the student to answer questions.
- Evaluate the submitted responses.

### Interview Evaluation
- Evaluate interview performance.
- Provide scores and feedback.
- Analyze areas such as:
  - Technical knowledge
  - Relevance
  - Communication
  - Overall performance

### Placement Readiness
- Combine information from different stages.
- Provide an overall view of placement preparation.
- Help students understand what they should improve next.

---

## 4. Multi-Agent Architecture

PrepMate AI follows a multi-agent architecture.

### Agents

1. Resume Screening Agent
2. Career Recommendation Agent
3. Job Matching Agent
4. Skill Gap Analysis Agent
5. Roadmap Agent
6. Resume Optimizer Agent
7. Resume Rewrite Agent
8. Interview Preparation Agent
9. Evaluation Agent

The agents work as specialized components rather than placing all intelligence inside a single module.

The overall system can be extended with an orchestration layer such as LangGraph in future versions.

---

## 5. AI Architecture

The intended AI pipeline is:

Student Profile
        +
Resume
        +
Relevant Career / Job Information
        ↓
AI Intelligence Layer
        ↓
Career Recommendation
        ↓
Job Matching
        ↓
Skill Gap Analysis
        ↓
Learning Roadmap
        ↓
Interview Preparation
        ↓
Interview Evaluation
        ↓
Placement Readiness


### AI Design Principle

The system should not depend on hardcoded mappings such as:

"Web Development = HTML + CSS + JavaScript"

Instead, AI should analyze the actual candidate information and determine appropriate recommendations.

For example, two students with different profiles should be able to receive different:

- Career domains
- Job roles
- Skill gaps
- Learning roadmaps
- Interview questions
- Resume recommendations

The architecture is also designed to support emerging technologies and roles without requiring every new role or skill to be manually hardcoded.

---

## 6. AI Providers

PrepMate AI supports provider-independent AI integration.

### Local AI

Ollama can be used for local development.

Default local model:

llama3.2:3b

Local configuration:

AI_ENABLED=true
AI_PROVIDER=ollama
OLLAMA_URL=http://127.0.0.1:11434/api/generate
OLLAMA_MODEL=llama3.2:3b
AI_TIMEOUT_SECONDS=90


### Production AI

Gemini can be used for production deployment.

Production configuration:

AI_ENABLED=true
AI_PROVIDER=gemini
GEMINI_API_KEY=your_api_key
GEMINI_MODEL=gemini-2.5-flash-lite
AI_TIMEOUT_SECONDS=90

API keys must never be committed to GitHub.


---

## 7. Technology Stack

### Frontend

- React
- TypeScript
- Vite
- React Router
- Recharts
- CSS

### Backend

- Python
- FastAPI
- SQLAlchemy
- Pydantic
- Uvicorn

### Database

- PostgreSQL
- Supabase PostgreSQL for production

### AI

- Ollama for local development
- Gemini API for production

### Resume Processing

- PDF text extraction
- Resume analysis agents

### Deployment

- Vercel - Frontend
- Render - Backend
- Supabase - PostgreSQL database


---

## 8. Project Architecture

```text
                    ┌─────────────────────┐
                    │    React Frontend   │
                    │  TypeScript + Vite  │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │      FastAPI        │
                    │      Backend        │
                    └──────────┬──────────┘
                               │
             ┌─────────────────┼─────────────────┐
             │                 │                 │
             ▼                 ▼                 ▼
      ┌────────────┐    ┌────────────┐    ┌────────────┐
      │   Resume   │    │   Career   │    │    Job     │
      │   Agent    │    │   Agent    │    │   Agent    │
      └────────────┘    └────────────┘    └────────────┘
             │                 │                 │
             └─────────────────┼─────────────────┘
                               ▼
                    ┌─────────────────────┐
                    │   Skill Gap Agent   │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │    Roadmap Agent    │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │ Interview +         │
                    │ Evaluation Agents   │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │   PostgreSQL DB     │
                    └─────────────────────┘
