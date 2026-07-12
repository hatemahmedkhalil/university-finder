"""Update scholarship deadlines to future dates."""
import sys, os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal
from sqlalchemy import text

UPDATES = [
    ("DAAD Scholarship",                    "2026-11-15"),
    ("Erasmus+ Study Grant",                "2027-03-01"),
    ("Polish Government Scholarship",       "2026-12-01"),
    ("TUM Excellence Scholarship",          "2027-01-31"),
    ("Heidelberg Excellence Initiative Grant", "2027-02-28"),
    ("Austria OeAD Scholarship",            "2027-03-15"),
    ("TU Delft Holland Scholarship",        "2027-02-01"),
    ("UvA Amsterdam Merit Scholarship",     "2027-01-15"),
    ("NAWA Banach Scholarship",             "2027-04-30"),
]

db = SessionLocal()
try:
    for name, deadline in UPDATES:
        result = db.execute(
            text("UPDATE scholarships SET deadline = :deadline WHERE name = :name"),
            {"deadline": deadline, "name": name}
        )
        print(f"{'OK' if result.rowcount else 'MISS'} {name} -> {deadline}")
    db.commit()
    print("\nDone.")
finally:
    db.close()
