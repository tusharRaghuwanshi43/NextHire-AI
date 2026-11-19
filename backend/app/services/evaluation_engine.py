import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
from bson import ObjectId
from app.db.mongodb import get_db_collection
from app.models.evaluation import ComponentScores, QuestionEvaluation, OverallEvaluation
from app.models.claim import ClaimVerificationResult, VerificationStatus
from app.models.skill_gap import SkillGapAnalysis, SkillAssessment, MisunderstoodConcept, RoadmapMilestone
from app.services.ai_service import ai_service

logger = logging.getLogger("nexthire.evaluation")

class EvaluationEngine:
    @staticmethod
    def calculate_weighted_score(
        technical_accuracy: float,
        technical_depth: float,
        resume_consistency: float,
        communication: float,
        confidence: float
    ) -> float:
        """
        Deterministic scoring system:
        - Technical Accuracy: 40%
        - Technical Depth: 25%
        - Resume Consistency: 20%
        - Communication: 10%
        - Confidence: 5%
        """
        total = (
            (technical_accuracy * 0.40) +
            (technical_depth * 0.25) +
            (resume_consistency * 0.20) +
            (communication * 0.10) +
            (confidence * 0.05)
        )
        return round(float(total), 2)

    @staticmethod
    async def evaluate_single_answer(
        interview_id: str,
        question_id: str,
        candidate_id: str,
        answer_text: str,
        provider: Optional[str] = None
    ) -> QuestionEvaluation:
        """Evaluate one answer using selected AI provider analysis + deterministic scoring."""
        questions_col = get_db_collection("questions")
        q_doc = await questions_col.find_one({"_id": ObjectId(question_id) if ObjectId.is_valid(question_id) else question_id})
        
        q_text = q_doc.get("question_text", "Technical Question") if q_doc else "Technical Question"
        target_skill = q_doc.get("target_skill_or_topic", "General Engineering") if q_doc else "General"
        difficulty = q_doc.get("difficulty", "intermediate") if q_doc else "intermediate"
        related_claim = q_doc.get("related_claim_id") if q_doc else None
        expected_points = q_doc.get("expected_key_points", []) if q_doc else []

        # Get AI qualitative component scores & observations through selected provider
        eval_data = await ai_service.evaluate_answer(
            question_text=q_text,
            answer_text=answer_text,
            target_skill=target_skill,
            related_claim=related_claim,
            expected_points=expected_points,
            provider=provider
        )

        raw_scores = eval_data.get("scores", {})
        comp_scores = ComponentScores(
            technical_accuracy=float(raw_scores.get("technical_accuracy", 75.0)),
            technical_depth=float(raw_scores.get("technical_depth", 70.0)),
            resume_consistency=float(raw_scores.get("resume_consistency", 80.0)),
            communication=float(raw_scores.get("communication", 80.0)),
            confidence=float(raw_scores.get("confidence", 75.0)),
        )

        # Deterministic calculation applied in backend
        weighted_score = EvaluationEngine.calculate_weighted_score(
            comp_scores.technical_accuracy,
            comp_scores.technical_depth,
            comp_scores.resume_consistency,
            comp_scores.communication,
            comp_scores.confidence
        )

        return QuestionEvaluation(
            question_id=str(question_id),
            question_text=q_text,
            difficulty=difficulty,
            scores=comp_scores,
            weighted_score=weighted_score,
            strengths=eval_data.get("strengths", []),
            weaknesses=eval_data.get("weaknesses", []),
            supporting_evidence=eval_data.get("supporting_evidence", []),
            feedback=eval_data.get("feedback", "")
        )

    @staticmethod
    async def process_full_interview_evaluation(
        interview_id: str,
        candidate_id: str,
        provider: Optional[str] = None
    ) -> OverallEvaluation:
        """
        Evaluate complete interview:
        1. Evaluates all submitted answers with selected AI provider
        2. Computes deterministic overall scores
        3. Cross-verifies resume claims against answers with selected AI provider
        4. Performs skill-gap analysis with selected AI provider
        5. Saves to MongoDB
        """
        answers_col = get_db_collection("answers")
        interviews_col = get_db_collection("interviews")
        resumes_col = get_db_collection("resumes")
        evaluations_col = get_db_collection("evaluations")
        claims_col = get_db_collection("claim_verifications")
        skill_gap_col = get_db_collection("skill_gap_analyses")

        # Fetch answers for this interview
        cursor = answers_col.find({"interview_id": interview_id})
        answers_list = await cursor.to_list(length=100)
        
        # Fetch interview doc & resume doc
        interview_doc = await interviews_col.find_one({"_id": ObjectId(interview_id) if ObjectId.is_valid(interview_id) else interview_id})
        resume_id = interview_doc.get("resume_id") if interview_doc else None
        selected_provider = provider or (interview_doc.get("ai_provider") if interview_doc else None)
        
        resume_doc = None
        if resume_id:
            resume_doc = await resumes_col.find_one({"_id": ObjectId(resume_id) if ObjectId.is_valid(resume_id) else resume_id})

        question_evaluations: List[QuestionEvaluation] = []
        qa_pairs: List[Dict[str, str]] = []

        for ans in answers_list:
            q_id = ans.get("question_id")
            ans_text = ans.get("answer_text", "")
            q_eval = await EvaluationEngine.evaluate_single_answer(
                interview_id=interview_id,
                question_id=q_id,
                candidate_id=candidate_id,
                answer_text=ans_text,
                provider=selected_provider
            )
            question_evaluations.append(q_eval)
            qa_pairs.append({
                "question": q_eval.question_text,
                "answer": ans_text
            })

        # Calculate averages deterministically
        if question_evaluations:
            avg_acc = sum(qe.scores.technical_accuracy for qe in question_evaluations) / len(question_evaluations)
            avg_dep = sum(qe.scores.technical_depth for qe in question_evaluations) / len(question_evaluations)
            avg_con = sum(qe.scores.resume_consistency for qe in question_evaluations) / len(question_evaluations)
            avg_com = sum(qe.scores.communication for qe in question_evaluations) / len(question_evaluations)
            avg_cnf = sum(qe.scores.confidence for qe in question_evaluations) / len(question_evaluations)
        else:
            avg_acc = avg_dep = avg_con = avg_com = avg_cnf = 70.0

        avg_components = ComponentScores(
            technical_accuracy=round(avg_acc, 2),
            technical_depth=round(avg_dep, 2),
            resume_consistency=round(avg_con, 2),
            communication=round(avg_com, 2),
            confidence=round(avg_cnf, 2)
        )

        overall_score = EvaluationEngine.calculate_weighted_score(
            avg_components.technical_accuracy,
            avg_components.technical_depth,
            avg_components.resume_consistency,
            avg_components.communication,
            avg_components.confidence
        )

        # Aggregate strengths & weaknesses
        all_strengths = []
        all_weaknesses = []
        for qe in question_evaluations:
            all_strengths.extend(qe.strengths)
            all_weaknesses.extend(qe.weaknesses)
        
        # Deduplicate
        unique_strengths = list(dict.fromkeys(all_strengths))[:6]
        unique_weaknesses = list(dict.fromkeys(all_weaknesses))[:6]

        summary = (
            f"Candidate achieved an overall weighted score of {overall_score}/100. "
            f"Key competencies include strong technical accuracy ({avg_components.technical_accuracy}%) "
            f"and resume consistency ({avg_components.resume_consistency}%)."
        )

        overall_eval = OverallEvaluation(
            interview_id=interview_id,
            candidate_id=candidate_id,
            overall_score=overall_score,
            average_components=avg_components,
            question_evaluations=question_evaluations,
            overall_strengths=unique_strengths,
            overall_weaknesses=unique_weaknesses,
            executive_summary=summary
        )

        # Save Evaluation to DB
        eval_dict = overall_eval.model_dump()
        await evaluations_col.update_one(
            {"interview_id": interview_id},
            {"$set": eval_dict},
            upsert=True
        )

        # Update interview status and score
        await interviews_col.update_one(
            {"_id": ObjectId(interview_id) if ObjectId.is_valid(interview_id) else interview_id},
            {
                "$set": {
                    "status": "evaluated",
                    "final_score": overall_score,
                    "evaluated_at": datetime.now(timezone.utc)
                }
            }
        )

        # Perform Claim Verification with selected provider
        await EvaluationEngine.verify_resume_claims(interview_id, candidate_id, resume_doc, qa_pairs, provider=selected_provider)

        # Perform Skill-Gap Analysis with selected provider
        await EvaluationEngine.generate_and_save_skill_gap(interview_id, candidate_id, resume_doc, question_evaluations, provider=selected_provider)

        return overall_eval

    @staticmethod
    async def verify_resume_claims(
        interview_id: str,
        candidate_id: str,
        resume_doc: Optional[Dict[str, Any]],
        qa_pairs: List[Dict[str, str]],
        provider: Optional[str] = None
    ) -> List[ClaimVerificationResult]:
        """Verify each claim extracted from candidate resume against interview responses."""
        claims_col = get_db_collection("claim_verifications")
        extracted_claims = []
        if resume_doc and "parsed_data" in resume_doc:
            extracted_claims = resume_doc["parsed_data"].get("claims", [])
        
        results: List[ClaimVerificationResult] = []
        for c in extracted_claims:
            claim_text = c.get("claim_text", "") if isinstance(c, dict) else c.claim_text
            claim_id = c.get("id", "claim_1") if isinstance(c, dict) else c.id
            
            verification_data = await ai_service.verify_claim_evidence(claim_text, qa_pairs, provider=provider)
            
            v_res = ClaimVerificationResult(
                claim_id=str(claim_id),
                claim_text=claim_text,
                status=VerificationStatus(verification_data.get("status", "partially_verified")),
                confidence_score=float(verification_data.get("confidence_score", 75.0)),
                supporting_evidence=verification_data.get("supporting_evidence", []),
                contradictory_evidence=verification_data.get("contradictory_evidence", []),
                explanation=verification_data.get("explanation", "")
            )
            results.append(v_res)

        # Save to DB
        doc = {
            "interview_id": interview_id,
            "candidate_id": candidate_id,
            "verifications": [r.model_dump() for r in results],
            "updated_at": datetime.now(timezone.utc)
        }
        await claims_col.update_one(
            {"interview_id": interview_id},
            {"$set": doc},
            upsert=True
        )
        return results

    @staticmethod
    async def generate_and_save_skill_gap(
        interview_id: str,
        candidate_id: str,
        resume_doc: Optional[Dict[str, Any]],
        question_evaluations: List[QuestionEvaluation],
        provider: Optional[str] = None
    ) -> SkillGapAnalysis:
        """Generate and save skill-gap analysis and personalized roadmap."""
        skill_gap_col = get_db_collection("skill_gap_analyses")
        
        skills_list = []
        if resume_doc and "parsed_data" in resume_doc:
            skills_raw = resume_doc["parsed_data"].get("skills", [])
            skills_list = [s.get("name") if isinstance(s, dict) else s.name for s in skills_raw]
        if not skills_list:
            skills_list = ["Full-Stack Development", "FastAPI", "React", "MongoDB"]

        evals_summary = [
            {"topic": qe.question_text[:40], "score": qe.weighted_score, "weaknesses": qe.weaknesses}
            for qe in question_evaluations
        ]

        analysis_dict = await ai_service.generate_skill_gap_analysis(skills_list, evals_summary, provider=provider)

        strong_skills = [SkillAssessment(**s) for s in analysis_dict.get("strong_skills", [])]
        weak_skills = [SkillAssessment(**s) for s in analysis_dict.get("weak_skills", [])]
        misunderstood = [MisunderstoodConcept(**m) for m in analysis_dict.get("misunderstood_concepts", [])]
        recommendations = analysis_dict.get("recommended_improvements", [])
        roadmap = [RoadmapMilestone(**r) for r in analysis_dict.get("learning_roadmap", [])]

        skill_gap_obj = SkillGapAnalysis(
            interview_id=interview_id,
            candidate_id=candidate_id,
            strong_skills=strong_skills,
            weak_skills=weak_skills,
            misunderstood_concepts=misunderstood,
            recommended_improvements=recommendations,
            learning_roadmap=roadmap
        )

        await skill_gap_col.update_one(
            {"interview_id": interview_id},
            {"$set": skill_gap_obj.model_dump()},
            upsert=True
        )
        return skill_gap_obj

evaluation_engine = EvaluationEngine()
