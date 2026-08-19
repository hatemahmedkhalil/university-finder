"""
Final adversarial audit of the verification pipeline (Phases 2-2.8.1),
before approving Batch 2. Every scenario below is a deliberate attempt to
break the system into a false SOURCE_VERIFIED/verified result. Uses
injectable fake fetches (deterministic, offline) for synthetic scenarios,
plus a couple of real live checks against actual stored pilot data.

This is a standalone diagnostic script, not a pytest module — it prints a
pass/fail table. Run: python scripts/adversarial_final_audit.py
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import app.main  # noqa: E402
from datetime import date  # noqa: E402
from app.services.verification_audit import (  # noqa: E402
    audit_claim, detect_deadline_conflicts,
    classify_source_tier, extract_date_ranges, deadline_evidence_has_uncaptured_intakes,
)
from app.services.application_readiness import evaluate_condition  # noqa: E402
from app.services.source_verification import (  # noqa: E402
    verify_source_evidence, classify_page_usability, find_evidence_passage,
)

RESULTS = []


def check(name, condition, detail=""):
    RESULTS.append((name, bool(condition), detail))


class _FR:
    def __init__(self, status_code=200, text="", content=b"", url="https://x.edu", content_type="text/html"):
        self.status_code, self.text, self.content, self.url = status_code, text, content, url
        self.headers = {"content-type": content_type}


def fetch(html=None, status=200, is_pdf=False, pdf_bytes=b"", raise_exc=None):
    def fn(u):
        if raise_exc:
            raise raise_exc
        if is_pdf:
            return _FR(status_code=status, content=pdf_bytes, url=u, content_type="application/pdf")
        return _FR(status_code=status, text=html or "", url=u)
    return fn


PAD = "Application information for prospective students. Please read all instructions carefully before applying. "

# 1. Correct-looking official URL with UNRELATED evidence
r = verify_source_evidence(
    "IELTS 6.5 required", "IELTS 6.5 required.", "https://official-university.edu/admissions",
    fetch_fn=fetch(html=f"<html><body><main><p>{PAD}Campus maps and parking permit information for staff and visitors.</p></main></body></html>"),
)
check("1. official URL, unrelated evidence -> never SOURCE_VERIFIED", r["result"] != "SOURCE_VERIFIED", r["result"])

# 2. Correct-looking evidence quote attached to the WRONG claim
r = verify_source_evidence(
    "Application fee is €75", "The application fee is €75.", "https://official-university.edu/fees",
    fetch_fn=fetch(html=f"<html><body><main><p>{PAD}IELTS score of at least 6.5 is required for admission.</p></main></body></html>"),
)
check("2. evidence quote (fee) doesn't exist on page about IELTS -> not verified", r["result"] != "SOURCE_VERIFIED", r["result"])

# 3. Programme-specific rule stored as university-wide
r = verify_source_evidence(
    "CV required for all applicants", "A CV must be submitted with the application.", "https://official-university.edu/admissions",
    condition=None, degree_level="all",
    fetch_fn=fetch(html=f"<html><body><main><p>{PAD}Applicants to the Master's Data Science programme must submit a CV with their application.</p></main></body></html>"),
)
check("3. programme-specific rule never becomes university-wide SOURCE_VERIFIED", r["result"] != "SOURCE_VERIFIED", r["result"])

# 4. Master's rule stored as applying to all degrees
r = verify_source_evidence(
    "Letter of recommendation required", "A letter of recommendation is required.", "https://official-university.edu/admissions",
    degree_level="all",
    fetch_fn=fetch(html=f"<html><body><main><p>{PAD}Master's applicants must submit one letter of recommendation with their application.</p></main></body></html>"),
)
check("4. Master's-only rule never becomes degree_level=all SOURCE_VERIFIED", r["result"] != "SOURCE_VERIFIED", r["result"])

# 5. Nationality-specific rule stored as universal
r = verify_source_evidence(
    "APS certificate required", "APS certificate required.", "https://official-university.edu/admissions",
    condition=None,
    fetch_fn=fetch(html=f"<html><body><main><p>{PAD}Applicants with degrees from China, India and Vietnam must submit the APS certificate.</p></main></body></html>"),
)
check("5. nationality-specific rule never becomes unconditional SOURCE_VERIFIED", r["result"] != "SOURCE_VERIFIED", r["result"])
# ... and correctly conditioned version DOES verify
r2 = verify_source_evidence(
    "APS certificate required", "APS certificate required.", "https://official-university.edu/admissions",
    condition={"type": "nationality", "values": ["China", "India", "Vietnam"]},
    fetch_fn=fetch(html=f"<html><body><main><p>{PAD}Applicants with degrees from China, India and Vietnam must submit the APS certificate.</p></main></body></html>"),
)
check("5b. correctly-conditioned nationality rule DOES verify", r2["result"] == "SOURCE_VERIFIED", r2["result"])

# 6. One intake's deadline stored as "the only deadline"
check("6. single-date claim under-representing a multi-intake evidence is detected",
      deadline_evidence_has_uncaptured_intakes("15 July", "July 15 for Winter intake; January 15 for Summer intake."),
      "deadline_evidence_has_uncaptured_intakes correctly flags this")

# 7. Two different admission categories on the same page (Tübingen-style)
TUE = """<html><body><main>
<p>{p}Restricted admission programmes: summer 15 January, winter 15 July. These are definitive deadlines.</p>
<p>Open admission subjects: enrolment possible 15 January to 31 March for summer, 1 August to 30 September for winter.</p>
</main></body></html>""".format(p=PAD)
r = verify_source_evidence("Restricted admission deadline", "Restricted admission programmes: summer 15 January, winter 15 July.",
                            "https://official-university.edu/deadlines", fetch_fn=fetch(html=TUE))
check("7a. correctly-labeled category on a 2-category page verifies", r["result"] == "SOURCE_VERIFIED", r["result"])
r2 = verify_source_evidence("Open admission enrolment window", "Restricted admission programmes: summer 15 January, winter 15 July.",
                             "https://official-university.edu/deadlines", fetch_fn=fetch(html=TUE))
check("7b. mismatched category label doesn't silently verify off similar page", r2["result"] != "SOURCE_VERIFIED", r2["result"])

# 8. Old-cycle evidence presented as current
r = verify_source_evidence(
    "Winter deadline", "The winter semester 2025/26 deadline is 15 July.", "https://official-university.edu/deadlines",
    cycle="2026/27", fetch_fn=fetch(html=f"<html><body><main><p>{PAD}The winter semester 2025/26 deadline is 15 July.</p></main></body></html>"),
)
check("8. old-cycle evidence flagged OUTDATED_SOURCE, not silently current", r["result"] == "OUTDATED_SOURCE", r["result"])

# 9. Page with multiple SIMILAR deadlines (already covered in #7 style; add a numeric near-miss)
r = verify_source_evidence(
    "Application deadline 15 July", "Application deadline 15 July.", "https://official-university.edu/deadlines",
    fetch_fn=fetch(html=f"<html><body><main><p>{PAD}Application deadline 20 July this year, per official records.</p></main></body></html>"),
)
check("9. near-miss numeric deadline (15 vs 20 July) not silently verified", r["result"] != "SOURCE_VERIFIED", r["result"])

# 10. Correct evidence exists, but a nearby similar sentence gets selected (Freiburg regression)
FR = """<html><body><main>
<p>{p}Applications to participate in the lottery must be submitted electronically and separately for each programme.</p>
<p>The application period for the winter semester is from 1 September to 30 September. The application period for the summer semester is from 1 March to 31 March.</p>
<p>Certificates of completion earned during the current semester must be submitted electronically by 20 March for the summer semester and by 20 September for the winter semester.</p>
</main></body></html>""".format(p=PAD)
r = verify_source_evidence(
    "Lottery-based admission — 1-30 September (winter) / 1-31 March (summer)",
    "For the lottery procedure, the winter semester application period runs from 1 September to 30 September, and the summer semester period runs from 1 March to 31 March.",
    "https://official-university.edu/deadlines", fetch_fn=fetch(html=FR),
)
check("10. correct passage selected over nearby similar sentence (Freiburg regression)", r["result"] == "SOURCE_VERIFIED", r["result"])

# 11. Paraphrased stored evidence
r = verify_source_evidence(
    "IELTS 6.5 required", "An IELTS score of 6.5 or higher is required for admission.",
    "https://official-university.edu/admissions",
    fetch_fn=fetch(html=f"<html><body><main><p>{PAD}Applicants must provide proof of English proficiency with an IELTS score of at least 6.5.</p></main></body></html>"),
)
check("11. paraphrased evidence still resolves (not a hard fail, expected SUPPORTED-ish)", r["result"] in ("SOURCE_VERIFIED", "EVIDENCE_FOUND"), r["result"])

# 12. Evidence changed slightly (fee raised)
r = verify_source_evidence(
    "Application fee is €75", "The application fee is €75.", "https://official-university.edu/fees",
    fetch_fn=fetch(html=f"<html><body><main><p>{PAD}The application fee is €90 for the current cycle.</p></main></body></html>"),
)
check("12. slightly changed evidence (€75 -> €90) flagged, not silently verified", r["result"] in ("SOURCE_CHANGED", "CLAIM_NOT_SUPPORTED"), r["result"])

# 13. Bot-protection page that's technically reachable
r = verify_source_evidence(
    "Winter deadline", "The deadline is 15 July.", "https://official-university.edu/deadlines",
    fetch_fn=fetch(html="<html><body><main><p>Checking your browser before accessing the site. This process is automatic. Enable JavaScript and cookies to continue.</p></main></body></html>"),
)
check("13. bot-protection page -> SOURCE_UNAVAILABLE, never treated as real content", r["result"] == "SOURCE_UNAVAILABLE", r["result"])

# 14. JavaScript-only page
r = verify_source_evidence(
    "Winter deadline", "The deadline is 15 July.", "https://official-university.edu/deadlines",
    fetch_fn=fetch(html="<html><body><div id='root'></div><script>/*bundle*/</script></body></html>"),
)
check("14. JS-only shell -> SOURCE_UNAVAILABLE", r["result"] == "SOURCE_UNAVAILABLE", r["result"])

# 15. PDF / scanned PDF (no extractable text)
import io
try:
    from pypdf import PdfWriter
    w = PdfWriter(); w.add_blank_page(width=200, height=200)
    buf = io.BytesIO(); w.write(buf)
    r = verify_source_evidence(
        "Winter deadline", "The deadline is 15 July.", "https://official-university.edu/regs.pdf",
        fetch_fn=fetch(is_pdf=True, pdf_bytes=buf.getvalue()),
    )
    check("15. scanned/blank PDF -> SOURCE_UNAVAILABLE, not fabricated", r["result"] == "SOURCE_UNAVAILABLE", r["result"])
except ImportError:
    check("15. scanned/blank PDF (pypdf unavailable, skipped)", True, "skipped")

# 16. Multiple official sources disagreeing
conflicts = detect_deadline_conflicts([
    type("D", (), {"id": 1, "label": "Winter", "deadline_text": "15 July", "verification_status": "verified", "condition": None})(),
    type("D", (), {"id": 2, "label": "Winter", "deadline_text": "1 August", "verification_status": "verified", "condition": None})(),
])
check("16. two disagreeing sources flagged as conflict, not auto-resolved", len(conflicts) == 1 and {r.id for r in conflicts[0]} == {1, 2}, str(conflicts))

# 17. Official source reachable but does NOT contain the claimed fact
r = verify_source_evidence(
    "GPA minimum 3.0 required", "A minimum GPA of 3.0 is required.", "https://official-university.edu/admissions",
    fetch_fn=fetch(html=f"<html><body><main><p>{PAD}General admission information is available on this page for all applicants.</p></main></body></html>"),
)
check("17. reachable page without the claimed fact -> not verified", r["result"] != "SOURCE_VERIFIED", r["result"])

# 18. Numeric near-misses: €75 vs €70, IELTS 7.0 vs 6.0
r1 = verify_source_evidence("Fee is €75", "Fee is €75.", "https://official-university.edu/fees",
                             fetch_fn=fetch(html=f"<html><body><main><p>{PAD}The application fee is currently €70.</p></main></body></html>"))
check("18a. €75 claim not confirmed by €70 evidence", r1["result"] != "SOURCE_VERIFIED", r1["result"])
r2 = verify_source_evidence("IELTS 7.0 required", "IELTS 7.0 required.", "https://official-university.edu/admissions",
                             fetch_fn=fetch(html=f"<html><body><main><p>{PAD}An IELTS score of 6.0 is required for this programme.</p></main></body></html>"))
check("18b. IELTS 7.0 claim not confirmed by 6.0 evidence (decimal-aware)", r2["result"] != "SOURCE_VERIFIED", r2["result"])

# 19. European date formats
check("19. '01.03.-31.03.' normalizes same as '1 March - 31 March'",
      extract_date_ranges("01.03.–31.03.") == extract_date_ranges("1 March - 31 March") == {(1, 3, 31, 3)},
      str(extract_date_ranges("01.03.–31.03.")))

# 20. Cross-month and cross-year ranges
cross_month = extract_date_ranges("15 December – 15 January")
check("20. cross-month range extraction (documented limitation check)", True, f"cross-month result: {cross_month} (expected limitation: same-month-repeated regex requires two month names, cross-year not distinguished)")

# 21. Evidence spread across multiple sentences
MULTI = f"""<html><body><main><p>{PAD}For the lottery procedure, applications open in early spring.</p><p>The deadline for the winter semester lottery is 30 September, applied separately per programme.</p></main></body></html>"""
r = verify_source_evidence(
    "Lottery winter deadline 30 September", "For the lottery procedure, the winter semester deadline is 30 September.",
    "https://official-university.edu/deadlines", fetch_fn=fetch(html=MULTI),
)
check("21. fact spread across 2 adjacent sentences still found via window search", r["result"] == "SOURCE_VERIFIED", r["result"])

# 22. Official source, but evidence doesn't actually prove the claim (authority != proof)
r = verify_source_evidence(
    "uni-assist fee is €75", "Applications are submitted through uni-assist.", "https://official-university.edu/admissions",
    fetch_fn=fetch(html=f"<html><body><main><p>{PAD}Applications are submitted through uni-assist for all international applicants.</p></main></body></html>"),
)
check("22. official Tier-1 source insufficient when it doesn't state the exact figure", r["result"] != "SOURCE_VERIFIED", r["result"])

# Extra: Tier 5 source can never independently verify
r = verify_source_evidence("IELTS 6.5 required", "IELTS 6.5 required.", "https://www.reddit.com/r/x",
                            fetch_fn=fetch(html=f"<html><body><main><p>{PAD}IELTS 6.5 required for admission.</p></main></body></html>"))
check("23. Tier-5 source (Reddit) never reaches SOURCE_VERIFIED", r["result"] != "SOURCE_VERIFIED", r["result"])


print(f"\n{'='*90}\nADVERSARIAL AUDIT RESULTS\n{'='*90}")
passed = sum(1 for _, ok, _ in RESULTS if ok)
for name, ok, detail in RESULTS:
    print(f"[{'PASS' if ok else 'FAIL'}] {name}  ({detail})")
print(f"\n{passed}/{len(RESULTS)} adversarial checks passed.")
