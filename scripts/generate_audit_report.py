"""
Owner-facing verification audit report generator.

Produces an independently-checkable Markdown report per university —
every claim is re-derived from stored evidence via audit_claim(), never
just echoing verification_status. Run for the Phase 3 pilot batch, or
pass --all for every university in the database.

Usage:
    python scripts/generate_audit_report.py                 # pilot batch (10 universities)
    python scripts/generate_audit_report.py --all            # every university
    python scripts/generate_audit_report.py --ids 1,3,4       # specific IDs

Output: one .md file per university in scripts/audit_reports/, plus a
combined summary printed to stdout.
"""
import os
import sys
import argparse

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import app.main  # noqa: E402 — registers all SQLAlchemy models
from app.database import SessionLocal  # noqa: E402
from app.models.university import University  # noqa: E402
from app.services.verification_audit import generate_university_audit_report, render_audit_report_markdown  # noqa: E402

PILOT_BATCH_IDS = [1, 3, 4, 9, 10, 18, 20, 21, 24, 35]
CURRENT_CYCLE = "2026/27"  # today's date is 2026-08-16 — winter 2026/27 is the live admissions cycle
OUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "audit_reports")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--all", action="store_true", help="Audit every university in the database")
    parser.add_argument("--ids", type=str, default=None, help="Comma-separated university IDs")
    args = parser.parse_args()

    db = SessionLocal()
    if args.all:
        unis = db.query(University).order_by(University.country, University.name).all()
    elif args.ids:
        ids = [int(x) for x in args.ids.split(",")]
        unis = db.query(University).filter(University.id.in_(ids)).order_by(University.name).all()
    else:
        unis = db.query(University).filter(University.id.in_(PILOT_BATCH_IDS)).order_by(University.name).all()

    os.makedirs(OUT_DIR, exist_ok=True)

    summary_rows = []
    all_problems = []
    for uni in unis:
        report = generate_university_audit_report(uni, current_cycle=CURRENT_CYCLE)
        md = render_audit_report_markdown(report)
        path = os.path.join(OUT_DIR, f"{uni.id}_{uni.name.replace('/', '-')}.md")
        with open(path, "w", encoding="utf-8") as f:
            f.write(md)

        cov = report["coverage"]
        summary_rows.append((uni.id, uni.name, cov["verified"], cov["partially_verified"],
                              cov["unverified"], cov["unknown"], cov["verification_coverage_pct"]))

        for section in ("requirements", "deadlines"):
            for r in report[section]:
                if r["audit_result"] not in ("SUPPORTED", "INSUFFICIENT_EVIDENCE"):
                    all_problems.append((uni.name, r["type"], r["claim"], r["audit_result"], r["reasons"]))

    print(f"\nGenerated {len(unis)} audit reports in {OUT_DIR}\n")
    print(f"{'ID':<5}{'University':<45}{'Ver':<5}{'Partial':<9}{'Unver':<8}{'Unk':<5}{'Coverage':<10}")
    for row in summary_rows:
        uid, name, v, pv, u, unk, pct = row
        print(f"{uid:<5}{name:<45}{v:<5}{pv:<9}{u:<8}{unk:<5}{(str(pct)+'%') if pct is not None else 'n/a':<10}")

    print(f"\nClaims flagged by independent audit (excluding expected INSUFFICIENT_EVIDENCE on unverified rows): {len(all_problems)}")
    for uni_name, claim_type, claim, result, reasons in all_problems:
        print(f"  [{result}] {uni_name} — {claim_type}: {claim}")
        for reason in reasons:
            print(f"      - {reason}")


if __name__ == "__main__":
    main()
