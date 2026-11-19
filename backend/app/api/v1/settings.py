from typing import Optional, Dict, Any, List
from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel, Field
from app.services.ai_service import ai_service, SUPPORTED_PROVIDERS

router = APIRouter(prefix="/settings", tags=["AI Provider Settings"])

class SetAIProviderRequest(BaseModel):
    provider: str = Field(..., description="Selected AI Provider: 'gemini', 'openai', or 'grok'")

@router.get("/ai-provider")
async def get_ai_provider_settings():
    """Retrieve all available AI providers and the currently active provider."""
    # Ensure any persisted setting from DB is loaded
    await ai_service.get_persisted_active_provider()
    return ai_service.get_provider_status()

@router.post("/ai-provider")
async def update_ai_provider_setting(payload: SetAIProviderRequest):
    """Manually select the active AI provider (Google Gemini, OpenAI, or Grok)."""
    clean_provider = payload.provider.lower().strip()
    if clean_provider not in SUPPORTED_PROVIDERS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported AI provider '{payload.provider}'. Must be one of: {', '.join(SUPPORTED_PROVIDERS)}"
        )

    try:
        updated_status = await ai_service.set_active_provider(clean_provider)
        return {
            "status": "success",
            "message": f"Active AI provider switched to '{clean_provider}'.",
            "data": updated_status
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update AI provider: {str(e)}"
        )
