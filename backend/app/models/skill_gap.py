from datetime import datetime, timezone
from typing import Optional, List, Dict
from pydantic import BaseModel, Field

class SkillAssessment(BaseModel):
    skill_name: str
    proficiency_level: str # Mastered, Proficient, Needs Work, Critical Gap
    score: float # 0 - 100
    evidence: str

class MisunderstoodConcept(BaseModel):
    concept: str
    what_candidate_said: str
    correct_explanation: str
    importance: str # Critical, Moderate, Minor

class LearningResource(BaseModel):
    title: str
    type: str # Course, Documentation, Practice, Book
    url_or_ref: str
    estimated_hours: int

class RoadmapMilestone(BaseModel):
    week_or_phase: str
    focus_topic: str
    action_items: List[str]
    resources: List[str]

class SkillGapAnalysis(BaseModel):
    id: Optional[str] = None
    interview_id: str
    candidate_id: str
    strong_skills: List[SkillAssessment] = Field(default_factory=list)
    weak_skills: List[SkillAssessment] = Field(default_factory=list)
    misunderstood_concepts: List[MisunderstoodConcept] = Field(default_factory=list)
    recommended_improvements: List[str] = Field(default_factory=list)
    learning_roadmap: List[RoadmapMilestone] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
