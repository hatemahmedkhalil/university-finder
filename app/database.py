from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.config import settings

if settings.DATABASE_URL.startswith("sqlite"):
    # SQLite (used by the test suite) doesn't support pool_size/max_overflow.
    engine = create_engine(settings.DATABASE_URL, connect_args={"check_same_thread": False})
else:
    engine = create_engine(
        settings.DATABASE_URL,
        # Per-worker pool. If you run N gunicorn/uvicorn workers, total possible
        # DB connections = N * (pool_size + max_overflow) = N * 20 — keep this in
        # mind against your Postgres plan's connection limit when changing worker count.
        pool_size=10,
        max_overflow=10,
        pool_pre_ping=True,   # checks connection liveness before use — avoids
                              # "SSL connection has been closed unexpectedly" errors
                              # after the DB idles or restarts
        pool_recycle=1800,    # recycle connections every 30 min — many managed
                              # Postgres providers (Heroku, RDS, Supabase) silently
                              # kill idle connections server-side before that
    )
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass
