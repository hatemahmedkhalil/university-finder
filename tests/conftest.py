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
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from sqlalchemy.pool import StaticPool

from app.database import Base
from app.dependencies import get_db
from app.main import app
from app.models.university import University

TEST_DATABASE_URL = "sqlite:///:memory:"

# StaticPool: all connections share a single in-memory SQLite database,
# so create_all() and TestingSessionLocal() see the same tables.
engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="session", autouse=True)
def create_tables():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


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
