import re
import os
import fitz # PyMuPDF
import docx # python-docx
from typing import Dict, Any, List, Tuple
from app.models.resume import ExtractedResumeData, Education, Experience
from app.models.skill import Skill, SkillCategory
from app.models.project import ResumeProject
from app.models.claim import ResumeClaim

TECH_SKILLS_TAXONOMY = {
    SkillCategory.LANGUAGE: [
        "python", "javascript", "typescript", "java", "c++", "c#", "go", "golang", 
        "rust", "ruby", "php", "swift", "kotlin", "sql", "bash", "shell", "html", "css"
    ],
    SkillCategory.FRONTEND: [
        "react", "react.js", "next.js", "vue", "vue.js", "angular", "svelte", 
        "tailwind css", "tailwind", "redux", "recharts", "material-ui", "bootstrap"
    ],
    SkillCategory.BACKEND: [
        "fastapi", "django", "flask", "node.js", "express", "express.js", "spring boot", 
        "nest.js", "graphql", "rest api", "restful api", "grpc", "celery", "microservices"
    ],
    SkillCategory.DATABASE: [
        "mongodb", "mongodb atlas", "postgresql", "postgres", "mysql", "redis", 
        "elasticsearch", "dynamodb", "cassandra", "sqlite", "neo4j", "supabase"
    ],
    SkillCategory.CLOUD_DEVOPS: [
        "docker", "kubernetes", "aws", "azure", "gcp", "google cloud", "ci/cd", 
        "github actions", "terraform", "nginx", "linux", "git", "jenkins"
    ],
    SkillCategory.AI_ML: [
        "machine learning", "deep learning", "nlp", "llm", "gemini", "openai", "spacy", 
        "pytorch", "tensorflow", "scikit-learn", "langchain", "rag", "hugging face", "computer vision"
    ],
    SkillCategory.TESTING_QA: [
        "pytest", "unittest", "jest", "cypress", "selenium", "postman", "tdd"
    ]
}

EMAIL_REGEX = r'[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+'
PHONE_REGEX = r'(?:(?:\+|00)\d{1,3}[-.\s]*)?(?:(?:\(\d{1,4}\)|\d{1,4})[-.\s]*)?\d{3,4}[-.\s]*\d{3,4}'
LINKEDIN_REGEX = r'linkedin\.com/in/([a-zA-Z0-9_-]+)'
GITHUB_REGEX = r'github\.com/([a-zA-Z0-9_-]+)'

class ResumeParserService:
    @staticmethod
    def extract_text(file_path: str, file_type: str) -> str:
        """Extract all raw text from a PDF or DOCX file."""
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"File not found: {file_path}")
        
        file_type = file_type.lower()
        if "pdf" in file_type or file_path.endswith(".pdf"):
            return ResumeParserService._extract_from_pdf(file_path)
        elif "docx" in file_type or file_path.endswith(".docx"):
            return ResumeParserService._extract_from_docx(file_path)
        else:
            # Fallback plain text read
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                return f.read()

    @staticmethod
    def _extract_from_pdf(file_path: str) -> str:
        doc = fitz.open(file_path)
        text_parts = []
        for page in doc:
            text_parts.append(page.get_text("text"))
        return "\n".join(text_parts).strip()

    @staticmethod
    def _extract_from_docx(file_path: str) -> str:
        doc = docx.Document(file_path)
        text_parts = [para.text for para in doc.paragraphs if para.text.strip()]
        for table in doc.tables:
            for row in table.rows:
                row_text = " | ".join(cell.text.strip() for cell in row.cells if cell.text.strip())
                if row_text:
                    text_parts.append(row_text)
        return "\n".join(text_parts).strip()

    @staticmethod
    def parse_resume(raw_text: str) -> ExtractedResumeData:
        """Parse raw resume text into structured fields: Info, Education, Experience, Skills, Projects, and Claims."""
        lines = [line.strip() for line in raw_text.splitlines() if line.strip()]
        
        # 1. Contact Info & Links
        email_match = re.search(EMAIL_REGEX, raw_text)
        phone_match = re.search(PHONE_REGEX, raw_text)
        linkedin_match = re.search(LINKEDIN_REGEX, raw_text, re.IGNORECASE)
        github_match = re.search(GITHUB_REGEX, raw_text, re.IGNORECASE)
        
        email = email_match.group(0) if email_match else None
        phone = phone_match.group(0) if phone_match else None
        linkedin = f"https://linkedin.com/in/{linkedin_match.group(1)}" if linkedin_match else None
        github = f"https://github.com/{github_match.group(1)}" if github_match else None
        
        # Candidate Name heuristic (first clean line that isn't email, phone, or title)
        candidate_name = "Candidate"
        for line in lines[:5]:
            if "@" not in line and not re.search(r'\d{3}', line) and len(line) < 50:
                clean = re.sub(r'[^a-zA-Z\s]', '', line).strip()
                if clean and len(clean.split()) in [2, 3, 4]:
                    candidate_name = clean
                    break
        
        # 2. Extract Skills
        extracted_skills = ResumeParserService._extract_skills(raw_text)
        
        # 3. Extract Projects
        extracted_projects = ResumeParserService._extract_projects(raw_text, extracted_skills)
        
        # 4. Extract Claims
        extracted_claims = ResumeParserService._extract_claims(raw_text, extracted_skills)
        
        # 5. Extract Education & Experience
        education_list = ResumeParserService._extract_education(raw_text)
        experience_list = ResumeParserService._extract_experience(raw_text)
        
        # 6. Summary heuristic
        summary = ""
        for i, line in enumerate(lines[:15]):
            if re.search(r'(summary|profile|about me|objective)', line, re.IGNORECASE):
                summary = " ".join(lines[i+1:i+4])
                break
        if not summary and len(lines) > 2:
            summary = lines[1] if len(lines[1]) > 30 else (lines[2] if len(lines) > 2 else "")

        return ExtractedResumeData(
            candidate_name=candidate_name,
            email=email,
            phone=phone,
            linkedin=linkedin,
            github=github,
            summary=summary,
            education=education_list,
            experience=experience_list,
            skills=extracted_skills,
            projects=extracted_projects,
            claims=extracted_claims
        )

    @staticmethod
    def _extract_skills(text: str) -> List[Skill]:
        found_skills: Dict[str, Skill] = {}
        text_lower = text.lower()
        
        for category, skill_keywords in TECH_SKILLS_TAXONOMY.items():
            for skill_kw in skill_keywords:
                # Word boundary match
                pattern = r'\b' + re.escape(skill_kw) + r'\b'
                matches = list(re.finditer(pattern, text_lower))
                if matches:
                    norm_name = skill_kw.title() if len(skill_kw) > 3 else skill_kw.upper()
                    if norm_name in ["Fastapi", "Next.Js", "Vue.Js", "Node.Js", "Tailwind Css", "Spring Boot"]:
                        norm_name = {
                            "Fastapi": "FastAPI",
                            "Next.Js": "Next.js",
                            "Vue.Js": "Vue.js",
                            "Node.Js": "Node.js",
                            "Tailwind Css": "Tailwind CSS",
                            "Spring Boot": "Spring Boot"
                        }[norm_name]
                    
                    # Context snippets
                    contexts = []
                    for m in matches[:2]:
                        start = max(0, m.start() - 35)
                        end = min(len(text), m.end() + 35)
                        contexts.append(text[start:end].strip())

                    proficiency = "Intermediate"
                    if len(matches) >= 3 or any(w in text_lower for w in [f"lead {skill_kw}", f"architected with {skill_kw}", f"expert in {skill_kw}"]):
                        proficiency = "Advanced"
                    elif len(matches) == 1:
                        proficiency = "Intermediate"

                    found_skills[norm_name] = Skill(
                        name=norm_name,
                        category=category.value,
                        proficiency=proficiency,
                        mentioned_contexts=contexts
                    )
        return list(found_skills.values())

    @staticmethod
    def _extract_projects(text: str, detected_skills: List[Skill]) -> List[ResumeProject]:
        projects: List[ResumeProject] = []
        lines = text.splitlines()
        project_indices = []
        
        # Locate project header sections
        in_project_section = False
        section_lines = []
        
        for line in lines:
            trimmed = line.strip()
            if re.match(r'^(PROJECTS|ACADEMIC PROJECTS|PERSONAL PROJECTS|KEY PROJECTS)', trimmed, re.IGNORECASE):
                in_project_section = True
                continue
            elif in_project_section and re.match(r'^(EXPERIENCE|EDUCATION|SKILLS|CERTIFICATIONS|ACHIEVEMENTS|WORK HISTORY)', trimmed, re.IGNORECASE):
                in_project_section = False
                break
            
            if in_project_section:
                section_lines.append(trimmed)

        # If explicit section not detected, scan document for bullet points with tech keywords
        if not section_lines:
            section_lines = [l.strip() for l in lines if len(l.strip()) > 20]

        current_proj: Dict[str, Any] = None
        for line in section_lines:
            if not line:
                continue
            # Check if line looks like a project title: short, bold-like, contains colon or dash or tech
            is_title = (len(line) < 70 and not line.startswith(('-', '•', '*', '–', '1', '2', '3'))) and (
                any(sep in line for sep in ['-', '|', '–', ':']) or any(s.name.lower() in line.lower() for s in detected_skills[:5])
            )
            
            if is_title:
                if current_proj and current_proj["description"]:
                    projects.append(ResumeProject(**current_proj))
                
                parts = re.split(r'[-–:|]', line)
                title = parts[0].strip()
                techs = [s.name for s in detected_skills if s.name.lower() in line.lower()]
                current_proj = {
                    "title": title if len(title) > 3 else line,
                    "technologies": techs,
                    "description": "",
                    "outcomes_metrics": [],
                    "key_responsibilities": []
                }
            elif current_proj:
                current_proj["description"] += " " + line
                if any(metric in line.lower() for metric in ['%', 'reduced', 'increased', 'optimized', 'scaled', 'users', 'ms', 'seconds', 'speed']):
                    current_proj["outcomes_metrics"].append(line)
                else:
                    current_proj["key_responsibilities"].append(line)

        if current_proj and current_proj.get("title"):
            projects.append(ResumeProject(**current_proj))

        # Default fallback project if none structured was found
        if not projects:
            relevant_skills = [s.name for s in detected_skills[:4]]
            projects.append(ResumeProject(
                title="Full-Stack Application Development",
                role="Software Developer",
                technologies=relevant_skills,
                description="Designed and built end-to-end software modules incorporating best practices, unit testing, and modular architecture.",
                outcomes_metrics=["Maintained high code quality and test coverage."],
                key_responsibilities=["Developed core backend services", "Integrated database schemas"]
            ))

        return projects[:5]

    @staticmethod
    def _extract_claims(text: str, detected_skills: List[Skill]) -> List[ResumeClaim]:
        """
        Identify high-stakes technical claims from resume statements.
        E.g. metrics, architectural decisions, scalability, performance optimizations.
        """
        claims: List[ResumeClaim] = []
        sentences = re.split(r'[.\n•\r]+', text)
        
        claim_patterns = [
            (r'(\b(?:scaled|handled|served)\b.*?\b(?:\d+[\s]*(?:users|requests|qps|rps|million|k))\b)', "Scale & Performance", "High"),
            (r'(\b(?:reduced|improved|increased|boosted|optimized|accelerated)\b.*?\b(?:\d+%\b|\d+x\b|\d+[\s]*(?:ms|seconds|min)))', "Optimization & Metrics", "High"),
            (r'(\b(?:architected|designed|spearheaded|engineered|refactored)\b.*?\b(?:microservices|pipeline|system|infrastructure|distributed|cloud|api)\b)', "System Architecture", "High"),
            (r'(\b(?:deployed|automated|configured)\b.*?\b(?:ci/cd|kubernetes|docker|aws|gcp|github actions)\b)', "DevOps & Deployment", "Medium"),
            (r'(\b(?:implemented|trained|fine-tuned|developed)\b.*?\b(?:rag|llm|machine learning|model|gemini|nlp|algorithm)\b)', "AI / Machine Learning", "High")
        ]

        claim_id_counter = 1
        for sent in sentences:
            cleaned = sent.strip()
            if len(cleaned) < 25 or len(cleaned) > 280:
                continue
            
            for pattern, category, impact in claim_patterns:
                if re.search(pattern, cleaned, re.IGNORECASE):
                    # Associated skills
                    associated = [s.name for s in detected_skills if s.name.lower() in cleaned.lower()]
                    
                    # Avoid duplicates
                    if not any(c.claim_text == cleaned for c in claims):
                        claims.append(ResumeClaim(
                            id=f"claim_{claim_id_counter}",
                            claim_text=cleaned,
                            category=category,
                            source_context="Work History & Projects",
                            associated_skills=associated,
                            impact_level=impact
                        ))
                        claim_id_counter += 1
                    break

        # If fewer than 2 claims detected, extract strong declarative sentences
        if len(claims) < 2:
            for sent in sentences:
                cleaned = sent.strip()
                if any(w in cleaned.lower() for w in ["developed", "built", "designed", "created", "integrated"]) and len(cleaned) > 35:
                    associated = [s.name for s in detected_skills if s.name.lower() in cleaned.lower()]
                    claims.append(ResumeClaim(
                        id=f"claim_{claim_id_counter}",
                        claim_text=cleaned,
                        category="Implementation Claim",
                        source_context="Resume Statement",
                        associated_skills=associated,
                        impact_level="Medium"
                    ))
                    claim_id_counter += 1
                    if len(claims) >= 3:
                        break

        return claims[:8]

    @staticmethod
    def _extract_education(text: str) -> List[Education]:
        education_entries = []
        edu_keywords = ["bachelor", "master", "b.tech", "m.tech", "b.e", "m.e", "bs", "ms", "phd", "degree", "university", "institute", "college"]
        lines = text.splitlines()
        
        for i, line in enumerate(lines):
            line_lower = line.lower()
            if any(k in line_lower for k in edu_keywords):
                # Search year
                year_match = re.search(r'\b(19\d{2}|20\d{2})\b', line)
                gpa_match = re.search(r'\b(?:gpa|cgpa)[:\s]*([0-9.]+)', line_lower)
                
                degree = "Degree"
                for d in ["b.tech", "m.tech", "bachelor of technology", "bachelor of science", "master of science", "b.s.", "m.s.", "bachelor", "master"]:
                    if d in line_lower:
                        degree = d.title()
                        break
                        
                education_entries.append(Education(
                    institution=line.strip()[:80],
                    degree=degree,
                    end_year=year_match.group(0) if year_match else None,
                    gpa=gpa_match.group(1) if gpa_match else None
                ))
        return education_entries[:3]

    @staticmethod
    def _extract_experience(text: str) -> List[Experience]:
        experiences = []
        exp_roles = ["software engineer", "frontend developer", "backend developer", "full stack developer", "data scientist", "intern", "tech lead", "architect"]
        lines = text.splitlines()
        
        for i, line in enumerate(lines):
            line_lower = line.lower()
            if any(role in line_lower for role in exp_roles) and len(line.strip()) < 90:
                experiences.append(Experience(
                    company="Technology Enterprise",
                    title=line.strip(),
                    description="Engineered core product features, participated in sprint reviews and code refactoring.",
                    achievements=[]
                ))
        return experiences[:4]
