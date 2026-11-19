from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from enum import Enum
from pydantic import BaseModel, Field

class InterviewStatus(str, Enum):
    INITIALIZED = "initialized"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    EVALUATED = "evaluated"

class InterviewCreateRequest(BaseModel):
    resume_id: str
    target_role: Optional[str] = "Software Engineer"
    total_questions: int = Field(default=5, ge=3, le=10)
    ai_provider: Optional[str] = None

class InterviewSession(BaseModel):
    id: Optional[str] = None
    candidate_id: str
    candidate_name: str
    candidate_email: str
    resume_id: str
    target_role: str = "Software Engineer"
    ai_provider: Optional[str] = "gemini"
    status: InterviewStatus = InterviewStatus.INITIALIZED
    total_questions: int = 5
    current_question_index: int = 0
    question_ids: List[str] = Field(default_factory=list)
    final_score: Optional[float] = None
    started_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    completed_at: Optional[datetime] = None
    evaluated_at: Optional[datetime] = None

class NextQuestionResponse(BaseModel):
    interview_id: str
    question_index: int
    total_questions: int
    is_last_question: bool
    question_id: str
    question_text: str
    difficulty: str
    target_skill_or_topic: str
    related_project: Optional[str] = None
