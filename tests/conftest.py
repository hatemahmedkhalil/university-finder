"""
Shared pytest fixtures.
Uses SQLite in-memory so no PostgreSQL instance is required for tests.
"""
import os

# Must be set before any app module is imported (Settings reads env at module load)
os.environ.setdefault("DATABASE_URL", "sqlite:///:memory:")
os.environ.setdefault("SECRET_KEY", "test-secret-key-not-for-production")
os.environ.setdefault("ALLOWED_ORIGINS", '["http://localhost:3000"]')

# passlib 1.7.4 + bcrypt on Python 3.13 is broken — use sha256_crypt for tests
from passlib.context import CryptContext
import app.core.security as _security
_security.pwd_context = CryptContext(schemes=["sha256_crypt"], deprecated="auto")

import pytest
import sqlalchemy as sa
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from sqlalchemy import event
from sqlalchemy.pool import StaticPool

import app.database as _database
from app.database import Base
from app.models.university import University

TEST_DATABASE_URL = "sqlite:///:memory:"

# StaticPool: all connections share a single in-memory SQLite database,
# so create_all() and TestingSessionLocal() see the same tables.
engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)


@event.listens_for(engine, "connect")
def _register_now(dbapi_conn, _):
    """Some routers write raw Postgres SQL (e.g. NOW()) directly — shim it
    for SQLite so those code paths are still exercisable in tests."""
    import datetime

    dbapi_conn.create_function("NOW", 0, lambda: datetime.datetime.utcnow().isoformat(" "))
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# A few routers (community.py, cost_of_living.py) call `SessionLocal()` directly
# instead of using the `Depends(get_db)` dependency-injection pattern, so the
# normal test-client DB override never reaches them. Since they `from
# app.database import SessionLocal` at *module import time*, this patch must
# happen before `app.main` (and therefore those routers) is imported below —
# otherwise they'd keep their own already-bound reference to the real
# (schema-less, separate) sqlite engine and every query would 500.
_database.engine = engine
_database.SessionLocal = TestingSessionLocal

from app.dependencies import get_db
from app.main import app
from app.config import settings

# Some tests make real calls to the live Groq API (send_message, letter
# generation, exam report generation, etc). These are LIVE-PROVIDER SMOKE
# TESTS, not deterministic unit/integration tests: Groq's actual uptime,
# latency, and response content are outside this repo's control, so they
# must never gate a normal CI run. They only run when explicitly opted into
# via RUN_LIVE_AI_TESTS=1 (not merely because a GROQ_API_KEY happens to be
# configured locally in .env — a key being present says nothing about
# whether Groq is actually reachable/healthy right now, which is exactly
# what caused these tests to flake with real 502s during Phase 3 batch
# work). The deterministic counterpart of each of these tests — same route,
# same assertions, but with app.services.ai_client mocked instead of a real
# network call — lives alongside it and always runs, so CI never loses
# coverage of our own code just because Groq is unavailable.
requires_groq = pytest.mark.skipif(
    os.environ.get("RUN_LIVE_AI_TESTS") != "1",
    reason="Live Groq smoke test — set RUN_LIVE_AI_TESTS=1 to run it. "
           "Not part of the deterministic default suite.",
)


@pytest.fixture
def mock_ai_client(monkeypatch):
    """Deterministic stand-in for app.services.ai_client.chat_completion /
    achat_completion, used by the non-live counterparts of the Groq-dependent
    tests. Returns a fixed, realistic response so routes can be exercised
    (status codes, DB writes, response shape) without any network call.
    Call `.set(text)` from a test to control the exact returned content."""
    state = {"text": "This is a deterministic mocked AI response for testing."}

    def fake_chat_completion(messages, max_tokens=1000, temperature=0.7, response_format=None):
        return state["text"]

    async def fake_achat_completion(messages, max_tokens=1000, temperature=0.7, response_format=None):
        return state["text"]

    # Every call site does `from app.services.ai_client import chat_completion`
    # at import time, binding its own local name — patching the ai_client
    # module attribute alone would not reach them. Patch each router module's
    # already-bound reference directly instead.
    for module_path, name, fake in [
        ("app.services.ai_client", "chat_completion", fake_chat_completion),
        ("app.services.ai_client", "achat_completion", fake_achat_completion),
        ("app.routers.pipeline", "chat_completion", fake_chat_completion),
        ("app.routers.motivation_letters", "chat_completion", fake_chat_completion),
        ("app.routers.ai_recommendations", "chat_completion", fake_chat_completion),
        ("app.routers.ai_chat", "achat_completion", fake_achat_completion),
        ("app.routers.application_guides", "chat_completion", fake_chat_completion),
        ("app.routers.simulator", "chat_completion", fake_chat_completion),
    ]:
        try:
            monkeypatch.setattr(f"{module_path}.{name}", fake)
        except AttributeError:
            pass  # module doesn't import that name directly — not a call site

    class _Handle:
        def set(self, text):
            state["text"] = text

    return _Handle()


# Tables owned by routers that use hand-written SQL (sa.text) instead of an
# ORM model — Base.metadata.create_all() never sees these, so they need to be
# created explicitly here, matching their real Alembic migrations exactly.
_RAW_SQL_TABLES = """
CREATE TABLE IF NOT EXISTS community_posts (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    body TEXT NOT NULL,
    category VARCHAR(50) NOT NULL DEFAULT 'general',
    country_tag VARCHAR(50),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS community_comments (
    id INTEGER PRIMARY KEY,
    post_id INTEGER NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    body TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS community_likes (
    id INTEGER PRIMARY KEY,
    post_id INTEGER NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(post_id, user_id)
);
CREATE TABLE IF NOT EXISTS city_cost_of_living (
    id INTEGER PRIMARY KEY,
    city VARCHAR(100) NOT NULL,
    country VARCHAR(50) NOT NULL,
    rent_single_eur INTEGER,
    rent_shared_eur INTEGER,
    food_eur INTEGER,
    transport_eur INTEGER,
    utilities_eur INTEGER,
    total_min_eur INTEGER,
    total_max_eur INTEGER,
    notes TEXT
);
"""


@pytest.fixture(scope="session", autouse=True)
def create_tables():
    Base.metadata.create_all(bind=engine)
    with engine.begin() as conn:
        for stmt in _RAW_SQL_TABLES.strip().split(";"):
            if stmt.strip():
                conn.exec_driver_sql(stmt)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture(autouse=True)
def reset_rate_limiter():
    """slowapi's limiter uses shared in-memory storage across the whole test
    session — without resetting it, rate-limited endpoints (login, register)
    start returning 429 once enough tests in a file have called them."""
    from app.core.limiter import limiter

    limiter.reset()
    yield


@pytest.fixture()
def db():
    """
    Yields a session against the in-memory SQLite DB.
    Cleans all rows after each test so tests are fully isolated.
    SQLAlchemy 2.0 removed `Session(bind=connection)` so we use
    table-level DELETE instead of nested-transaction rollback.
    """
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.rollback()
        # Delete in reverse FK order so constraints are not violated
        for table in reversed(Base.metadata.sorted_tables):
            session.execute(table.delete())
        # Raw-SQL tables (not registered on Base.metadata — see create_tables)
        for raw_table in ("community_likes", "community_comments", "community_posts", "city_cost_of_living"):
            session.execute(sa.text(f"DELETE FROM {raw_table}"))
        session.commit()
        session.close()


@pytest.fixture()
def client(db):
    def override_get_db():
        yield db

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


# ---------------------------------------------------------------------------
# Auth helpers
# ---------------------------------------------------------------------------

def register_and_login(client_fixture, db_fixture, email: str, role: str = "student") -> dict:
    """Create user directly in DB (bypasses HTTP so we skip rate-limit) and return auth headers."""
    from app.core.security import create_access_token, hash_password
    from app.models.user import User

    existing = db_fixture.query(User).filter(User.email == email).first()
    if existing:
        user = existing
        user.role = role
    else:
        user = User(email=email, hashed_password=hash_password("Test1234!"), role=role)
        db_fixture.add(user)

    db_fixture.commit()
    db_fixture.refresh(user)
    token = create_access_token(str(user.id))
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture()
def student_headers(client, db):
    return register_and_login(client, db, "student@test.com", role="student")


@pytest.fixture()
def admin_headers(client, db):
    return register_and_login(client, db, "admin@test.com", role="admin")


@pytest.fixture()
def sample_universities(db):
    unis = [
        University(name="TU Munich", country="Germany", city="Munich",
                   ranking=50, tuition_fee_eur=0, is_public=True, english_programs_available=True),
        University(name="Warsaw University", country="Poland", city="Warsaw",
                   ranking=308, tuition_fee_eur=2000, is_public=True, english_programs_available=True),
        University(name="Expensive Uni", country="Netherlands", city="Delft",
                   ranking=57, tuition_fee_eur=25000, is_public=True, english_programs_available=True),
    ]
    db.add_all(unis)
    db.commit()
    for u in unis:
        db.refresh(u)
    return unis
