from datetime import datetime, timezone
from typing import Optional, List, Dict
from pydantic import BaseModel, Field

class ComponentScores(BaseModel):
    technical_accuracy: float = Field(..., ge=0, le=100, description="40% weight")
    technical_depth: float = Field(..., ge=0, le=100, description="25% weight")
    resume_consistency: float = Field(..., ge=0, le=100, description="20% weight")
    communication: float = Field(..., ge=0, le=100, description="10% weight")
    confidence: float = Field(..., ge=0, le=100, description="5% weight")

    @classmethod
    def calculate_weighted_total(cls, scores: "ComponentScores") -> float:
        """Deterministic weighted calculation: 40% + 25% + 20% + 10% + 5%."""
        total = (
            (scores.technical_accuracy * 0.40) +
            (scores.technical_depth * 0.25) +
            (scores.resume_consistency * 0.20) +
            (scores.communication * 0.10) +
            (scores.confidence * 0.05)
        )
        return round(total, 2)

class QuestionEvaluation(BaseModel):
    question_id: str
    question_text: str
    difficulty: str
    scores: ComponentScores
    weighted_score: float
    strengths: List[str] = Field(default_factory=list)
    weaknesses: List[str] = Field(default_factory=list)
    supporting_evidence: List[str] = Field(default_factory=list)
    feedback: str = ""

class OverallEvaluation(BaseModel):
    id: Optional[str] = None
    interview_id: str
    candidate_id: str
    overall_score: float # 0 - 100
    average_components: ComponentScores
    question_evaluations: List[QuestionEvaluation] = Field(default_factory=list)
    overall_strengths: List[str] = Field(default_factory=list)
    overall_weaknesses: List[str] = Field(default_factory=list)
    executive_summary: str = ""
    evaluated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
