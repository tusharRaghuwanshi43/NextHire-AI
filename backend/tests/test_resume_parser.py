from app.services.resume_parser import ResumeParserService

SAMPLE_RESUME_TEXT = """
Alex Chen
Full Stack Engineer
alex.chen@example.com | +1 (555) 234-5678 | San Francisco, CA
https://linkedin.com/in/alexchen-dev | https://github.com/alexchen-dev

SUMMARY
Passionate engineer with 4 years of experience building high-performance web applications, microservices, and AI integrations.

EXPERIENCE
Senior Software Engineer - TechCorp Systems
- Architected microservices backend using FastAPI and MongoDB Atlas serving 250k daily active users.
- Optimized query execution plans and caching with Redis, reducing API latency by 45%.
- Automated CI/CD deployment pipelines using Docker, Kubernetes, and GitHub Actions.

PROJECTS
NextHire AI Recruitment Engine
- Designed and built end-to-end recruitment platform using React, Tailwind CSS, FastAPI, and Google Gemini API.
- Implemented real-time adaptive interview questioning and claim verification algorithms.
- Scaled distributed database queries in MongoDB handling 50,000 candidate evaluations with 99.9% uptime.

SKILLS
Programming Languages: Python, JavaScript, TypeScript, SQL
Frontend: React, Tailwind CSS, Redux, Recharts
Backend: FastAPI, Node.js, Express, REST API
Databases & Cloud: MongoDB, Redis, Docker, Kubernetes, AWS

EDUCATION
Bachelor of Science in Computer Science, University of California, 2022
CGPA: 3.8
"""

def test_resume_parser_contact_info():
    data = ResumeParserService.parse_resume(SAMPLE_RESUME_TEXT)
    assert data.candidate_name == "Alex Chen"
    assert data.email == "alex.chen@example.com"
    assert "+1 (555) 234-5678" in data.phone
    assert "linkedin.com/in/alexchen-dev" in data.linkedin
    assert "github.com/alexchen-dev" in data.github

def test_resume_parser_skills_extraction():
    data = ResumeParserService.parse_resume(SAMPLE_RESUME_TEXT)
    skill_names = [s.name for s in data.skills]
    
    assert "FastAPI" in skill_names
    assert "Python" in skill_names
    assert "MongoDB" in skill_names or "Mongodb" in skill_names
    assert "React" in skill_names
    assert "Docker" in skill_names

def test_resume_parser_claims_extraction():
    data = ResumeParserService.parse_resume(SAMPLE_RESUME_TEXT)
    assert len(data.claims) >= 2
    
    claim_texts = " ".join([c.claim_text for c in data.claims])
    # Should catch metric and architecture claims
    assert "latency" in claim_texts.lower() or "microservices" in claim_texts.lower() or "scaled" in claim_texts.lower()
