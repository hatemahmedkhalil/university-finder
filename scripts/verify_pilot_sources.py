"""
Phase 2.7 — runs the LIVE source verifier against every currently
verified/partially_verified claim in the 10-university pilot batch.

This makes real HTTP requests to the actual stored source_urls. It does
NOT modify the database — it only reports what the live source verifier
independently found, side by side with what's stored, so a human can
compare them and decide what (if anything) to change.

Usage: python scripts/verify_pilot_sources.py
"""
import os
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import app.main  # noqa: E402
from app.database import SessionLocal  # noqa: E402
from app.models.university import University  # noqa: E402
from app.services.verification_audit import generate_university_audit_report  # noqa: E402
from app.services.source_verification import verify_source_evidence  # noqa: E402

PILOT_BATCH_IDS = [1, 3, 4, 9, 10, 18, 20, 21, 24, 35]
CURRENT_CYCLE = "2026/27"


def main():
    db = SessionLocal()
    unis = db.query(University).filter(University.id.in_(PILOT_BATCH_IDS)).order_by(University.name).all()

    rows = []
    live_result_counts = {}
    for uni in unis:
        report = generate_university_audit_report(uni, current_cycle=CURRENT_CYCLE)
        for section in ("requirements", "deadlines"):
            for r in report[section]:
                if r["verification_status"] not in ("verified", "partially_verified"):
                    continue
                claim_kind = "deadline" if section == "deadlines" else "requirement"
                print(f"Checking live: {uni.name} — {r['claim']} ...", flush=True)
                try:
                    live = verify_source_evidence(
                        r["claim"], r["evidence_text"], r["source_url"],
                        condition=r.get("condition"), degree_level=r.get("degree_level"),
                        cycle=r.get("cycle"), university_website=uni.website,
                    )
                except Exception as e:
                    live = {"result": "SOURCE_UNAVAILABLE", "reasons": [f"Unhandled error during live check: {type(e).__name__}: {e}"],
                            "found_text": None, "source_tier": None, "checked_at": None, "final_url": None}
                live_result_counts[live["result"]] = live_result_counts.get(live["result"], 0) + 1
                rows.append({
                    "university": uni.name, "claim": r["claim"], "source_url": r["source_url"],
                    "stored_evidence": r["evidence_text"], "existing_audit_result": r["audit_result"],
                    "live_result": live["result"], "live_reasons": live["reasons"], "live_found_text": live["found_text"],
                    "source_tier": live["source_tier"],
                })
                time.sleep(0.5)  # be polite to real university servers

    print("\n\n" + "=" * 100)
    print("LIVE SOURCE VERIFICATION REPORT")
    print("=" * 100)
    for row in rows:
        print(f"\nUniversity: {row['university']}")
        print(f"Claim: {row['claim']}")
        print(f"Source URL: {row['source_url']}")
        print(f"Stored evidence: {row['stored_evidence']}")
        print(f"Existing (stored-data) audit result: {row['existing_audit_result']}")
        print(f"LIVE verification result: {row['live_result']}")
        print(f"Source tier: {row['source_tier']}")
        print(f"Live-found text: {row['live_found_text']}")
        for reason in row["live_reasons"]:
            print(f"  - {reason}")

    print("\n" + "=" * 100)
    print("SUMMARY")
    print("=" * 100)
    print(f"Total claims checked live: {len(rows)}")
    for result_name, count in sorted(live_result_counts.items()):
        print(f"  {result_name}: {count}")


if __name__ == "__main__":
    main()
