from typing import Optional, List
from pydantic import BaseModel, Field

class ResumeProject(BaseModel):
    title: str
    role: Optional[str] = None
    technologies: List[str] = Field(default_factory=list)
    description: str = ""
    outcomes_metrics: List[str] = Field(default_factory=list)
    key_responsibilities: List[str] = Field(default_factory=list)
    link: Optional[str] = None

class ResumeProjectInDB(ResumeProject):
    id: Optional[str] = None
    resume_id: str
    candidate_id: str
