import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
from bson import ObjectId
from app.db.mongodb import get_db_collection
from app.models.interview import InterviewSession, InterviewStatus, NextQuestionResponse
from app.models.question import Question, QuestionDifficulty, QuestionType
from app.services.ai_service import ai_service
from app.services.evaluation_engine import evaluation_engine

logger = logging.getLogger("nexthire.interview_engine")

class InterviewEngine:
    @staticmethod
    async def create_interview_session(
        candidate_id: str,
        candidate_name: str,
        candidate_email: str,
        resume_id: str,
        target_role: str = "Software Engineer",
        total_questions: int = 5,
        ai_provider: Optional[str] = None
    ) -> InterviewSession:
        """Initialize interview session, fetch resume context, and generate questions."""
        resumes_col = get_db_collection("resumes")
        interviews_col = get_db_collection("interviews")
        questions_col = get_db_collection("questions")

        # Resolve active AI provider (session-specific or platform setting)
        selected_provider = (ai_provider or await ai_service.get_persisted_active_provider()).lower()

        resume_doc = await resumes_col.find_one({"_id": ObjectId(resume_id) if ObjectId.is_valid(resume_id) else resume_id})
        
        skills = []
        projects = []
        claims = []
        if resume_doc and "parsed_data" in resume_doc:
            pdata = resume_doc["parsed_data"]
            skills = [s.get("name") if isinstance(s, dict) else s.name for s in pdata.get("skills", [])]
            projects = pdata.get("projects", [])
            claims = pdata.get("claims", [])

        # Create session in DB
        session_doc = {
            "candidate_id": candidate_id,
            "candidate_name": candidate_name,
            "candidate_email": candidate_email,
            "resume_id": resume_id,
            "target_role": target_role,
            "ai_provider": selected_provider,
            "status": InterviewStatus.INITIALIZED.value,
            "total_questions": total_questions,
            "current_question_index": 0,
            "question_ids": [],
            "started_at": datetime.now(timezone.utc),
            "final_score": None
        }
        res = await interviews_col.insert_one(session_doc)
        interview_id = str(res.inserted_id)

        # Generate structured questions with selected AI provider
        generated_questions = await ai_service.generate_interview_questions(
            skills=skills,
            projects=projects,
            claims=claims,
            target_role=target_role,
            count=total_questions,
            provider=selected_provider
        )

        question_ids = []
        for q_dict in generated_questions:
            q_doc = {
                "interview_id": interview_id,
                "question_order": q_dict.get("question_order", len(question_ids) + 1),
                "difficulty": q_dict.get("difficulty", "intermediate"),
                "question_type": q_dict.get("question_type", "conceptual"),
                "question_text": q_dict.get("question_text", "Explain your technical background."),
                "target_skill_or_topic": q_dict.get("target_skill_or_topic", skills[0] if skills else "General"),
                "related_project": q_dict.get("related_project"),
                "related_claim_id": q_dict.get("related_claim_id"),
                "expected_key_points": q_dict.get("expected_key_points", []),
                "created_at": datetime.now(timezone.utc)
            }
            q_res = await questions_col.insert_one(q_doc)
            question_ids.append(str(q_res.inserted_id))

        # Update interview with question IDs
        await interviews_col.update_one(
            {"_id": ObjectId(interview_id) if ObjectId.is_valid(interview_id) else interview_id},
            {"$set": {"question_ids": question_ids, "status": InterviewStatus.IN_PROGRESS.value}}
        )

        return InterviewSession(
            id=interview_id,
            candidate_id=candidate_id,
            candidate_name=candidate_name,
            candidate_email=candidate_email,
            resume_id=resume_id,
            target_role=target_role,
            ai_provider=selected_provider,
            status=InterviewStatus.IN_PROGRESS,
            total_questions=total_questions,
            current_question_index=0,
            question_ids=question_ids,
            started_at=datetime.now(timezone.utc)
        )

    @staticmethod
    async def get_next_question(interview_id: str) -> Optional[NextQuestionResponse]:
        """Fetch the current active question for an in-progress interview."""
        interviews_col = get_db_collection("interviews")
        questions_col = get_db_collection("questions")

        interview = await interviews_col.find_one({"_id": ObjectId(interview_id) if ObjectId.is_valid(interview_id) else interview_id})
        if not interview:
            return None

        curr_idx = interview.get("current_question_index", 0)
        q_ids = interview.get("question_ids", [])
        total = len(q_ids)

        if curr_idx >= total:
            return None

        current_q_id = q_ids[curr_idx]
        q_doc = await questions_col.find_one({"_id": ObjectId(current_q_id) if ObjectId.is_valid(current_q_id) else current_q_id})
        if not q_doc:
            return None

        return NextQuestionResponse(
            interview_id=interview_id,
            question_index=curr_idx + 1,
            total_questions=total,
            is_last_question=(curr_idx + 1 == total),
            question_id=str(q_doc["_id"]),
            question_text=q_doc.get("question_text", ""),
            difficulty=q_doc.get("difficulty", "intermediate"),
            target_skill_or_topic=q_doc.get("target_skill_or_topic", "General"),
            related_project=q_doc.get("related_project")
        )

    @staticmethod
    async def submit_candidate_answer(
        interview_id: str,
        question_id: str,
        candidate_id: str,
        answer_text: str,
        time_taken_seconds: int = 0
    ) -> Dict[str, Any]:
        """Record candidate answer and advance current question pointer."""
        answers_col = get_db_collection("answers")
        interviews_col = get_db_collection("interviews")

        # Save answer
        ans_doc = {
            "interview_id": interview_id,
            "question_id": question_id,
            "candidate_id": candidate_id,
            "answer_text": answer_text,
            "time_taken_seconds": time_taken_seconds,
            "submitted_at": datetime.now(timezone.utc)
        }
        await answers_col.insert_one(ans_doc)

        # Advance question index
        interview = await interviews_col.find_one({"_id": ObjectId(interview_id) if ObjectId.is_valid(interview_id) else interview_id})
        current_idx = interview.get("current_question_index", 0)
        total_questions = len(interview.get("question_ids", []))
        
        next_idx = current_idx + 1
        is_completed = next_idx >= total_questions

        update_fields: Dict[str, Any] = {"current_question_index": next_idx}
        if is_completed:
            update_fields["status"] = InterviewStatus.COMPLETED.value
            update_fields["completed_at"] = datetime.now(timezone.utc)

        await interviews_col.update_one(
            {"_id": ObjectId(interview_id) if ObjectId.is_valid(interview_id) else interview_id},
            {"$set": update_fields}
        )

        # If completed, trigger full evaluation pipeline asynchronously with configured provider
        if is_completed:
            ai_prov = interview.get("ai_provider") if interview else None
            logger.info(f"Interview {interview_id} completed. Triggering evaluation engine with provider '{ai_prov}'.")
            await evaluation_engine.process_full_interview_evaluation(
                interview_id=interview_id,
                candidate_id=candidate_id,
                provider=ai_prov
            )

        return {
            "status": "success",
            "is_completed": is_completed,
            "next_question_index": next_idx,
            "total_questions": total_questions
        }

interview_engine = InterviewEngine()
