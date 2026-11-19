from datetime import datetime, timezone
from typing import Optional
from pydantic import BaseModel, Field

class ReportRecord(BaseModel):
    id: Optional[str] = None
    interview_id: str
    candidate_id: str
    file_path: str
    file_name: str
    file_size_bytes: int
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ReportDownloadInfo(BaseModel):
    report_id: str
    interview_id: str
    candidate_name: str
    download_url: str
    generated_at: datetime
