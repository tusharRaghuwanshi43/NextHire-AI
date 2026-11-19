import pytest
import asyncio
from app.services.ai_service import (
    ai_service,
    PROVIDER_GEMINI,
    PROVIDER_OPENAI,
    PROVIDER_GROK,
    SUPPORTED_PROVIDERS
)

def test_supported_providers_and_metadata():
    assert PROVIDER_GEMINI in SUPPORTED_PROVIDERS
    assert PROVIDER_OPENAI in SUPPORTED_PROVIDERS
    assert PROVIDER_GROK in SUPPORTED_PROVIDERS

    status = ai_service.get_provider_status()
    assert "active_provider" in status
    assert len(status["providers"]) == 3
    
    provider_ids = [p["id"] for p in status["providers"]]
    assert "gemini" in provider_ids
    assert "openai" in provider_ids
    assert "grok" in provider_ids

def test_set_active_provider():
    # Set to OpenAI
    res = asyncio.run(ai_service.set_active_provider("openai"))
    assert ai_service.get_active_provider() == "openai"
    assert res["active_provider"] == "openai"

    # Set to Grok
    res = asyncio.run(ai_service.set_active_provider("grok"))
    assert ai_service.get_active_provider() == "grok"
    assert res["active_provider"] == "grok"

    # Set to Gemini
    res = asyncio.run(ai_service.set_active_provider("gemini"))
    assert ai_service.get_active_provider() == "gemini"
    assert res["active_provider"] == "gemini"

    # Invalid provider should raise ValueError
    with pytest.raises(ValueError):
        asyncio.run(ai_service.set_active_provider("unsupported_claude_xyz"))

def test_fallback_question_generation_for_all_providers():
    skills = ["FastAPI", "React", "MongoDB"]
    projects = [{"title": "Cloud Platform"}]
    claims = [{"id": "claim_1", "claim_text": "Scaled system to 10k users"}]

    for provider in ["gemini", "openai", "grok"]:
        asyncio.run(ai_service.set_active_provider(provider))
        questions = ai_service._fallback_question_generation(
            skills=skills,
            projects=projects,
            claims=claims,
            target_role="Full Stack Engineer",
            count=3
        )
        assert isinstance(questions, list)
        assert len(questions) == 3
        assert questions[0]["difficulty"] in ["basic", "intermediate", "advanced"]
