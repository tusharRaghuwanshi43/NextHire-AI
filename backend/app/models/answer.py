from datetime import datetime, timezone
from typing import Optional
from pydantic import BaseModel, Field

class AnswerSubmitRequest(BaseModel):
    question_id: str
    answer_text: str
    time_taken_seconds: Optional[int] = 0

class AnswerInDB(BaseModel):
    id: Optional[str] = None
    interview_id: str
    question_id: str
    candidate_id: str
    answer_text: str
    time_taken_seconds: int = 0
    submitted_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
