# Compatibility bridge: routes to the unified multi-provider ai_service
from app.services.ai_service import ai_service, AIService

# Maintain backwards compatibility for existing imports
gemini_service = ai_service
GeminiService = AIService
