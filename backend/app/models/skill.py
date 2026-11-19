from typing import Optional, List
from enum import Enum
from pydantic import BaseModel, Field

class SkillCategory(str, Enum):
    FRONTEND = "Frontend"
    BACKEND = "Backend"
    DATABASE = "Database"
    CLOUD_DEVOPS = "Cloud/DevOps"
    AI_ML = "AI/ML"
    LANGUAGE = "Programming Language"
    TESTING_QA = "Testing/QA"
    OTHER = "Other"

class Skill(BaseModel):
    name: str
    category: str = SkillCategory.OTHER
    proficiency: Optional[str] = "Intermediate" # Beginner, Intermediate, Advanced, Expert
    years_experience: Optional[float] = None
    mentioned_contexts: List[str] = Field(default_factory=list)

class SkillInDB(Skill):
    id: Optional[str] = None
    resume_id: str
    candidate_id: str
