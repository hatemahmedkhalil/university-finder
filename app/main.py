import logging
import time
import traceback
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.config import settings
from app.routers import admin, ai_chat, ai_recommendations, announcements, application_guides, applications, auth, calendar_events, course_chat, email_integration, favourites, ielts, instructor_messages, instructor_posts, instructors, learning, motivation_letters, notifications, pipeline, recommendations, scholarships, student_documents, student_profiles, subscription_plans, support, universities, user_languages, users
from app.core.limiter import limiter

BASE_DIR = Path(__file__).resolve().parent.parent
STUDENT_DIST = BASE_DIR / "student-app" / "dist"
ADMIN_DIST = BASE_DIR / "admin" / "dist"
UPLOADS_DIR = BASE_DIR / "uploads"
UPLOADS_DIR.mkdir(exist_ok=True)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)
logger = logging.getLogger("university_finder")


def _warn_missing_secrets() -> None:
    warnings = []
    if not settings.GROQ_API_KEY:
        warnings.append("GROQ_API_KEY is not set — AI chat and recommendations will be disabled")
    if not settings.SMTP_HOST or not settings.SMTP_PASSWORD:
        warnings.append("SMTP credentials are not set — email sending will be mocked")
    if settings.SECRET_KEY in ("changeme", "secret", ""):
        warnings.append("SECRET_KEY is weak or default — change it before going to production")
    if settings.DEBUG:
        warnings.append("DEBUG=true — Swagger UI is publicly accessible. Set DEBUG=false in production")
    for w in warnings:
        logger.warning("[SECURITY] %s", w)


_warn_missing_secrets()

app = FastAPI(
    title="University Finder API",
    description="Backend for a SaaS platform helping students find universities in Europe.",
    version="0.1.0",
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def spa_middleware(request: Request, call_next):
    """
    Browser navigations (Accept: text/html) to SPA routes must receive index.html,
    not the JSON from the matching API router. API calls from axios use
    Accept: application/json and are NOT affected.
    """
    if STUDENT_DIST.exists():
        accept = request.headers.get("accept", "")
        path = request.url.path
        SPA_PREFIXES = (
            "/dashboard", "/announcements", "/universities", "/scholarships", "/profile", "/recommendations",
            "/favourites", "/learning", "/university/", "/instructors",
            "/login", "/register", "/forgot-password", "/reset-password", "/verify-email",
            "/my-questions", "/instructor-panel", "/pricing", "/support", "/notifications", "/ai-chat", "/apply-hub", "/pipeline", "/email-integration", "/calendar",
        )
        if "text/html" in accept and (path == "/" or any(path.startswith(p) for p in SPA_PREFIXES)):
            return FileResponse(STUDENT_DIST / "index.html")

    return await call_next(request)


@app.middleware("http")
async def log_requests(request: Request, call_next):
    start = time.perf_counter()
    response = await call_next(request)
    duration = round((time.perf_counter() - start) * 1000, 1)
    logger.info("%s %s → %s (%sms)", request.method, request.url.path, response.status_code, duration)
    return response


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.error("Unhandled exception on %s %s:\n%s", request.method, request.url.path, traceback.format_exc())
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})


app.include_router(auth.router)
app.include_router(student_profiles.router)
app.include_router(universities.router)
app.include_router(scholarships.router)
app.include_router(recommendations.router)
app.include_router(favourites.router)
app.include_router(admin.router)
app.include_router(users.router)
app.include_router(learning.router)
app.include_router(instructors.router)
app.include_router(announcements.router)
app.include_router(applications.router)
app.include_router(instructor_messages.router)
app.include_router(instructor_posts.router)
app.include_router(subscription_plans.router)
app.include_router(support.router)
app.include_router(notifications.router)
app.include_router(ai_chat.router)
app.include_router(ai_recommendations.router)
app.include_router(ielts.router)
app.include_router(user_languages.router)
app.include_router(student_documents.router)
app.include_router(motivation_letters.router)
app.include_router(pipeline.router)
app.include_router(application_guides.router)
app.include_router(course_chat.router)
app.include_router(email_integration.router)
app.include_router(calendar_events.router)

# Serve only public uploads (instructor photos). Documents require auth — see applications router.
INSTRUCTORS_UPLOAD_DIR = UPLOADS_DIR / "instructors"
INSTRUCTORS_UPLOAD_DIR.mkdir(exist_ok=True)
app.mount("/uploads/instructors", StaticFiles(directory=INSTRUCTORS_UPLOAD_DIR), name="uploads-instructors")


@app.get("/health", tags=["Health"])
def health():
    return {"status": "ok"}


# --- Serve built React apps ---

if STUDENT_DIST.exists():
    if (STUDENT_DIST / "assets").exists():
        app.mount("/assets", StaticFiles(directory=STUDENT_DIST / "assets"), name="student-assets")

if ADMIN_DIST.exists():
    if (ADMIN_DIST / "assets").exists():
        app.mount("/admin/assets", StaticFiles(directory=ADMIN_DIST / "assets"), name="admin-assets")

    @app.get("/admin", include_in_schema=False)
    def serve_admin_root():
        return FileResponse(ADMIN_DIST / "index.html")

    @app.get("/admin/{path:path}", include_in_schema=False)
    def serve_admin(path: str):
        file = (ADMIN_DIST / path).resolve()
        if file.is_file() and ADMIN_DIST.resolve() in file.parents:
            return FileResponse(file)
        return FileResponse(ADMIN_DIST / "index.html")

if STUDENT_DIST.exists():
    @app.get("/{path:path}", include_in_schema=False)
    def serve_student(path: str):
        file = (STUDENT_DIST / path).resolve()
        if file.is_file() and STUDENT_DIST.resolve() in file.parents:
            return FileResponse(file)
        return FileResponse(STUDENT_DIST / "index.html")
