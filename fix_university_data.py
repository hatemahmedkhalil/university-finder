"""
University data corrections based on web research (July 2026).
Run with: python fix_university_data.py
"""
import os, sys
os.chdir(os.path.dirname(__file__))
sys.path.insert(0, ".")
os.environ.setdefault("DATABASE_URL", "postgresql://postgres:Aren%40%402%4017@localhost:5432/university_finder")
os.environ.setdefault("SECRET_KEY", "fix")

from sqlalchemy import create_engine, text
from urllib.parse import unquote

DATABASE_URL = "postgresql://postgres:Aren%40%402%4017@localhost:5432/university_finder"

engine = create_engine(DATABASE_URL)

corrections = [
    # 1. LMU Munich — deadline was "30 April" which is wrong; standard intl deadline is 15 July
    {
        "id": 1,
        "application_deadline": "Winter: 15 July; Summer: 15 January (via uni-assist or LMU portal)",
        "notes": "Verified: lmu.de — Bavaria: €0 tuition; semester fee ~€157/semester (2024/25); intl application deadline 15 July",
    },
    # 2. TUM — tuition is program-specific range, not a flat €4,000/year
    {
        "id": 2,
        "tuition_fee_eur": 4000,   # keeping minimum; range is 4k-6k bachelor, 8k-12k master
        "notes": "Verified: tum.de — Non-EU tuition from WS2024/25: Bachelor €4,000–6,000/year (€2,000–3,000/semester); Master €8,000–12,000/year (€4,000–6,000/semester); varies by program. Semester fee ~€144.",
    },
    # 10. FU Berlin — deadline was "1 June" which is wrong; standard is 15 July
    {
        "id": 10,
        "application_deadline": "Winter: 15 July; Summer: 15 January (via uni-assist)",
        "notes": "Verified: fu-berlin.de — Berlin: €0 tuition; semester fee ~€312; international deadline 15 July via uni-assist",
    },
    # 49. Wroclaw Medical University — PLN fee of 65,500 ≈ €15,400 not €14,000
    {
        "id": 49,
        "tuition_fee_eur": 15400,
        "notes": "Verified: admission.umw.edu.pl — English Medicine: 65,500 PLN/year (≈€15,400) for 2025/26; annual indexation applies",
    },
]

with engine.connect() as conn:
    for c in corrections:
        uni_id = c.pop("id")
        set_clauses = ", ".join(f"{k} = :{k}" for k in c)
        c["id"] = uni_id
        sql = text(f"UPDATE universities SET {set_clauses} WHERE id = :id")
        result = conn.execute(sql, c)
        print(f"  Updated university id={uni_id}: {result.rowcount} row(s) affected")
    conn.commit()
    print("\nAll corrections applied successfully.")
