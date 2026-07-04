"""
Clear all universities (and cascade-dependent data) from the database.
Run with: python clear_universities.py
"""
import sys
sys.path.insert(0, ".")

from app.database import SessionLocal
from app.models.university import University
from app.models.scholarship import Scholarship
from sqlalchemy import text

def clear():
    db = SessionLocal()
    try:
        uni_count = db.query(University).count()
        print(f"Found {uni_count} universities to delete.")

        # Nullify scholarship university links so general scholarships survive
        linked = db.query(Scholarship).filter(Scholarship.university_id.isnot(None)).count()
        db.query(Scholarship).filter(Scholarship.university_id.isnot(None)).update(
            {"university_id": None}, synchronize_session=False
        )
        print(f"Nullified university_id on {linked} university-specific scholarships.")

        # Delete all universities (cascades to favourites and applications)
        db.query(University).delete(synchronize_session=False)
        db.commit()

        # Reset the primary-key sequence
        db.execute(text("SELECT setval(pg_get_serial_sequence('universities', 'id'), 1, false)"))
        db.commit()

        print(f"Deleted {uni_count} universities. Sequence reset.")
        print("Done.")
    finally:
        db.close()

if __name__ == "__main__":
    clear()
