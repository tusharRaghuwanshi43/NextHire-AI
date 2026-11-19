from typing import Optional, List
from enum import Enum
from pydantic import BaseModel, Field

class VerificationStatus(str, Enum):
    UNVERIFIED = "unverified"
    STRONGLY_VERIFIED = "strongly_verified"
    PARTIALLY_VERIFIED = "partially_verified"
    QUESTIONABLE = "questionable"
    CONTRADICTED = "contradicted"

class ResumeClaim(BaseModel):
    id: Optional[str] = None
    claim_text: str
    category: str = "Technical Claim" # Architecture, Optimization, Deployment, Scale, Tooling
    source_context: str # Which section/project it came from
    associated_skills: List[str] = Field(default_factory=list)
    impact_level: str = "Medium" # High, Medium, Low
    
class ClaimVerificationResult(BaseModel):
    claim_id: str
    claim_text: str
    status: VerificationStatus = VerificationStatus.UNVERIFIED
    confidence_score: float = 0.0 # 0.0 - 100.0
    supporting_evidence: List[str] = Field(default_factory=list)
    contradictory_evidence: List[str] = Field(default_factory=list)
    explanation: str = ""
    assessed_in_question_ids: List[str] = Field(default_factory=list)
