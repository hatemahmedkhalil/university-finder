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
from app.routers import admin, auth, favourites, recommendations, scholarships, student_profiles, universities
from app.routers.auth import limiter

BASE_DIR = Path(__file__).resolve().parent.parent
STUDENT_DIST = BASE_DIR / "student-app" / "dist"
ADMIN_DIST = BASE_DIR / "admin" / "dist"

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)
logger = logging.getLogger("university_finder")

app = FastAPI(
    title="University Finder API",
    description="Backend for a SaaS platform helping students find universities in Europe.",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
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


@app.get("/health", tags=["Health"])
def health():
    return {
        "status": "ok",
        "student_dist_exists": STUDENT_DIST.exists(),
        "admin_dist_exists": ADMIN_DIST.exists(),
        "base_dir": str(BASE_DIR),
    }


# --- Serve built React apps ---

if ADMIN_DIST.exists():
    if (ADMIN_DIST / "assets").exists():
        app.mount("/admin/assets", StaticFiles(directory=ADMIN_DIST / "assets"), name="admin-assets")

    @app.get("/admin", include_in_schema=False)
    def serve_admin_root():
        return FileResponse(ADMIN_DIST / "index.html")

    @app.get("/admin/{path:path}", include_in_schema=False)
    def serve_admin(path: str):
        return FileResponse(ADMIN_DIST / "index.html")

if STUDENT_DIST.exists():
    if (STUDENT_DIST / "assets").exists():
        app.mount("/assets", StaticFiles(directory=STUDENT_DIST / "assets"), name="student-assets")

    @app.get("/{path:path}", include_in_schema=False)
    def serve_student(path: str):
        file = STUDENT_DIST / path
        if file.is_file():
            return FileResponse(file)
        return FileResponse(STUDENT_DIST / "index.html")
