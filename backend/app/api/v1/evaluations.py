from typing import List, Optional, Dict, Any
from fastapi import APIRouter, HTTPException, Depends
from bson import ObjectId
from app.core.security import get_current_user_token_payload
from app.db.mongodb import get_db_collection

router = APIRouter(prefix="/evaluations", tags=["Evaluations & Claims"])

@router.get("/{interview_id}")
async def get_evaluation_results(
    interview_id: str,
    token_payload: dict = Depends(get_current_user_token_payload)
):
    evaluations_col = get_db_collection("evaluations")
    ev = await evaluations_col.find_one({"interview_id": interview_id})
    if not ev:
        raise HTTPException(status_code=404, detail="Evaluation results not yet generated for this interview.")
    
    # Clean Mongo _id for JSON response
    ev_copy = dict(ev)
    ev_copy["id"] = str(ev_copy.pop("_id", interview_id))
    return ev_copy

@router.get("/verifications/{interview_id}")
async def get_claim_verifications(
    interview_id: str,
    token_payload: dict = Depends(get_current_user_token_payload)
):
    claims_col = get_db_collection("claim_verifications")
    cl = await claims_col.find_one({"interview_id": interview_id})
    if not cl:
        return {"interview_id": interview_id, "verifications": []}
    
    return {
        "interview_id": interview_id,
        "candidate_id": cl.get("candidate_id"),
        "verifications": cl.get("verifications", []),
        "updated_at": cl.get("updated_at")
    }

@router.get("/skill-gap/{interview_id}")
async def get_skill_gap_analysis(
    interview_id: str,
    token_payload: dict = Depends(get_current_user_token_payload)
):
    skill_gap_col = get_db_collection("skill_gap_analyses")
    sg = await skill_gap_col.find_one({"interview_id": interview_id})
    if not sg:
        raise HTTPException(status_code=404, detail="Skill gap analysis not found for this interview.")
    
    sg_copy = dict(sg)
    sg_copy["id"] = str(sg_copy.pop("_id", interview_id))
    return sg_copy
