from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from app.models.skill import Skill
from app.models.project import ResumeProject
from app.models.claim import ResumeClaim

class Education(BaseModel):
    institution: str
    degree: Optional[str] = None
    field_of_study: Optional[str] = None
    start_year: Optional[str] = None
    end_year: Optional[str] = None
    gpa: Optional[str] = None

class Experience(BaseModel):
    company: str
    title: str
    location: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    description: Optional[str] = None
    achievements: List[str] = Field(default_factory=list)

class ExtractedResumeData(BaseModel):
    candidate_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    linkedin: Optional[str] = None
    github: Optional[str] = None
    summary: Optional[str] = None
    education: List[Education] = Field(default_factory=list)
    experience: List[Experience] = Field(default_factory=list)
    skills: List[Skill] = Field(default_factory=list)
    projects: List[ResumeProject] = Field(default_factory=list)
    claims: List[ResumeClaim] = Field(default_factory=list)

class ResumeInDB(BaseModel):
    id: Optional[str] = None
    user_id: str
    file_name: str
    file_path: str
    file_type: str # pdf or docx
    file_size_bytes: int
    raw_text: str
    parsed_data: ExtractedResumeData
    is_reviewed: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ResumeReviewUpdateRequest(BaseModel):
    candidate_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    summary: Optional[str] = None
    skills: Optional[List[Skill]] = None
    projects: Optional[List[ResumeProject]] = None
    claims: Optional[List[ResumeClaim]] = None
