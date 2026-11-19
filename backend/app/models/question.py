from datetime import datetime, timezone
from typing import Optional, List
from enum import Enum
from pydantic import BaseModel, Field

class QuestionDifficulty(str, Enum):
    BASIC = "basic"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"

class QuestionType(str, Enum):
    CONCEPTUAL = "conceptual"
    PROJECT_DEEP_DIVE = "project_deep_dive"
    CLAIM_VERIFICATION = "claim_verification"
    PROBLEM_SOLVING = "problem_solving"
    SYSTEM_DESIGN = "system_design"

class Question(BaseModel):
    id: Optional[str] = None
    interview_id: str
    question_order: int
    difficulty: QuestionDifficulty
    question_type: QuestionType
    question_text: str
    target_skill_or_topic: str
    related_project: Optional[str] = None
    related_claim_id: Optional[str] = None
    expected_key_points: List[str] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
