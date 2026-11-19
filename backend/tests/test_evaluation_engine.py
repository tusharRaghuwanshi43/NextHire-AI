import pytest
from app.services.evaluation_engine import EvaluationEngine
from app.models.evaluation import ComponentScores

def test_deterministic_weighted_scoring():
    """
    Formula requirement:
    - Technical Accuracy: 40%
    - Technical Depth: 25%
    - Resume Consistency: 20%
    - Communication: 10%
    - Confidence: 5%
    """
    # Test case 1: 100 on all should be 100
    score = EvaluationEngine.calculate_weighted_score(100.0, 100.0, 100.0, 100.0, 100.0)
    assert score == 100.0

    # Test case 2: Controlled values
    # Accuracy: 80 * 0.40 = 32.0
    # Depth: 70 * 0.25 = 17.5
    # Consistency: 90 * 0.20 = 18.0
    # Communication: 85 * 0.10 = 8.5
    # Confidence: 80 * 0.05 = 4.0
    # Expected sum = 32.0 + 17.5 + 18.0 + 8.5 + 4.0 = 80.0
    score = EvaluationEngine.calculate_weighted_score(80.0, 70.0, 90.0, 85.0, 80.0)
    assert score == 80.0

    # Test via ComponentScores class method
    components = ComponentScores(
        technical_accuracy=80.0,
        technical_depth=70.0,
        resume_consistency=90.0,
        communication=85.0,
        confidence=80.0
    )
    class_score = ComponentScores.calculate_weighted_total(components)
    assert class_score == 80.0
