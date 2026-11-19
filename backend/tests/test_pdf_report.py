import os
from app.services.pdf_report_generator import pdf_report_generator

def test_pdf_report_generation():
    interview_data = {
        "id": "iv_test_99887766",
        "candidate_name": "Test Candidate",
        "candidate_email": "test@example.com",
        "target_role": "Full Stack Engineer"
    }

    evaluation_data = {
        "overall_score": 85.5,
        "average_components": {
            "technical_accuracy": 88.0,
            "technical_depth": 82.0,
            "resume_consistency": 90.0,
            "communication": 85.0,
            "confidence": 80.0
        },
        "executive_summary": "Candidate demonstrated strong practical knowledge of FastAPI and React with clear reasoning."
    }

    claims_data = [
        {
            "claim_text": "Architected microservices reducing latency by 45%",
            "status": "strongly_verified",
            "confidence_score": 92.0,
            "explanation": "Provided concrete details on cache invalidation and query optimization.",
            "supporting_evidence": ["Explained Redis write-through cache"]
        }
    ]

    skill_gap_data = {
        "strong_skills": [
            {"skill_name": "FastAPI", "proficiency_level": "Mastered", "score": 92.0}
        ],
        "weak_skills": [
            {"skill_name": "Distributed Consensus", "proficiency_level": "Needs Work", "score": 65.0}
        ],
        "learning_roadmap": [
            {
                "week_or_phase": "Week 1",
                "focus_topic": "Consensus & Raft",
                "action_items": ["Read Raft Paper"],
                "resources": ["Designing Data-Intensive Applications"]
            }
        ]
    }

    output_path = pdf_report_generator.generate_candidate_report(
        interview_data=interview_data,
        evaluation_data=evaluation_data,
        claims_data=claims_data,
        skill_gap_data=skill_gap_data,
        output_filename="test_evaluation_report.pdf"
    )

    assert os.path.exists(output_path)
    assert os.path.getsize(output_path) > 1000 # Valid non-empty PDF generated
