
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


Key Features
1. Student Profile
Students can maintain their personal, academic, technical, and career information.
The profile can contain:
- Name
- Email
- Phone
- Location
- College
- Degree
- Branch
- CGPA
- Technical Skills
- Soft Skills
- Interests
- Projects
- Experience
- Certifications
- Achievements
- Career Preferences
2. Resume Upload and Screening
Students can upload their resume in PDF format.
The Resume Screening Agent analyzes the uploaded resume and extracts relevant information such as:
- Candidate information
- Skills
- Education
- Experience
- Resume sections
- Resume score
- Career-related information
The extracted information is used by the other agents to generate personalized recommendations.
3. Career Domain Recommendation
The Career Agent analyzes the student's profile and resume to identify suitable career domains.
Possible domains may include:
- Software Development
- Data Analytics
- Data Science
- Artificial Intelligence
- UX/UI Design
- Digital Media
- Other relevant domains
The system is designed to analyze the student's actual evidence rather than depending only on fixed skill-to-domain mappings.
4. Job Matching
The Job Matching Agent recommends suitable job roles based on the student's:
- Skills
- Education
- Experience
- Projects
- Certifications
- Career domains
- Profile information
The system also considers the candidate's experience level when generating job recommendations.
5. Skill Gap Analysis
The Skill Gap Agent compares the student's current skills with the skills required for relevant target roles.
It identifies:
- Current skills
- Missing skills
- Skill priorities
- Target role
- Target domain
- Required skills
This helps students understand what they need to learn or improve.
6. Personalized Learning Roadmap
The Roadmap Agent generates a personalized learning and preparation roadmap based on the student's profile and identified skill gaps.
The roadmap may include:
- Weekly learning goals
- Skills to learn
- Projects to build
- Resume improvement activities
- Interview preparation
- Final preparation activities
Students can track their roadmap progress.
7. Resume Builder and Optimizer
The Resume module provides:
- Resume analysis
- Resume score
- Professional summary improvement
- Project description improvement
- Resume optimization suggestions
- Resume preview
- Candidate-specific resume information
The AI is instructed to preserve the candidate's actual information and avoid fabricating experience, projects, skills, achievements, or metrics.
8. Interview Preparation
The Interview Preparation Agent generates interview questions based on the student's profile and preparation requirements.
Questions may cover:
- Technical knowledge
- Domain knowledge
- Behavioral topics
- Communication
- Problem solving
- Role-specific topics
9. Mock Interview
Students can practice answering generated interview questions.
Their responses can then be evaluated to identify areas that need improvement.
10. Interview Evaluation
The Interview Evaluation Agent evaluates the student's interview responses.
Evaluation areas include:
- Technical knowledge
- Relevance
- Communication
- Clarity
- Overall performance
The evaluation provides scores and feedback to help students improve before actual interviews.
11. Placement Readiness Report
The Progress and Readiness module provides a consolidated view of the student's preparation.
It can use information from:
- Resume analysis
- Career recommendations
- Job matches
- Skill gaps
- Roadmap progress
- Interview performance
The final report provides an overall view of the student's current preparation status.
Multi-Agent Architecture
PrepMate AI follows a modular multi-agent architecture where different agents are responsible for different stages of the placement preparation workflow.
                    ┌─────────────────────┐
                    │  Student Profile /  │
                    │       Resume        │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │  Resume Screening   │
                    │       Agent         │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │ Career Recommendation│
                    │       Agent         │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │    Job Matching     │
                    │       Agent         │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │  Skill Gap Analysis │
                    │       Agent         │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │   Roadmap Agent     │
                    └──────────┬──────────┘
                               │
                 ┌─────────────┴─────────────┐
                 ▼                           ▼
       ┌─────────────────────┐     ┌─────────────────────┐
       │ Resume Optimization │     │ Interview Preparation│
       │       Agent         │     │       Agent          │
       └──────────┬──────────┘     └──────────┬──────────┘
                  │                           │
                  └─────────────┬─────────────┘
                                ▼
                    ┌─────────────────────┐
                    │ Interview Evaluation│
                    │       Agent         │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │ Placement Readiness │
                    │       Report        │
                    └─────────────────────┘

AI Architecture
PrepMate AI supports different AI providers for development and production.
Local Development
React Frontend
      ↓
FastAPI Backend
      ↓
AI Agents
      ↓
AI Service
      ↓
Ollama
      ↓
Llama 3.2 3B

Production
React Frontend
      ↓
FastAPI Backend
      ↓
AI Agents
      ↓
AI Service
      ↓
Gemini API
      ↓
Gemini Model

The AI service is provider-independent, allowing the application to use different AI providers without changing the overall agent architecture.
Technology Stack
Frontend
- React
- TypeScript
- Vite
- Tailwind CSS
- React Router
- Recharts
Backend
- Python
- FastAPI
- Uvicorn
- SQLAlchemy
- Pydantic
- PyMuPDF
Database
- PostgreSQL
- Supabase PostgreSQL for production
Artificial Intelligence
- Gemini API
- Ollama
- Llama 3.2 3B
Deployment
- Vercel — Frontend
- Render — Backend
- Supabase — Database
Project Architecture
                    ┌───────────────────┐
                    │      Student      │
                    └─────────┬─────────┘
                              │
                              ▼
                    ┌───────────────────┐
                    │ React + TypeScript│
                    │     Frontend      │
                    └─────────┬─────────┘
                              │ REST API
                              ▼
                    ┌───────────────────┐
                    │      FastAPI      │
                    │      Backend      │
                    └───────┬─────┬─────┘
                            │     │
                ┌───────────┘     └────────────┐
                ▼                              ▼
       ┌───────────────────┐          ┌───────────────────┐
       │    AI Agents      │          │    PostgreSQL     │
       │                   │          │     Database      │
       └─────────┬─────────┘          └───────────────────┘
                 │
                 ▼
       ┌───────────────────┐
       │     AI Service    │
       └─────────┬─────────┘
                 │
          ┌──────┴───────┐
          ▼              ▼
      Ollama          Gemini API

Project Structure
PrepMate-AI/
│
├── backend/
│   ├── agents/
│   │   ├── career_agent.py
│   │   ├── evaluation_agent.py
│   │   ├── interview_agent.py
│   │   ├── job_agent.py
│   │   ├── resume_agent.py
│   │   ├── resume_ai.py
│   │   ├── resume_optimizer_agent.py
│   │   ├── resume_rewrite_agent.py
│   │   ├── roadmap_agent.py
│   │   └── skill_gap_agent.py
│   │
│   ├── api/
│   │   ├── auth.py
│   │   ├── interview.py
│   │   ├── resume.py
│   │   ├── roadmap.py
│   │   └── students.py
│   │
│   ├── database/
│   │   ├── connection.py
│   │   └── models.py
│   │
│   ├── schemas/
│   │   ├── auth.py
│   │   └── student.py
│   │
│   ├── services/
│   │   └── ai_service.py
│   │
│   ├── main.py
│   ├── requirements.txt
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── data/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── types/
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── styles.css
│   │
│   ├── public/
│   ├── package.json
│   ├── package-lock.json
│   ├── vite.config.ts
│   └── .env.example
│
└── README.md

Main Backend Modules
Agents
The agents directory contains the intelligent modules responsible for the major placement preparation tasks.
career_agent.py

Responsible for career domain recommendations.
job_agent.py

Responsible for job role matching.
skill_gap_agent.py

Responsible for identifying missing and required skills.
roadmap_agent.py

Responsible for generating personalized learning roadmaps.
resume_agent.py

Responsible for resume analysis.
resume_optimizer_agent.py

Responsible for resume improvement suggestions.
resume_rewrite_agent.py

Responsible for improving resume summaries and related content.
interview_agent.py

Responsible for generating interview questions.
evaluation_agent.py

Responsible for evaluating interview responses.
Backend API Modules
The backend API layer handles communication between the frontend and the agents/database.
api/auth.py

Handles registration and login.
api/students.py

Handles student profile information.
api/resume.py

Handles resume upload, analysis, optimization, and summary improvement.
api/roadmap.py

Handles roadmap progress.
api/interview.py

Handles interview generation and evaluation.
Database
PostgreSQL is used for storing application data.
The database is responsible for storing information such as:
- Student profiles
- Resume analyses
- Career analyses
- Job matching results
- Skill gap information
- Roadmap information
- Roadmap progress
- Interview-related information
Supabase PostgreSQL is used for the deployed production environment.
Local Installation and Setup
Prerequisites
Install the following software before running the project:
- Git
- Python 3.13
- Node.js
- PostgreSQL
- Ollama
1. Clone the Repository
git clone YOUR_GITHUB_REPOSITORY_LINK
cd PrepMate-AI

Backend Setup
2. Open the Backend
cd backend

3. Create a Python Virtual Environment
python -m venv venv

4. Activate the Virtual Environment
Windows
venv\Scripts\activate

5. Install Backend Dependencies
pip install -r requirements.txt

Database Setup
6. Create a PostgreSQL Database
Create a local PostgreSQL database named:
prepmate_ai

Use your own PostgreSQL username and password.
Backend Environment Configuration
7. Create the Backend .env
Inside:
backend/

create:
.env

Add:
DB_USER=postgres
DB_PASSWORD=YOUR_POSTGRES_PASSWORD
DB_HOST=127.0.0.1
DB_PORT=5432
DB_NAME=prepmate_ai

AI_ENABLED=true
AI_PROVIDER=ollama
OLLAMA_URL=http://127.0.0.1:11434/api/generate
OLLAMA_MODEL=llama3.2:3b
AI_TIMEOUT_SECONDS=90

Replace:
YOUR_POSTGRES_PASSWORD

with the PostgreSQL password configured on the local machine.
Local AI Setup
8. Install the Ollama Model
Run:
ollama pull llama3.2:3b

9. Start Ollama
ollama serve

Keep Ollama running while using the application.
Start the Backend
10. Run FastAPI
From the backend directory:
python -m uvicorn main:app --reload

The backend will normally be available at:
http://127.0.0.1:8000

Keep the backend terminal running.
Frontend Setup
11. Open a New Terminal
Go to the frontend directory:
cd PrepMate-AI/frontend

12. Install Frontend Dependencies
npm install

13. Create Frontend .env
Inside:
frontend/

create:
.env

Add:
VITE_API_BASE_URL=http://127.0.0.1:8000

Start the Frontend
14. Run the Frontend
npm run dev

The frontend will normally be available at:
http://localhost:5173

Open the URL in a browser.
Complete Local Running Setup
Three processes should be running during local development.
Terminal 1 — Ollama
ollama serve

Terminal 2 — Backend
cd PrepMate-AI/backend
venv\Scripts\activate
python -m uvicorn main:app --reload

Terminal 3 — Frontend
cd PrepMate-AI/frontend
npm run dev

Then open:
http://localhost:5173

Environment Variables
Real credentials must never be committed to GitHub.
Backend .env
DB_USER=
DB_PASSWORD=
DB_HOST=
DB_PORT=
DB_NAME=

AI_ENABLED=
AI_PROVIDER=

OLLAMA_URL=
OLLAMA_MODEL=

GEMINI_API_KEY=
GEMINI_MODEL=

AI_TIMEOUT_SECONDS=

Frontend .env
VITE_API_BASE_URL=

The .env.example files can be used as templates for creating local environment files.
Security
Sensitive information must be stored using environment variables.
Do not commit:
.env

or any file containing:
- API keys
- Database passwords
- Production credentials
- Authentication secrets
The following local/generated folders should also not be committed:
venv/
node_modules/
dist/
__pycache__/

Each developer should use their own local database credentials and local AI configuration.
Production Deployment
The production system uses the following architecture:
Browser
   │
   ▼
Vercel
React + TypeScript Frontend
   │
   ▼
Render
FastAPI Backend
   │
   ├───────────────┐
   ▼               ▼
Supabase        Gemini API
PostgreSQL      AI Services

Production Components
Component	Technology
Frontend	React + TypeScript + Vite
Backend	FastAPI
Database	Supabase PostgreSQL
AI	Gemini API
Frontend Hosting	Vercel
Backend Hosting	Render


Production Environment
The production backend uses environment variables for:
- Database connection
- AI provider configuration
- Gemini API configuration
- AI timeout settings
Production secrets are not stored in the GitHub repository.
The frontend uses the production backend URL through:
VITE_API_BASE_URL

Development vs Production
Local Development
Frontend
   ↓
Local FastAPI
   ↓
Local PostgreSQL
   ↓
Ollama
   ↓
Llama 3.2 3B

Production
Vercel Frontend
   ↓
Render FastAPI
   ↓
Supabase PostgreSQL
   ↓
Gemini API

This allows developers to work locally without requiring access to production credentials.
AI Design Principles
PrepMate AI is designed around the following principles:
Personalized Intelligence
Recommendations should depend on the individual student's profile and resume.
Evidence-Based Recommendations
The system should use information actually available in the student's profile rather than inventing experience or skills.
No Fabricated Information
The AI should not create:
- Fake projects
- Fake work experience
- Fake certifications
- Fake achievements
- Fake skills
- Fake performance metrics
Experience-Aware Recommendations
Job recommendations should consider the candidate's actual experience level.
Modular Agents
Each major placement preparation task is implemented as a separate agent so that individual modules can be improved independently.
Provider Independence
The AI service supports different AI providers, allowing local development with Ollama and production deployment with Gemini.
Project Goals
The primary goals of PrepMate AI are:
1. Provide personalized career guidance.
2. Analyze student resumes.
3. Recommend suitable career domains.
4. Identify relevant job roles.
5. Detect skill gaps.
6. Generate personalized learning roadmaps.
7. Improve resume quality.
8. Generate role-specific interview questions.
9. Evaluate mock interview performance.
10. Track placement preparation progress.
11. Provide an overall placement readiness view.
12. Reduce the need for students to use multiple disconnected placement preparation tools.
Advantages
PrepMate AI provides several advantages:
- Personalized instead of generic recommendations
- Modular multi-agent architecture
- Resume-driven analysis
- Career-domain recommendations
- Experience-aware job matching
- Personalized skill-gap analysis
- Personalized learning roadmap
- AI-assisted resume improvement
- AI-generated interview preparation
- Interview evaluation
- Progress tracking
- Centralized placement preparation workflow
- Local AI support for development
- Production AI support for deployment
Future Enhancements
Possible future improvements include:
- Real-time job market integration
- Integration with multiple job portals
- Real-time industry skill trend analysis
- Company-specific preparation
- Company-specific interview preparation
- Advanced resume parsing
- Voice-based mock interviews
- Video interview analysis
- Facial expression and communication analysis
- Automated job application assistance
- Advanced candidate ranking
- Personalized course recommendations
- Placement statistics and analytics
- More AI model/provider integrations
- LangGraph-based agent orchestration
- Improved long-term student progress tracking
Project Scope
PrepMate AI focuses on the complete placement preparation lifecycle:
Profile
   ↓
Resume
   ↓
Career
   ↓
Jobs
   ↓
Skill Gap
   ↓
Roadmap
   ↓
Resume Optimization
   ↓
Interview
   ↓
Evaluation
   ↓
Readiness

The system is designed to help students move from understanding their current profile to preparing for specific career opportunities.
Development Approach
PrepMate AI follows a modular full-stack architecture.
The frontend is responsible for:
- User interface
- Navigation
- Student interaction
- Visualization
- Resume upload
- Roadmap progress
- Interview interaction
- Readiness display
The backend is responsible for:
- API handling
- Authentication
- Database operations
- Resume processing
- Agent execution
- AI communication
- Analysis storage
- Roadmap progress
- Interview evaluation
The AI layer is responsible for:
- Career reasoning
- Job matching
- Skill-gap analysis
- Roadmap generation
- Resume improvement
- Interview question generation
- Interview evaluation
Project Workflow
A typical student workflow is:
1. Register / Login
        ↓
2. Complete Profile
        ↓
3. Upload Resume
        ↓
4. Resume Analysis
        ↓
5. Career Domain Recommendation
        ↓
6. Job Matching
        ↓
7. Skill Gap Analysis
        ↓
8. Personalized Roadmap
        ↓
9. Resume Optimization
        ↓
10. Interview Preparation
        ↓
11. Mock Interview
        ↓
12. Interview Evaluation
        ↓
13. Track Progress
        ↓
14. View Placement Readiness Report

Repository Guidelines
When contributing or making changes:
1. Do not commit .env files.
2. Do not commit API keys.
3. Do not commit database passwords.
4. Do not commit node_modules.
5. Do not commit Python virtual environments.
6. Keep frontend and backend responsibilities separate.
7. Preserve the modular agent architecture.
8. Avoid hardcoded student-specific recommendations.
9. Do not fabricate candidate information.
10. Test changes locally before pushing them.
Troubleshooting
Backend does not start
Check that:
- Python is installed.
- The virtual environment is activated.
- Dependencies were installed.
- PostgreSQL is running.
- The .env file exists.
- Database credentials are correct.
Run:
python -m uvicorn main:app --reload

Frontend does not start
Check that:
- Node.js is installed.
- npm install was executed.
- frontend/.env exists.
- VITE_API_BASE_URL points to the running backend.
Run:
npm install
npm run dev

AI is not responding locally
Check that Ollama is running:
ollama serve

Check that the model is installed:
ollama list

If necessary:
ollama pull llama3.2:3b

Database connection problems
Check the backend .env values:
DB_USER=
DB_PASSWORD=
DB_HOST=
DB_PORT=
DB_NAME=

Make sure PostgreSQL is running and that the database exists.
Disclaimer
PrepMate AI provides AI-generated career guidance, job recommendations, skill-gap analysis, learning roadmaps, resume suggestions, interview preparation, and placement-readiness insights.
The recommendations, scores, and evaluations generated by the system are intended to support student preparation and should not be considered guarantees of employment, placement, interview selection, or career outcomes.
Students should use the recommendations as guidance and make their own informed decisions.
License
This project is developed for academic and educational purposes.
```






    








give me in a single copy paste file





 






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

9. Project Structure
PrepMate-AI/
│
├── backend/
│   ├── agents/
│   │   ├── career_agent.py
│   │   ├── evaluation_agent.py
│   │   ├── interview_agent.py
│   │   ├── job_agent.py
│   │   ├── resume_agent.py
│   │   ├── resume_ai.py
│   │   ├── resume_optimizer_agent.py
│   │   ├── resume_rewrite_agent.py
│   │   ├── roadmap_agent.py
│   │   └── skill_gap_agent.py
│   │
│   ├── api/
│   │   ├── auth.py
│   │   ├── interview.py
│   │   ├── resume.py
│   │   ├── roadmap.py
│   │   └── students.py
│   │
│   ├── database/
│   │   ├── __init__.py
│   │   ├── connection.py
│   │   └── models.py
│   │
│   ├── schemas/
│   │   ├── auth.py
│   │   └── student.py
│   │
│   ├── services/
│   │   ├── __init__.py
│   │   └── ai_service.py
│   │
│   ├── .env
│   ├── .env.example
│   ├── main.py
│   ├── requirements.txt
│   └── services_ai.cmd
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── data/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── types/
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── styles.css
│   │
│   ├── public/
│   │   └── assets/
│   │
│   ├── .env.example
│   ├── index.html
│   ├── package.json
│   ├── package-lock.json
│   ├── tsconfig.json
│   └── vite.config.ts
│
└── README.md

10. Backend Agents
career_agent.py
Responsible for recommending suitable career domains based on the candidate profile and resume.
job_agent.py
Responsible for recommending appropriate job roles.
The agent considers:
- Skills
- Projects
- Education
- Experience
- Certifications
- Achievements
- Career domains
- Experience level
The system should not recommend a junior role simply because the candidate has matching skills.
skill_gap_agent.py
Identifies:
- Current skills
- Missing skills
- Skills required for relevant roles
- Personalized skill gaps
Skill aliases and equivalent technologies are handled to reduce incorrect missing-skill detection.
roadmap_agent.py
Creates a personalized learning roadmap based on:
- Career direction
- Target role
- Skill gaps
- Candidate profile
resume_agent.py
Performs resume screening and extracts useful information.
resume_optimizer_agent.py
Analyzes resume quality and provides personalized optimization suggestions.
resume_rewrite_agent.py
Improves resume summary content while preserving the candidate's actual:
- Career level
- Skills
- Experience
- Background
The agent should never fabricate information.
interview_agent.py
Generates interview questions based on the candidate's profile and target direction.
evaluation_agent.py
Evaluates interview responses and provides performance feedback.

11. Backend API Modules
Authentication
/api/auth

Handles:
- Registration
- Login
Students
/api/students

Handles:
- Student profile
- Profile retrieval
- Profile updates
Resume
/api/resume

Handles:
- Resume upload
- Resume analysis
- Resume optimization
- Summary rewriting
Roadmap
/api/roadmap

Handles:
- Roadmap progress
- Progress updates
Interview
/api/interview

Handles:
- Interview generation
- Interview evaluation

12. Database
PostgreSQL is used as the main relational database.
The system stores student information and analysis-related data.
Important entities include:
Students
Stores student profile information such as:
- Name
- Email
- College
- Branch
- CGPA
- Phone
- Location
- Degree
- Skills
- Soft skills
- Interests
Resume Analysis
Stores information related to:
- Resume file
- Candidate information
- Resume score
- Word count
- Skills
- Education
- Detected sections
- Career analysis
- Job analysis
- Skill-gap analysis
- Roadmap analysis
Roadmap Progress
Stores weekly roadmap completion information.

13. Local Installation
Prerequisites
Install the following:
- Git
- Python 3.13
- Node.js
- PostgreSQL
- Ollama
Check installations:
git --version
python --version
node --version
npm --version
psql --version
ollama version

14. Clone the Repository
git clone https://github.com/VegiHarshitha58/PrepMate-AI.git
cd PrepMate-AI

15. Backend Setup
Go to the backend folder:
cd backend

Create a virtual environment:
python -m venv venv

Activate it on Windows:
venv\Scripts\activate

Install dependencies:
pip install -r requirements.txt

16. Database Setup
Create a PostgreSQL database named:
prepmate_ai

Example local database configuration:
DB_USER=postgres
DB_PASSWORD=YOUR_POSTGRES_PASSWORD
DB_HOST=127.0.0.1
DB_PORT=5432
DB_NAME=prepmate_ai

17. Backend Environment Variables
Create:
backend/.env

Add:
DB_USER=postgres
DB_PASSWORD=YOUR_POSTGRES_PASSWORD
DB_HOST=127.0.0.1
DB_PORT=5432
DB_NAME=prepmate_ai

AI_ENABLED=true
AI_PROVIDER=ollama

OLLAMA_URL=http://127.0.0.1:11434/api/generate
OLLAMA_MODEL=llama3.2:3b

AI_TIMEOUT_SECONDS=90

Replace:
YOUR_POSTGRES_PASSWORD

with your local PostgreSQL password.

18. Local AI Setup
Install Ollama.
Then download the model:
ollama pull llama3.2:3b

Start Ollama:
ollama serve

Keep Ollama running while using the application locally.

19. Start Backend
From the backend folder:
venv\Scripts\activate
python -m uvicorn main:app --reload

Backend will run at:
http://127.0.0.1:8000

API documentation:
http://127.0.0.1:8000/docs

20. Frontend Setup
Open another terminal.
Go to the frontend:
cd PrepMate-AI\frontend

Install dependencies:
npm install

Create:
frontend/.env

Add:
VITE_API_BASE_URL=http://127.0.0.1:8000

21. Start Frontend
Run:
npm run dev

Open:
http://localhost:5173

22. Complete Local Running Setup
Three terminals are recommended.
Terminal 1 - Backend
cd PrepMate-AI\backend
venv\Scripts\activate
python -m uvicorn main:app --reload

Terminal 2 - Ollama
ollama serve

Terminal 3 - Frontend
cd PrepMate-AI\frontend
npm run dev

Then open:
http://localhost:5173

23. Environment Variables
Backend
DB_USER=
DB_PASSWORD=
DB_HOST=
DB_PORT=
DB_NAME=

AI_ENABLED=true
AI_PROVIDER=ollama

OLLAMA_URL=http://127.0.0.1:11434/api/generate
OLLAMA_MODEL=llama3.2:3b

AI_TIMEOUT_SECONDS=90

For production:
AI_ENABLED=true
AI_PROVIDER=gemini
GEMINI_API_KEY=YOUR_GEMINI_API_KEY
GEMINI_MODEL=gemini-2.5-flash-lite
AI_TIMEOUT_SECONDS=90

Frontend
VITE_API_BASE_URL=http://127.0.0.1:8000

For production, this points to the deployed backend.

24. Security
Never commit real credentials to GitHub.
The following files should remain local/private:
backend/.env
frontend/.env

The repository uses .gitignore rules for environment files and local development artifacts.
Do not upload:
.env
API keys
Database passwords
Private credentials
backend/venv/
frontend/node_modules/
__pycache__/
dist/

Use .env.example files with placeholders for configuration documentation.

25. Production Deployment
The production architecture is:
User
 ↓
Vercel
React Frontend
 ↓
Render
FastAPI Backend
 ↓
Supabase PostgreSQL
 ↓
AI Provider
Gemini

Frontend
The React/Vite frontend is deployed using Vercel.
Production environment variable:
VITE_API_BASE_URL=<Render Backend URL>

Backend
The FastAPI backend is deployed using Render.
Typical Render start command:
uvicorn main:app --host 0.0.0.0 --port $PORT

Backend production environment variables include:
DB_USER
DB_PASSWORD
DB_HOST
DB_PORT
DB_NAME

AI_ENABLED
AI_PROVIDER
GEMINI_API_KEY
GEMINI_MODEL
AI_TIMEOUT_SECONDS

Database
Production PostgreSQL is hosted using Supabase.
The database credentials are stored in the deployment platform's environment variables and are not included in the frontend source code.

26. Production Architecture
                     Internet User
                          │
                          ▼
                 ┌──────────────────┐
                 │      Vercel      │
                 │ React Frontend   │
                 └────────┬─────────┘
                          │
                          ▼
                 ┌──────────────────┐
                 │      Render      │
                 │  FastAPI Backend │
                 └───────┬───┬──────┘
                         │   │
              ┌──────────┘   └───────────┐
              ▼                          ▼
      ┌────────────────┐        ┌────────────────┐
      │    Supabase    │        │     Gemini     │
      │   PostgreSQL   │        │   AI Provider  │
      └────────────────┘        └────────────────┘

27. AI Design Principles
PrepMate AI follows these principles:
1. Personalization
Recommendations should be based on the actual student.
2. No Fabrication
The system should not invent:
- Skills
- Projects
- Certifications
- Experience
- Achievements
- Metrics
3. Experience Awareness
The system should understand that candidates can have different experience levels.
A student/fresher can receive entry-level roles, while a candidate with substantial experience can receive mid-level or senior recommendations when supported by their profile.
4. Dynamic Recommendations
The system should avoid rigid mappings and allow AI to identify relevant skills and roles.
5. Provider Independence
The AI layer can support different AI providers instead of permanently depending on one paid API.
6. Graceful Fallback
When AI is unavailable, deterministic fallback logic can be used to keep the application functional during development.
The fallback logic is not intended to replace the final AI intelligence layer.

28. Current Development AI vs Production AI
During development, local Ollama can be used to avoid depending on paid API credits.
Production can use Gemini through environment-based configuration.
The system therefore supports:
Local Development
       ↓
Ollama
       ↓
Local AI inference

and:
Production
       ↓
Gemini API
       ↓
Cloud AI inference

29. Project Goals
The main goals of PrepMate AI are:
- Help students understand their career direction.
- Analyze resumes automatically.
- Identify suitable job roles.
- Find genuine skill gaps.
- Generate personalized learning roadmaps.
- Improve resume quality.
- Prepare students for interviews.
- Evaluate interview performance.
- Track placement preparation.
- Provide an overall placement-readiness view.
The long-term goal is to create a personalized AI placement assistant rather than a simple rule-based recommendation system.

30. Advantages
Personalized
Different students can receive different recommendations.
Multi-Agent
Different tasks are handled by specialized agents.
Modular
Agents and services can be improved independently.
Extensible
New agents, AI providers, career domains, and features can be added later.
Practical
The system covers multiple stages of placement preparation.
AI-Driven
The architecture supports actual AI-generated reasoning and recommendations.
Local Development Support
Ollama enables development without requiring a paid AI API.

31. Future Enhancements
Possible future improvements include:
- LangGraph-based agent orchestration.
- Real-time job market integration.
- Live job listing analysis.
- Industry trend analysis.
- Better resume parsing.
- Advanced interview simulation.
- Voice-based mock interviews.
- Behavioral interview evaluation.
- Coding interview evaluation.
- Job application tracking.
- Company-specific preparation.
- More advanced placement-readiness scoring.
- Continuous learning recommendations.
- More AI model/provider integrations.
- Improved recommendation evaluation.
- Analytics dashboard for students and placement teams.

32. Project Scope
PrepMate AI covers:
Profile
   ↓
Resume
   ↓
Career
   ↓
Jobs
   ↓
Skills
   ↓
Roadmap
   ↓
Resume Improvement
   ↓
Interview
   ↓
Evaluation
   ↓
Placement Readiness

This makes the system an end-to-end placement preparation assistant.

33. Development Approach
The project follows a modular development approach.
Frontend
Responsible for:
- User interface
- Navigation
- Forms
- Resume interaction
- Dashboard
- Roadmap
- Interview screens
- Progress visualization
Backend
Responsible for:
- API endpoints
- Authentication
- Resume processing
- Agent execution
- Database operations
- AI integration
AI Layer
Responsible for:
- Reasoning
- Recommendations
- Personalization
- Content generation
- Evaluation
Database
Responsible for:
- Persistent student data
- Resume analysis
- Roadmap progress
- Application data

34. Typical User Workflow
1. Student registers.

2. Student logs in.

3. Student completes profile.

4. Student uploads resume.

5. Resume Screening Agent analyzes resume.

6. Career Agent recommends career domains.

7. Job Agent recommends suitable roles.

8. Skill Gap Agent identifies missing skills.

9. Roadmap Agent creates a learning plan.

10. Student improves resume using the Resume Builder/Optimizer.

11. Interview Agent generates interview questions.

12. Student attempts a mock interview.

13. Evaluation Agent evaluates responses.

14. System provides feedback and placement-readiness information.

15. Student continues improving based on recommendations.

35. Repository Guidelines
Before pushing code:
git status

Review changed files.
Do not commit:
.env
venv/
node_modules/
dist/
__pycache__/

Then:
git add .
git commit -m "Describe your changes"
git push origin main

36. Troubleshooting
Backend does not start
Check Python:
python --version

Activate the virtual environment:
venv\Scripts\activate

Install dependencies:
pip install -r requirements.txt

Frontend does not start
Check Node:
node --version

Install dependencies:
npm install

Then:
npm run dev

Ollama is not responding
Start Ollama:
ollama serve

Check that the model exists:
ollama list

If required:
ollama pull llama3.2:3b

Frontend cannot connect to backend
Check:
frontend/.env

It should contain:
VITE_API_BASE_URL=http://127.0.0.1:8000

Restart the Vite development server after changing environment variables.
Database connection error
Verify:
DB_USER
DB_PASSWORD
DB_HOST
DB_PORT
DB_NAME

Also verify that PostgreSQL is running.
AI generation fails
Check:
AI_ENABLED=true

For Ollama:
AI_PROVIDER=ollama

For Gemini:
AI_PROVIDER=gemini
GEMINI_API_KEY=<valid key>
GEMINI_MODEL=gemini-2.5-flash-lite

Never expose API keys in source code or GitHub.

37. Production Status
The intended production architecture is:
GitHub
   ↓
Vercel
   ↓
React Frontend

GitHub
   ↓
Render
   ↓
FastAPI Backend
   ↓
Supabase PostgreSQL
   ↓
Gemini AI

The frontend communicates with the deployed backend using:
VITE_API_BASE_URL

The backend communicates with PostgreSQL and the configured AI provider using server-side environment variables.

38. Important Security Note
API keys and database passwords must always remain server-side.
Never place:
GEMINI_API_KEY
DB_PASSWORD

inside:
frontend/

or expose them through frontend JavaScript.
Only public configuration such as:
VITE_API_BASE_URL

should be provided to the frontend.

39. Contribution
The project is structured so that individual modules can be extended independently.
Possible contribution areas include:
- New AI agents
- New career domains
- New recommendation logic
- New interview modules
- New analytics
- UI improvements
- Database improvements
- AI provider integrations
- Testing and evaluation

40. License
This project is developed as an academic/educational project.
If this project is reused or extended, appropriate credit should be given to the original project author.

41. Disclaimer
PrepMate AI provides AI-assisted career and placement preparation recommendations.
The recommendations are intended to support students during preparation and should not be considered guaranteed predictions of employment, job selection, interview success, or placement outcomes.
Students should independently verify job requirements, skill requirements, company information, and other career-related information before making important decisions.
```
