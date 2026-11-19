from typing import List, Optional, Dict, Any
import datetime
from fastapi import APIRouter, HTTPException, Depends, Query
from bson import ObjectId
from app.core.security import get_current_user_token_payload
from app.db.mongodb import get_db_collection

router = APIRouter(prefix="/recruiter", tags=["Recruiter Analytics"])

def serialize_mongo(obj: Any) -> Any:
    """Recursively convert ObjectId and datetime objects to JSON serializable structures."""
    if isinstance(obj, ObjectId):
        return str(obj)
    elif isinstance(obj, (datetime.datetime, datetime.date)):
        return obj.isoformat()
    elif isinstance(obj, dict):
        cleaned = {}
        for k, v in obj.items():
            if k == "_id":
                cleaned["id"] = str(v)
            else:
                cleaned[k] = serialize_mongo(v)
        return cleaned
    elif isinstance(obj, list):
        return [serialize_mongo(item) for item in obj]
    return obj

def ensure_recruiter_or_admin(token_payload: dict):
    role = token_payload.get("role")
    if role not in ["recruiter", "admin"]:
        raise HTTPException(status_code=403, detail="Access reserved for recruiters and administrators.")

@router.get("/dashboard-stats")
async def get_dashboard_stats(token_payload: dict = Depends(get_current_user_token_payload)):
    ensure_recruiter_or_admin(token_payload)
    
    users_col = get_db_collection("users")
    resumes_col = get_db_collection("resumes")
    interviews_col = get_db_collection("interviews")
    evaluations_col = get_db_collection("evaluations")

    total_candidates = await users_col.count_documents({"role": "candidate"})
    total_resumes = await resumes_col.count_documents({})
    total_interviews = await interviews_col.count_documents({})
    completed_interviews = await interviews_col.count_documents({"status": {"$in": ["completed", "evaluated"]}})

    # Calculate average score
    cursor = evaluations_col.find({})
    evals = await cursor.to_list(length=500)
    scores = [e.get("overall_score", 0.0) for e in evals if e.get("overall_score")]
    avg_score = round(sum(scores) / len(scores), 1) if scores else 0.0

    return {
        "total_candidates": total_candidates,
        "resumes_analyzed": total_resumes,
        "total_interviews": total_interviews,
        "completed_interviews": completed_interviews,
        "average_score": avg_score,
        "top_performers_count": len([s for s in scores if s >= 85.0])
    }

@router.get("/candidates")
async def list_candidates(
    search: Optional[str] = None,
    min_score: Optional[float] = None,
    token_payload: dict = Depends(get_current_user_token_payload)
):
    ensure_recruiter_or_admin(token_payload)
    
    interviews_col = get_db_collection("interviews")
    resumes_col = get_db_collection("resumes")
    evaluations_col = get_db_collection("evaluations")
    users_col = get_db_collection("users")

    # Get completed interviews
    interviews_cursor = interviews_col.find({}).sort("started_at", -1)
    interviews = await interviews_cursor.to_list(length=100)

    results = []
    for iv in interviews:
        cand_name = iv.get("candidate_name", "Candidate")
        cand_email = iv.get("candidate_email", "")
        iv_id = str(iv["_id"])
        
        # Search filter
        if search:
            s_low = search.lower()
            if s_low not in cand_name.lower() and s_low not in cand_email.lower():
                continue

        # Score filter
        final_score = iv.get("final_score")
        if min_score is not None and (final_score is None or final_score < min_score):
            continue

        # Fetch skills from resume
        resume_id = iv.get("resume_id")
        skills = []
        if resume_id:
            r = await resumes_col.find_one({"_id": ObjectId(resume_id) if ObjectId.is_valid(resume_id) else resume_id})
            if r and "parsed_data" in r:
                skills = [s.get("name") if isinstance(s, dict) else s.name for s in r["parsed_data"].get("skills", [])][:5]

        results.append({
            "interview_id": iv_id,
            "candidate_id": iv.get("candidate_id"),
            "candidate_name": cand_name,
            "candidate_email": cand_email,
            "target_role": iv.get("target_role", "Software Engineer"),
            "status": iv.get("status"),
            "final_score": final_score,
            "top_skills": skills,
            "date": iv.get("started_at")
        })

    # Sort by score descending
    results.sort(key=lambda x: (x["final_score"] is not None, x["final_score"]), reverse=True)
    return results

@router.get("/candidates/{candidate_id}/detail")
async def get_candidate_detail(
    candidate_id: str,
    token_payload: dict = Depends(get_current_user_token_payload)
):
    ensure_recruiter_or_admin(token_payload)

    users_col = get_db_collection("users")
    resumes_col = get_db_collection("resumes")
    interviews_col = get_db_collection("interviews")
    evaluations_col = get_db_collection("evaluations")
    claims_col = get_db_collection("claim_verifications")
    resume_claims_col = get_db_collection("resume_claims")
    skill_gap_col = get_db_collection("skill_gap_analyses")

    user_query = {"_id": ObjectId(candidate_id)} if ObjectId.is_valid(candidate_id) else {"_id": candidate_id}
    user = await users_col.find_one(user_query)
    if not user:
        raise HTTPException(status_code=404, detail="Candidate not found.")

    cand_id_variants = [candidate_id]
    if ObjectId.is_valid(candidate_id):
        cand_id_variants.append(ObjectId(candidate_id))

    resume = await resumes_col.find_one({"user_id": {"$in": cand_id_variants}})
    interview = await interviews_col.find_one({"candidate_id": {"$in": cand_id_variants}})
    
    interview_id = str(interview["_id"]) if interview else None
    evaluation = None
    claims = []
    skill_gap = None

    if interview_id:
        iv_id_variants = [interview_id]
        if ObjectId.is_valid(interview_id):
            iv_id_variants.append(ObjectId(interview_id))

        evaluation = await evaluations_col.find_one({"interview_id": {"$in": iv_id_variants}})
        cl_doc = await claims_col.find_one({"interview_id": {"$in": iv_id_variants}})
        if cl_doc:
            claims = cl_doc.get("verifications", [])
        skill_gap = await skill_gap_col.find_one({"interview_id": {"$in": iv_id_variants}})

    # Fallback to resume claims if no interview claim verifications yet
    if not claims:
        cursor = resume_claims_col.find({"candidate_id": {"$in": cand_id_variants}})
        r_claims = await cursor.to_list(length=50)
        if r_claims:
            claims = [
                {
                    "claim_text": c.get("claim_text", ""),
                    "category": c.get("category", "Resume Claim"),
                    "status": "unverified",
                    "confidence_score": 0,
                    "explanation": "Claim extracted from resume. Pending active interview verification.",
                    "supporting_evidence": [],
                    "contradictory_evidence": []
                }
                for c in r_claims
            ]

    data = {
        "candidate": {
            "id": str(user["_id"]),
            "name": user.get("name"),
            "email": user.get("email"),
            "title": user.get("title")
        },
        "resume": resume.get("parsed_data") if resume else None,
        "interview": interview,
        "evaluation": evaluation,
        "claims": claims,
        "skill_gap": skill_gap
    }
    return serialize_mongo(data)

@router.post("/comparison")
async def compare_candidates(
    interview_ids: List[str],
    token_payload: dict = Depends(get_current_user_token_payload)
):
    """Side-by-side comparison of 2 or more candidates across skills and dimensions."""
    ensure_recruiter_or_admin(token_payload)

    interviews_col = get_db_collection("interviews")
    evaluations_col = get_db_collection("evaluations")
    resumes_col = get_db_collection("resumes")

    comparison_data = []

    for iv_id in interview_ids:
        iv = await interviews_col.find_one({"_id": ObjectId(iv_id) if ObjectId.is_valid(iv_id) else iv_id})
        if not iv:
            continue
        
        ev = await evaluations_col.find_one({"interview_id": iv_id})
        resume_id = iv.get("resume_id")
        resume = await resumes_col.find_one({"_id": ObjectId(resume_id) if ObjectId.is_valid(resume_id) else resume_id})

        comp_scores = ev.get("average_components", {}) if ev else {}
        skills = []
        if resume and "parsed_data" in resume:
            skills = [s.get("name") if isinstance(s, dict) else s.name for s in resume["parsed_data"].get("skills", [])][:6]

        comparison_data.append({
            "interview_id": iv_id,
            "candidate_name": iv.get("candidate_name", "Candidate"),
            "candidate_email": iv.get("candidate_email", ""),
            "target_role": iv.get("target_role", "Software Engineer"),
            "overall_score": iv.get("final_score") or (ev.get("overall_score") if ev else 0.0),
            "technical_accuracy": comp_scores.get("technical_accuracy", 0.0),
            "technical_depth": comp_scores.get("technical_depth", 0.0),
            "resume_consistency": comp_scores.get("resume_consistency", 0.0),
            "communication": comp_scores.get("communication", 0.0),
            "confidence": comp_scores.get("confidence", 0.0),
            "strengths": ev.get("overall_strengths", [])[:3] if ev else [],
            "weaknesses": ev.get("overall_weaknesses", [])[:3] if ev else [],
            "skills": skills
        })

    return {"candidates": comparison_data}

@router.get("/analytics")
async def get_recruiter_analytics(token_payload: dict = Depends(get_current_user_token_payload)):
    """Aggregate analytics for recruitment pipeline."""
    ensure_recruiter_or_admin(token_payload)

    evaluations_col = get_db_collection("evaluations")
    cursor = evaluations_col.find({})
    evals = await cursor.to_list(length=500)

    # Score distribution brackets
    brackets = {"90-100": 0, "80-89": 0, "70-79": 0, "60-69": 0, "<60": 0}
    for e in evals:
        s = e.get("overall_score", 0.0)
        if s >= 90:
            brackets["90-100"] += 1
        elif s >= 80:
            brackets["80-89"] += 1
        elif s >= 70:
            brackets["70-79"] += 1
        elif s >= 60:
            brackets["60-69"] += 1
        else:
            brackets["<60"] += 1

    distribution = [{"range": k, "count": v} for k, v in brackets.items()]

    # Dimension averages
    avg_accuracy = round(sum(e.get("average_components", {}).get("technical_accuracy", 75.0) for e in evals) / max(len(evals), 1), 1)
    avg_depth = round(sum(e.get("average_components", {}).get("technical_depth", 70.0) for e in evals) / max(len(evals), 1), 1)
    avg_consistency = round(sum(e.get("average_components", {}).get("resume_consistency", 80.0) for e in evals) / max(len(evals), 1), 1)
    avg_comm = round(sum(e.get("average_components", {}).get("communication", 80.0) for e in evals) / max(len(evals), 1), 1)
    avg_conf = round(sum(e.get("average_components", {}).get("confidence", 75.0) for e in evals) / max(len(evals), 1), 1)

    dimension_metrics = [
        {"dimension": "Technical Accuracy (40%)", "average": avg_accuracy},
        {"dimension": "Technical Depth (25%)", "average": avg_depth},
        {"dimension": "Resume Consistency (20%)", "average": avg_consistency},
        {"dimension": "Communication (10%)", "average": avg_comm},
        {"dimension": "Confidence (5%)", "average": avg_conf}
    ]

    return {
        "score_distribution": distribution,
        "dimension_metrics": dimension_metrics,
        "sample_size": len(evals)
    }
