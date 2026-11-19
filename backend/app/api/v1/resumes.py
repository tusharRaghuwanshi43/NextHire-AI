import os
import shutil
from datetime import datetime, timezone
from typing import Optional, List
from fastapi import APIRouter, HTTPException, UploadFile, File, Depends, status
from bson import ObjectId
from app.core.config import settings
from app.core.security import get_current_user_token_payload
from app.db.mongodb import get_db_collection
from app.services.resume_parser import ResumeParserService
from app.models.resume import ExtractedResumeData, ResumeReviewUpdateRequest

router = APIRouter(prefix="/resumes", tags=["Resumes"])

ALLOWED_EXTENSIONS = {".pdf", ".docx"}

@router.post("/upload")
async def upload_resume(
    file: UploadFile = File(...),
    token_payload: dict = Depends(get_current_user_token_payload)
):
    user_id = token_payload.get("sub")
    ext = os.path.splitext(file.filename)[1].lower()
    
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file type. Only PDF and DOCX files are accepted."
        )

    # Save uploaded file safely
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    file_id = str(ObjectId())
    safe_filename = f"{file_id}_{file.filename}"
    saved_path = os.path.join(settings.UPLOAD_DIR, safe_filename)

    with open(saved_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    file_size = os.path.getsize(saved_path)

    # Parse resume text and extract entities
    try:
        raw_text = ResumeParserService.extract_text(saved_path, ext)
        extracted: ExtractedResumeData = ResumeParserService.parse_resume(raw_text)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error parsing resume file: {str(e)}"
        )

    # Persist in MongoDB
    resumes_col = get_db_collection("resumes")
    resume_doc = {
        "user_id": user_id,
        "file_name": file.filename,
        "file_path": saved_path,
        "file_type": ext.replace(".", ""),
        "file_size_bytes": file_size,
        "raw_text": raw_text,
        "parsed_data": extracted.model_dump(),
        "is_reviewed": False,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    }

    res = await resumes_col.insert_one(resume_doc)
    resume_id = str(res.inserted_id)

    # Also persist skills, projects, and claims into their separate collections
    skills_col = get_db_collection("skills")
    projects_col = get_db_collection("resume_projects")
    claims_col = get_db_collection("resume_claims")

    if extracted.skills:
        skill_docs = [
            {**s.model_dump(), "resume_id": resume_id, "candidate_id": user_id}
            for s in extracted.skills
        ]
        await skills_col.insert_many(skill_docs)

    if extracted.projects:
        project_docs = [
            {**p.model_dump(), "resume_id": resume_id, "candidate_id": user_id}
            for p in extracted.projects
        ]
        await projects_col.insert_many(project_docs)

    if extracted.claims:
        claim_docs = [
            {**c.model_dump(), "resume_id": resume_id, "candidate_id": user_id}
            for c in extracted.claims
        ]
        await claims_col.insert_many(claim_docs)

    return {
        "id": resume_id,
        "file_name": file.filename,
        "file_type": ext.replace(".", ""),
        "parsed_data": extracted.model_dump(),
        "is_reviewed": False,
        "message": "Resume uploaded and parsed successfully."
    }

@router.get("/my-resume")
async def get_my_resume(token_payload: dict = Depends(get_current_user_token_payload)):
    user_id = token_payload.get("sub")
    resumes_col = get_db_collection("resumes")
    cursor = resumes_col.find({"user_id": user_id}).sort("created_at", -1).limit(1)
    resumes = await cursor.to_list(length=1)
    if not resumes:
        return None
    
    r = resumes[0]
    return {
        "id": str(r["_id"]),
        "file_name": r.get("file_name"),
        "file_type": r.get("file_type"),
        "parsed_data": r.get("parsed_data"),
        "is_reviewed": r.get("is_reviewed", False),
        "created_at": r.get("created_at")
    }

@router.get("/{resume_id}")
async def get_resume_by_id(
    resume_id: str,
    token_payload: dict = Depends(get_current_user_token_payload)
):
    resumes_col = get_db_collection("resumes")
    r = await resumes_col.find_one({"_id": ObjectId(resume_id) if ObjectId.is_valid(resume_id) else resume_id})
    if not r:
        raise HTTPException(status_code=404, detail="Resume not found.")
    
    return {
        "id": str(r["_id"]),
        "user_id": r.get("user_id"),
        "file_name": r.get("file_name"),
        "file_type": r.get("file_type"),
        "parsed_data": r.get("parsed_data"),
        "is_reviewed": r.get("is_reviewed", False),
        "created_at": r.get("created_at")
    }

@router.put("/{resume_id}/review")
async def review_resume(
    resume_id: str,
    review_update: ResumeReviewUpdateRequest,
    token_payload: dict = Depends(get_current_user_token_payload)
):
    """Allows candidates to review, edit, or confirm their extracted resume details."""
    resumes_col = get_db_collection("resumes")
    r = await resumes_col.find_one({"_id": ObjectId(resume_id) if ObjectId.is_valid(resume_id) else resume_id})
    if not r:
        raise HTTPException(status_code=404, detail="Resume not found.")

    pdata = r.get("parsed_data", {})
    if review_update.candidate_name is not None:
        pdata["candidate_name"] = review_update.candidate_name
    if review_update.email is not None:
        pdata["email"] = review_update.email
    if review_update.phone is not None:
        pdata["phone"] = review_update.phone
    if review_update.summary is not None:
        pdata["summary"] = review_update.summary
    if review_update.skills is not None:
        pdata["skills"] = [s.model_dump() for s in review_update.skills]
    if review_update.projects is not None:
        pdata["projects"] = [p.model_dump() for p in review_update.projects]
    if review_update.claims is not None:
        pdata["claims"] = [c.model_dump() for c in review_update.claims]

    await resumes_col.update_one(
        {"_id": ObjectId(resume_id) if ObjectId.is_valid(resume_id) else resume_id},
        {
            "$set": {
                "parsed_data": pdata,
                "is_reviewed": True,
                "updated_at": datetime.now(timezone.utc)
            }
        }
    )

    return {
        "id": resume_id,
        "message": "Resume details reviewed and confirmed successfully.",
        "parsed_data": pdata,
        "is_reviewed": True
    }
