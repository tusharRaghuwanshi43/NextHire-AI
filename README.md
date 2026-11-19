# NextHire AI &mdash; Intelligent Technical Claim Verification Platform

[![Python 3.10](https://img.shields.io/badge/Python-3.10-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688.svg)](https://fastapi.tiangolo.com/)
[![MongoDB Atlas](https://img.shields.io/badge/MongoDB-Atlas_Async-47A248.svg)](https://www.mongodb.com/atlas)
[![Google Gemini](https://img.shields.io/badge/Google_Gemini-API_v1.0+-4285F4.svg)](https://ai.google.dev/)
[![React 18](https://img.shields.io/badge/React-18-61DAFB.svg)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC.svg)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

NextHire AI is an enterprise-grade AI-powered recruitment platform designed to solve the critical challenge in modern hiring: **verifying whether software engineering candidates can legitimately explain, justify, and defend the technical skills and high-impact project claims asserted on their resumes.**

---

## 1. System Architecture

```
                    ┌──────────────────────────────────────────┐
                    │               NextHire AI                │
                    │        React 18 + Tailwind CSS           │
                    │   (Vite, Recharts, Lucide, AuthContext)  │
                    └─────────────────────┬────────────────────┘
                                          │ REST / JSON (JWT Bearer)
                                          ▼
                    ┌──────────────────────────────────────────┐
                    │             FastAPI Backend              │
                    │         (Python 3.10, Motor Async)       │
                    └──────┬──────────────┬──────────────┬─────┘
                           │              │              │
                           ▼              ▼              ▼
     ┌───────────────────────┐  ┌──────────────────┐  ┌─────────────────────┐
     │     MongoDB Atlas     │  │  Google Gemini   │  │   NLP & Document    │
     │  (12 Async Mongo Cols)│  │   (google-genai) │  │  PyMuPDF & spaCy    │
     │  Users, Resumes,      │  │ Adaptive Q&A,    │  │  Regex taxonomy,    │
     │  Claims, Evaluations  │  │ Claim Audit,     │  │  ReportLab PDF Gen  │
     │  & Skill-Gap Roadmaps │  │ Gap Roadmaps     │  │                     │
     └───────────────────────┘  └──────────────────┘  └─────────────────────┘
```

---

## 2. Core Modules & Innovations

### A. Deep Resume Parsing & Claim Extraction

- Ingests `.pdf` and `.docx` resumes using PyMuPDF (`fitz`) and `python-docx`.
- Employs token classification and regular expression taxonomies to identify candidate contact info, categorized skills (Languages, Frontend, Backend, Databases, Cloud/DevOps, AI/ML), and projects.
- **Claim Extraction:** Automatically extracts high-stakes claims:
  - Metric claims (e.g. _"reduced API latency by 45%"_)
  - Architectural claims (e.g. _"architected microservices serving 250k daily active users"_)
  - Deployment & Scale claims (e.g. _"scaled distributed database queries with 99.9% uptime"_)

### B. Adaptive AI Interview Engine

- Generates **Basic**, **Intermediate**, and **Advanced** technical questions anchored directly to the candidate's verified skills and resume claims.
- **Dynamic Adaptability:** Questions adjust based on prior answers:
  - If a candidate demonstrates deep competency, follow-ups probe edge cases and distributed consistency trade-offs.
  - If a candidate provides a brief or general response, follow-ups provide a practical implementation problem.

### C. Deterministic 5-Dimension Weighted Scoring Formula

To maintain fairness and eliminate AI scoring hallucinations, the final score is calculated **deterministically** by backend code:

$$\text{Final Score} = (\text{Technical Accuracy} \times 0.40) + (\text{Technical Depth} \times 0.25) + (\text{Resume Consistency} \times 0.20) + (\text{Communication} \times 0.10) + (\text{Confidence} \times 0.05)$$

| Dimension              | Weight  | Description                                                      |
| ---------------------- | ------- | ---------------------------------------------------------------- |
| **Technical Accuracy** | **40%** | Conceptual correctness, algorithmic rigor, and runtime behavior  |
| **Technical Depth**    | **25%** | Internal mechanics, scalability trade-offs, and failure recovery |
| **Resume Consistency** | **20%** | Alignment between interview depth and stated resume seniority    |
| **Communication**      | **10%** | Structure, clarity, and conciseness                              |
| **Confidence**         | **5%**  | Decisiveness without evasiveness                                 |

### D. Evidence-Based Claim Verification (Not Lie Detection)

Cross-examines interview responses against resume claims to generate:

- **Verification Status:** `strongly_verified`, `partially_verified`, `questionable`, `contradicted`.
- **Confidence Score (0 - 100%)**
- **Supporting Evidence:** Exact points and tools cited by the candidate.
- **Contradictory Evidence:** Technical inconsistencies or missing telemetry.
- **Auditor Explanation:** Comprehensive qualitative assessment.

### E. Skill-Gap Analysis & 4-Week Learning Roadmap

- Identifies strong vs weak technical skills and misunderstood concepts.
- Generates a customized 4-week learning roadmap with weekly milestones, actionable items, and curated reference materials.

### F. Executive ReportLab PDF Dossiers

- Generates downloadable, multi-page PDF evaluation dossiers containing styled summary tables, weighted score breakdowns, claim audit logs, and learning roadmaps.

---

## 3. Tech Stack

- **Frontend:** React 18, Vite, Tailwind CSS, Recharts, Lucide React, HTML5 Audio Dictation Mode.
- **Backend:** Python 3.10, FastAPI, Uvicorn, Pydantic v2.
- **Database:** MongoDB Atlas with asynchronous PyMongo (`motor.motor_asyncio`) and resilient fallback simulation.
- **AI / LLM:** Google Gemini API via official `google-genai` SDK (`gemini-3.8-flash`).
- **Parsing & NLP:** PyMuPDF, python-docx, spaCy.
- **Security:** JWT authentication (`python-jose`), direct `bcrypt` password hashing, Role-Based Access Control (`candidate`, `recruiter`, `admin`).
- **PDF Generation:** ReportLab.
- **Deployment:** Vercel (Frontend), Render (Backend).

---

## 4. Repository Structure

```
.
├── backend/
│   ├── app/
│   │   ├── main.py                  # FastAPI entrypoint, CORS, lifespan
│   │   ├── core/
│   │   │   ├── config.py            # Pydantic BaseSettings & env parsing
│   │   │   └── security.py          # Direct bcrypt hashing & JWT tokens
│   │   ├── db/
│   │   │   └── mongodb.py           # Async Motor driver & Atlas fallback
│   │   ├── models/                  # Pydantic validation schemas
│   │   │   ├── user.py              # Candidate, Recruiter, Admin roles
│   │   │   ├── resume.py            # Extracted resume schemas
│   │   │   ├── claim.py             # Resume claims & verification
│   │   │   ├── interview.py         # Session management
│   │   │   ├── question.py          # Basic, Intermediate, Advanced
│   │   │   ├── answer.py            # Candidate responses & timing
│   │   │   ├── evaluation.py        # 5-dimension deterministic formulas
│   │   │   ├── skill_gap.py         # Strong/Weak skills & 4-week roadmap
│   │   │   └── report.py            # PDF metadata
│   │   ├── services/
│   │   │   ├── resume_parser.py     # PyMuPDF & docx extraction
│   │   │   ├── gemini_service.py    # Google GenAI client & fallbacks
│   │   │   ├── interview_engine.py  # Adaptive question progression
│   │   │   ├── evaluation_engine.py # Deterministic weighted calculations
│   │   │   └── pdf_report_generator.py # ReportLab PDF dossier generator
│   │   └── api/v1/                  # RESTful API routers
│   │       ├── auth.py
│   │       ├── resumes.py
│   │       ├── interviews.py
│   │       ├── evaluations.py
│   │       ├── recruiter.py
│   │       └── reports.py
│   ├── tests/                       # Pytest test suite (7/7 tests passing)
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── context/AuthContext.jsx  # JWT state & instant demo switchers
│   │   ├── services/api.js          # REST client with auth headers
│   │   ├── components/
│   │   │   ├── Navbar.jsx           # Role indicator & responsive nav
│   │   │   ├── Footer.jsx           # Tech stack pills
│   │   │   ├── MetricCard.jsx       # KPI cards
│   │   │   ├── ScoreBadge.jsx       # Color-coded score indicators
│   │   │   ├── ScoreRadarChart.jsx  # Recharts 5-dimension radar
│   │   │   ├── ClaimVerificationCard.jsx # Audited claims with evidence
│   │   │   └── RoadmapTimeline.jsx  # 4-week milestone visualizer
│   │   ├── pages/
│   │   │   ├── LandingPage.jsx      # High-conversion product showcase
│   │   │   ├── LoginPage.jsx        # Sign in with instant 1-click demos
│   │   │   ├── RegisterPage.jsx     # Role selection registration
│   │   │   ├── CandidateDashboard.jsx # Resume upload, interview room, results
│   │   │   ├── RecruiterDashboard.jsx # Candidate rankings, compare & analytics
│   │   │   └── AdminDashboard.jsx   # System status & user management
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── vercel.json
├── render.yaml                      # Render infrastructure blueprint
├── .env.example                     # Environment template
└── README.md
```

---

## 5. Getting Started & Local Execution

### Prerequisites

- Python 3.10+
- Node.js v18+ & npm
- (Optional) MongoDB Atlas Connection String
- (Optional) Google Gemini API Key

### Backend Setup

1. Navigate to the `backend` folder:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment (optional):
   ```bash
   python -m venv venv
   source venv/bin/activate   # Linux/Mac
   .\venv\Scripts\activate    # Windows
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Configure environment variables:
   ```bash
   cp .env.example .env
   ```
   _Update `MONGODB_URL` with your MongoDB Atlas URI and `GEMINI_API_KEY` with your Google Gemini key._
5. Run the backend development server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
   The backend API documentation is available at `http://localhost:8000/docs`.

### Frontend Setup

1. Open a new terminal and navigate to the `frontend` folder:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

---

## 6. Testing

Run the automated backend test suite covering password hashing, JWT flow, deterministic weighted scoring, ReportLab PDF generation, and resume parsing:

```bash
$env:PYTHONPATH="backend"
python -m pytest backend/tests -v
```

**Test Results:**

```
============================= test session starts =============================
backend/tests/test_auth.py::test_password_hashing PASSED                 [ 14%]
backend/tests/test_auth.py::test_jwt_token_flow PASSED                   [ 28%]
backend/tests/test_evaluation_engine.py::test_deterministic_weighted_scoring PASSED [ 42%]
backend/tests/test_pdf_report.py::test_pdf_report_generation PASSED      [ 57%]
backend/tests/test_resume_parser.py::test_resume_parser_contact_info PASSED [ 71%]
backend/tests/test_resume_parser.py::test_resume_parser_skills_extraction PASSED [ 85%]
backend/tests/test_resume_parser.py::test_resume_parser_claims_extraction PASSED [100%]
============================== 7 passed in 1.92s ==============================
```

Build the production frontend:

```bash
cd frontend
npm run build
```

---

## 7. Deployment Configuration

### Vercel (Frontend)

The frontend is pre-configured with `frontend/vercel.json` for seamless client-side single-page application routing and API proxying.

1. Connect your GitHub repository to Vercel.
2. Set Root Directory to `frontend`.
3. Set Framework to `Vite`.
4. Deploy with build command `npm run build` and output directory `dist`.

### Render (Backend)

The backend includes a declarative `render.yaml` blueprint:

1. Connect your repository on [Render](https://render.com/).
2. Select **New Web Service** and select the repository.
3. Set Root Directory to `backend`.
4. Build Command: `pip install -r requirements.txt`.
5. Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`.
6. Add Environment Variables:
   - `MONGODB_URL`: Your MongoDB Atlas cluster connection string.
   - `GEMINI_API_KEY`: Your Google Gemini API key.
   - `JWT_SECRET`: A secure random cryptographic key.
   - `CORS_ORIGINS`: Your Vercel frontend URL.

---

## 8. License

This project is licensed under the Apache-2.0 License.
