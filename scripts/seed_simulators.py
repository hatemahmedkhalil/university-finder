"""Run once on startup to seed TOEFL and Cambridge exam content."""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from app.database import SessionLocal
from app.models.simulator import ExamPassage
from app.routers.simulator import _seed_toefl, _seed_cambridge

db = SessionLocal()
try:
    count = db.query(ExamPassage).count()
    if count > 0:
        print(f"[seed] Already seeded ({count} passages). Skipping.")
    else:
        print("[seed] Seeding TOEFL and Cambridge content...")
        _seed_toefl(db)
        _seed_cambridge(db)
        db.commit()
        print("[seed] Done.")
except Exception as e:
    print(f"[seed] Error: {e}")
    db.rollback()
finally:
    db.close()
