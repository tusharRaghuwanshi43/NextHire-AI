import os
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import FileResponse
from bson import ObjectId
from app.core.security import get_current_user_token_payload
from app.db.mongodb import get_db_collection
from app.services.pdf_report_generator import pdf_report_generator

router = APIRouter(prefix="/reports", tags=["PDF Reports"])

@router.get("/download-pdf/{interview_id}")
async def download_interview_report(
    interview_id: str,
    token_payload: dict = Depends(get_current_user_token_payload)
):
    interviews_col = get_db_collection("interviews")
    evaluations_col = get_db_collection("evaluations")
    claims_col = get_db_collection("claim_verifications")
    skill_gap_col = get_db_collection("skill_gap_analyses")
    reports_col = get_db_collection("reports")

    interview = await interviews_col.find_one({"_id": ObjectId(interview_id) if ObjectId.is_valid(interview_id) else interview_id})
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found.")

    evaluation = await evaluations_col.find_one({"interview_id": interview_id})
    if not evaluation:
        raise HTTPException(status_code=400, detail="Interview has not been evaluated yet.")

    claims_doc = await claims_col.find_one({"interview_id": interview_id})
    claims_list = claims_doc.get("verifications", []) if claims_doc else []

    skill_gap = await skill_gap_col.find_one({"interview_id": interview_id})
    if not skill_gap:
        skill_gap = {}

    # Generate PDF
    pdf_path = pdf_report_generator.generate_candidate_report(
        interview_data={
            "id": interview_id,
            "candidate_name": interview.get("candidate_name", "Candidate"),
            "candidate_email": interview.get("candidate_email", ""),
            "target_role": interview.get("target_role", "Software Engineer")
        },
        evaluation_data=evaluation,
        claims_data=claims_list,
        skill_gap_data=skill_gap
    )

    if not os.path.exists(pdf_path):
        raise HTTPException(status_code=500, detail="Failed to generate PDF report.")

    filename = os.path.basename(pdf_path)
    file_size = os.path.getsize(pdf_path)

    # Save record to reports collection
    report_record = {
        "interview_id": interview_id,
        "candidate_id": interview.get("candidate_id"),
        "file_path": pdf_path,
        "file_name": filename,
        "file_size_bytes": file_size,
        "created_at": datetime.now(timezone.utc)
    }
    await reports_col.insert_one(report_record)

    return FileResponse(
        path=pdf_path,
        media_type="application/pdf",
        filename=filename,
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
