import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.core.config import settings
from app.db.mongodb import db_manager
from app.api.v1.auth import router as auth_router
from app.api.v1.resumes import router as resumes_router
from app.api.v1.interviews import router as interviews_router
from app.api.v1.evaluations import router as evaluations_router
from app.api.v1.recruiter import router as recruiter_router
from app.api.v1.reports import router as reports_router
from app.api.v1.settings import router as settings_router
from app.services.ai_service import ai_service

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("nexthire.main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Connect to MongoDB
    logger.info("Initializing NextHire AI Backend Services...")
    await db_manager.connect()
    yield
    # Shutdown: Close MongoDB connection
    logger.info("Shutting down NextHire AI Backend Services...")
    await db_manager.close()

app = FastAPI(
    title="NextHire AI API",
    description="AI-powered recruitment platform that analyzes candidate resumes, extracts claims, conducts adaptive interviews, and evaluates knowledge.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Exception handlers
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error processing {request.method} {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal server error occurred. Please try again later."}
    )

# Register API Routers
app.include_router(auth_router, prefix="/api/v1")
app.include_router(resumes_router, prefix="/api/v1")
app.include_router(interviews_router, prefix="/api/v1")
app.include_router(evaluations_router, prefix="/api/v1")
app.include_router(recruiter_router, prefix="/api/v1")
app.include_router(reports_router, prefix="/api/v1")
app.include_router(settings_router, prefix="/api/v1")

@app.get("/api/health")
async def health_check():
    provider_info = ai_service.get_provider_status()
    return {
        "status": "healthy",
        "service": "NextHire AI Backend",
        "database": "connected" if db_manager.is_connected else "disconnected",
        "database_mode": "in_memory_simulation" if db_manager.in_memory_fallback else "mongodb_atlas",
        "active_ai_provider": provider_info["active_provider"],
        "ai_providers": provider_info["providers"]
    }

@app.get("/")
async def root():
    return {
        "name": "NextHire AI API",
        "version": "1.0.0",
        "documentation": "/docs",
        "status": "operational"
    }
