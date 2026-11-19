from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends, status
from bson import ObjectId
from app.core.security import get_current_user_token_payload
from app.db.mongodb import get_db_collection
from app.models.interview import InterviewCreateRequest, InterviewSession, NextQuestionResponse
from app.models.answer import AnswerSubmitRequest
from app.services.interview_engine import interview_engine

router = APIRouter(prefix="/interviews", tags=["AI Interviews"])

@router.post("/start", response_model=InterviewSession)
async def start_interview(
    request: InterviewCreateRequest,
    token_payload: dict = Depends(get_current_user_token_payload)
):
    candidate_id = token_payload.get("sub")
    candidate_name = token_payload.get("name", "Candidate")
    candidate_email = token_payload.get("email", "")

    # Validate resume ownership or existence
    resumes_col = get_db_collection("resumes")
    resume = await resumes_col.find_one({"_id": ObjectId(request.resume_id) if ObjectId.is_valid(request.resume_id) else request.resume_id})
    if not resume:
        raise HTTPException(status_code=404, detail="Selected resume not found.")

    session = await interview_engine.create_interview_session(
        candidate_id=candidate_id,
        candidate_name=candidate_name,
        candidate_email=candidate_email,
        resume_id=request.resume_id,
        target_role=request.target_role or "Software Engineer",
        total_questions=request.total_questions,
        ai_provider=request.ai_provider
    )
    return session

@router.get("/{interview_id}/next-question")
async def get_next_question(
    interview_id: str,
    token_payload: dict = Depends(get_current_user_token_payload)
):
    next_q = await interview_engine.get_next_question(interview_id)
    if not next_q:
        return {"status": "completed", "message": "All interview questions answered."}
    return next_q

@router.post("/{interview_id}/submit-answer")
async def submit_answer(
    interview_id: str,
    request: AnswerSubmitRequest,
    token_payload: dict = Depends(get_current_user_token_payload)
):
    candidate_id = token_payload.get("sub")
    result = await interview_engine.submit_candidate_answer(
        interview_id=interview_id,
        question_id=request.question_id,
        candidate_id=candidate_id,
        answer_text=request.answer_text,
        time_taken_seconds=request.time_taken_seconds or 0
    )
    return result

@router.get("/my-interviews")
async def get_my_interviews(token_payload: dict = Depends(get_current_user_token_payload)):
    candidate_id = token_payload.get("sub")
    interviews_col = get_db_collection("interviews")
    cursor = interviews_col.find({"candidate_id": candidate_id}).sort("started_at", -1)
    interviews = await cursor.to_list(length=50)
    
    return [
        {
            "id": str(i["_id"]),
            "target_role": i.get("target_role"),
            "status": i.get("status"),
            "total_questions": i.get("total_questions"),
            "current_question_index": i.get("current_question_index"),
            "final_score": i.get("final_score"),
            "started_at": i.get("started_at"),
            "completed_at": i.get("completed_at")
        }
        for i in interviews
    ]

@router.get("/{interview_id}")
async def get_interview_detail(
    interview_id: str,
    token_payload: dict = Depends(get_current_user_token_payload)
):
    interviews_col = get_db_collection("interviews")
    i = await interviews_col.find_one({"_id": ObjectId(interview_id) if ObjectId.is_valid(interview_id) else interview_id})
    if not i:
        raise HTTPException(status_code=404, detail="Interview not found.")
    
    return {
        "id": str(i["_id"]),
        "candidate_id": i.get("candidate_id"),
        "candidate_name": i.get("candidate_name"),
        "candidate_email": i.get("candidate_email"),
        "resume_id": i.get("resume_id"),
        "target_role": i.get("target_role"),
        "status": i.get("status"),
        "total_questions": i.get("total_questions"),
        "current_question_index": i.get("current_question_index"),
        "final_score": i.get("final_score"),
        "started_at": i.get("started_at"),
        "completed_at": i.get("completed_at")
    }
