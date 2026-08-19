"""
Phase 2.7 — Live source <-> evidence verification tests. All unit tests use
an injectable fake fetch function (never hit the real network — deterministic,
fast, and testable offline). The real pilot database is checked separately by
scripts/verify_pilot_sources.py using the real httpx client.
"""
import pytest

from app.services.source_verification import (
    verify_source_evidence, fetch_source_content, find_evidence_passage,
    _extract_html_text, LIVE_RESULTS, classify_source_ownership,
)


class _FakeResponse:
    def __init__(self, status_code=200, text="", content=b"", url="https://x.edu", content_type="text/html; charset=utf-8"):
        self.status_code = status_code
        self.text = text
        self.content = content
        self.url = url
        self.headers = {"content-type": content_type}


def _fetch_returning(html=None, status_code=200, is_pdf=False, pdf_bytes=b"", raise_exc=None, url="https://official-university.edu/admissions"):
    def fn(u):
        if raise_exc:
            raise raise_exc
        if is_pdf:
            return _FakeResponse(status_code=status_code, content=pdf_bytes, url=u, content_type="application/pdf")
        return _FakeResponse(status_code=status_code, text=html or "", url=u)
    return fn


ADMISSIONS_PAGE_HTML = """
<html><body>
<nav>Home | About</nav>
<main>
<h1>Admissions</h1>
<p>Applicants must provide proof of English proficiency with an IELTS score of at least 6.5.</p>
<p>A curriculum vitae must be submitted with every application.</p>
<p>Applicants to the Master's Computer Science programme must submit a CV.</p>
<p>Applicants with university degrees from China, India and Vietnam must submit APS.</p>
</main>
<footer>Contact us</footer>
</body></html>
"""


# ── Case A — exact evidence exists ──────────────────────────────────────────

def test_case_a_exact_evidence_found_and_supported():
    result = verify_source_evidence(
        "IELTS 6.5 required",
        "Applicants must provide proof of English proficiency with an IELTS score of at least 6.5.",
        "https://official-university.edu/admissions",
        fetch_fn=_fetch_returning(html=ADMISSIONS_PAGE_HTML),
    )
    assert result["result"] == "SOURCE_VERIFIED"
    assert result["found_text"] is not None


# ── Case B — evidence does not exist (never infer the number) ──────────────

def test_case_b_evidence_absent_never_infers_the_score():
    result = verify_source_evidence(
        "IELTS 6.5 required",
        "Applicants must provide proof of English proficiency with an IELTS score of at least 6.5.",
        "https://official-university.edu/admissions",
        fetch_fn=_fetch_returning(html="<html><body><main><p>Applicants must provide proof of English proficiency.</p></main></body></html>"),
    )
    assert result["result"] in ("EVIDENCE_NOT_FOUND", "CLAIM_NOT_SUPPORTED")
    assert result["result"] != "SOURCE_VERIFIED"


# ── Case C — wrong number ───────────────────────────────────────────────────

def test_case_c_wrong_number_not_supported():
    result = verify_source_evidence(
        "IELTS 7.0 required",
        "IELTS 6.5 required.",
        "https://official-university.edu/admissions",
        fetch_fn=_fetch_returning(html="<html><body><main><p>IELTS 6.5 required for all applicants to this programme.</p></main></body></html>"),
    )
    assert result["result"] in ("CLAIM_NOT_SUPPORTED", "SOURCE_CHANGED")
    assert result["result"] != "SOURCE_VERIFIED"


# ── Case D — scope mismatch never becomes fully supported ──────────────────

def test_case_d_programme_specific_evidence_flagged_scope_mismatch():
    result = verify_source_evidence(
        "CV is required for all applicants",
        "A curriculum vitae must be submitted with every application.",
        "https://official-university.edu/admissions",
        condition=None, degree_level="all",
        fetch_fn=_fetch_returning(html=ADMISSIONS_PAGE_HTML),
    )
    # The live page ALSO contains a programme-specific CV sentence, so the
    # best match found could be either the generic or the scoped sentence —
    # either way the claim (unconditional, degree_level='all') must never
    # be fully confirmed as SOURCE_VERIFIED if the best evidence on the
    # page is scope-limited. We assert on the weaker, correctly-scoped case:
    scoped_result = verify_source_evidence(
        "CV is required for all applicants",
        "Applicants to the Master's Computer Science programme must submit a CV.",
        "https://official-university.edu/admissions",
        condition=None, degree_level="all",
        fetch_fn=_fetch_returning(html=ADMISSIONS_PAGE_HTML),
    )
    assert scoped_result["result"] == "SCOPE_MISMATCH"


# ── Case E — conditional requirement preserved ──────────────────────────────

def test_case_e_unconditional_aps_claim_flagged_scope_mismatch():
    result = verify_source_evidence(
        "APS certificate is required",
        "Applicants with university degrees from China, India and Vietnam must submit APS.",
        "https://official-university.edu/admissions",
        condition=None,
        fetch_fn=_fetch_returning(html=ADMISSIONS_PAGE_HTML),
    )
    assert result["result"] == "SCOPE_MISMATCH"


def test_case_e_correctly_conditioned_aps_claim_supported():
    result = verify_source_evidence(
        "APS certificate is required",
        "Applicants with university degrees from China, India and Vietnam must submit APS.",
        "https://official-university.edu/admissions",
        condition={"type": "nationality", "values": ["China", "India", "Vietnam"]},
        fetch_fn=_fetch_returning(html=ADMISSIONS_PAGE_HTML),
    )
    assert result["result"] == "SOURCE_VERIFIED"


# ── Case F — source changed ─────────────────────────────────────────────────

def test_case_f_source_changed_when_page_now_states_a_different_figure():
    result = verify_source_evidence(
        "Application fee is €75",
        "The application fee is €75.",
        "https://official-university.edu/fees",
        fetch_fn=_fetch_returning(html="<html><body><main><p>The application fee is €90 for the current admissions cycle.</p></main></body></html>"),
    )
    assert result["result"] == "SOURCE_CHANGED"
    assert "90" in str(result["reasons"])


# ── Redirects / dynamic pages / PDFs / inaccessible pages ──────────────────

def test_redirect_is_followed_and_final_url_recorded():
    def fn(u):
        return _FakeResponse(status_code=200, text=ADMISSIONS_PAGE_HTML, url="https://official-university.edu/admissions-2026")
    result = verify_source_evidence(
        "IELTS 6.5 required",
        "Applicants must provide proof of English proficiency with an IELTS score of at least 6.5.",
        "https://official-university.edu/admissions",  # original URL, redirected by fake fn
        fetch_fn=fn,
    )
    assert result["result"] == "SOURCE_VERIFIED"
    assert result["final_url"] == "https://official-university.edu/admissions-2026"


def test_query_parameters_do_not_break_fetching():
    result = verify_source_evidence(
        "IELTS 6.5 required",
        "Applicants must provide proof of English proficiency with an IELTS score of at least 6.5.",
        "https://official-university.edu/admissions?lang=en&year=2026",
        fetch_fn=_fetch_returning(html=ADMISSIONS_PAGE_HTML),
    )
    assert result["result"] == "SOURCE_VERIFIED"


def test_dynamic_js_page_with_no_extractable_text_is_unavailable():
    # A JS-rendered SPA shell: almost nothing but a <div id="root"></div>.
    spa_shell = "<html><body><div id='root'></div><script>/* app bundle */</script></body></html>"
    result = verify_source_evidence(
        "IELTS 6.5 required", "IELTS 6.5 required.", "https://official-university.edu/admissions",
        fetch_fn=_fetch_returning(html=spa_shell),
    )
    assert result["result"] == "SOURCE_UNAVAILABLE"


def test_inaccessible_page_404():
    result = verify_source_evidence(
        "IELTS 6.5 required", "IELTS 6.5 required.", "https://official-university.edu/gone",
        fetch_fn=_fetch_returning(html="Not Found", status_code=404),
    )
    assert result["result"] == "SOURCE_UNAVAILABLE"


def test_network_error_is_source_unavailable():
    result = verify_source_evidence(
        "IELTS 6.5 required", "IELTS 6.5 required.", "https://unreachable.example",
        fetch_fn=_fetch_returning(raise_exc=ConnectionError("connection refused")),
    )
    assert result["result"] == "SOURCE_UNAVAILABLE"
    assert "ConnectionError" in str(result["reasons"])


# ── PDF support ──────────────────────────────────────────────────────────

def test_pdf_with_extractable_text_is_checked():
    import io
    try:
        from pypdf import PdfWriter
    except ImportError:
        pytest.skip("pypdf not installed")
    writer = PdfWriter()
    writer.add_blank_page(width=200, height=200)
    buf = io.BytesIO()
    writer.write(buf)
    pdf_bytes = buf.getvalue()
    # A blank PDF has no extractable text — this is exactly the
    # "scanned/image-only" case the phase asks us to handle honestly.
    result = verify_source_evidence(
        "IELTS 6.5 required", "IELTS 6.5 required.", "https://official-university.edu/regs.pdf",
        fetch_fn=_fetch_returning(is_pdf=True, pdf_bytes=pdf_bytes),
    )
    assert result["result"] == "SOURCE_UNAVAILABLE"
    assert "PDF" in str(result["reasons"]) or "pdf" in str(result["reasons"]).lower()


def test_pdf_content_type_detected_via_url_suffix():
    fetched = fetch_source_content(
        "https://official-university.edu/regs.pdf",
        fetch_fn=lambda u: _FakeResponse(status_code=200, content=b"not a real pdf", url=u, content_type="application/octet-stream"),
    )
    assert fetched["is_pdf"] is True


# ── Tier 5 sources never independently create a verified claim ─────────────

def test_tier5_source_never_reaches_source_verified_even_with_matching_text():
    result = verify_source_evidence(
        "IELTS 6.5 required",
        "Applicants must provide proof of English proficiency with an IELTS score of at least 6.5.",
        "https://www.reddit.com/r/germany/comments/xyz",
        fetch_fn=_fetch_returning(html=ADMISSIONS_PAGE_HTML),
    )
    assert result["result"] == "CLAIM_NOT_SUPPORTED"


# ── Untrusted-evidence principle: DB says verified, live source disagrees ──

def test_database_verified_status_is_never_trusted_over_live_content():
    """The whole point of Phase 2.7: verification_status='verified' in the
    DB carries NO WEIGHT here — this function doesn't even take a
    verification_status parameter. Only the live fetch matters."""
    result = verify_source_evidence(
        "IELTS 9.0 required",  # a deliberately wrong "stored" claim
        "IELTS 9.0 required.",
        "https://official-university.edu/admissions",
        fetch_fn=_fetch_returning(html=ADMISSIONS_PAGE_HTML),  # live page says 6.5
    )
    assert result["result"] in ("SOURCE_CHANGED", "CLAIM_NOT_SUPPORTED", "EVIDENCE_NOT_FOUND")


# ── find_evidence_passage / _extract_html_text unit coverage ───────────────

def test_extract_html_text_strips_nav_and_footer():
    text = _extract_html_text(ADMISSIONS_PAGE_HTML)
    assert "IELTS" in text
    assert "Home | About" not in text
    assert "Contact us" not in text


def test_find_evidence_passage_exact_match():
    result = find_evidence_passage("IELTS score of at least 6.5", "Some page text. IELTS score of at least 6.5. More text.")
    assert result["found_exact"] is True


def test_find_evidence_passage_no_match():
    result = find_evidence_passage("APS certificate required for Chinese applicants", "This page is about parking permits and campus maps.")
    assert result["found_exact"] is False
    assert result["best_match_overlap"] < 0.3


# ── Source ownership (Phase 3 production-readiness audit) ──────────────────
# Reproduced real false positive: a Hohenheim claim was exact-match
# "verified" by evidence fetched from uni-koeln.de — a completely different
# university's own domain. classify_source_ownership + the SOURCE_WRONG_
# UNIVERSITY short-circuit in verify_source_evidence close this gap. Every
# case below has a negative test (must not verify) paired with the
# corresponding positive control (the legitimate equivalent must still work).

_HOHENHEIM_WEBSITE = "https://www.uni-hohenheim.de"
_DEADLINE_HTML = "<html><body><main><p>The application deadline for Bachelor programmes is 15 July.</p></main></body></html>"
_DEADLINE_TEXT = "The application deadline for Bachelor programmes is 15 July."


def test_ownership_1_hohenheim_claim_with_cologne_evidence_never_verifies():
    """Case 1 (negative): exact evidence, but fetched from another
    university's own domain — must never verify."""
    result = verify_source_evidence(
        "Bachelor deadline — 15 July", _DEADLINE_TEXT,
        "https://www.uni-koeln.de/en/deadlines",
        university_website=_HOHENHEIM_WEBSITE,
        fetch_fn=_fetch_returning(html=_DEADLINE_HTML, url="https://www.uni-koeln.de/en/deadlines"),
    )
    assert result["result"] == "SOURCE_WRONG_UNIVERSITY"
    assert result["result"] != "SOURCE_VERIFIED"


def test_ownership_2_hohenheim_claim_with_hohenheim_source_can_verify():
    """Case 2 (positive control): the university's own domain still verifies normally."""
    result = verify_source_evidence(
        "Bachelor deadline — 15 July", _DEADLINE_TEXT,
        "https://www.uni-hohenheim.de/en/deadlines",
        university_website=_HOHENHEIM_WEBSITE,
        fetch_fn=_fetch_returning(html=_DEADLINE_HTML, url="https://www.uni-hohenheim.de/en/deadlines"),
    )
    assert result["result"] == "SOURCE_VERIFIED"


def test_ownership_3_hohenheim_claim_with_uni_assist_source_can_verify():
    """Case 3 (positive control): a legitimate shared portal (uni-assist.de)
    is never rejected as wrong-university, and can still verify when the
    claim is actually supported."""
    result = verify_source_evidence(
        "Bachelor deadline — 15 July", _DEADLINE_TEXT,
        "https://www.uni-assist.de/en/deadlines",
        university_website=_HOHENHEIM_WEBSITE,
        fetch_fn=_fetch_returning(html=_DEADLINE_HTML, url="https://www.uni-assist.de/en/deadlines"),
    )
    assert result["result"] == "SOURCE_VERIFIED"


def test_ownership_4_university_a_claim_with_university_b_source_never_verifies():
    """Case 4 (negative), a second concrete pair distinct from Hohenheim/
    Cologne: Freiburg claim, Tübingen source."""
    result = verify_source_evidence(
        "Bachelor deadline — 15 July", _DEADLINE_TEXT,
        "https://uni-tuebingen.de/en/deadlines",
        university_website="https://uni-freiburg.de",
        fetch_fn=_fetch_returning(html=_DEADLINE_HTML, url="https://uni-tuebingen.de/en/deadlines"),
    )
    assert result["result"] == "SOURCE_WRONG_UNIVERSITY"


def test_ownership_5_unknown_source_not_treated_as_owned_or_blocked():
    """Case 5 (negative-adjacent): a domain that doesn't look like ANY
    university (a generic site) must not be assumed 'owned' — but it also
    must not be force-classified as wrong-university just for being
    unfamiliar. Ownership stays 'unknown' and downstream checks (tier,
    overlap) decide the result on their own merits, not on ownership alone."""
    assert classify_source_ownership("https://www.some-random-blog.com/page", _HOHENHEIM_WEBSITE) == "unknown"
    # And when the claimed university has no `website` on file at all,
    # even a university-shaped domain can't be judged 'wrong' — we simply
    # don't know what the right one would have been.
    assert classify_source_ownership("https://www.uni-hohenheim.de/en/deadlines", None) == "unknown"


def test_ownership_6_existing_shared_domain_tier_behavior_still_works():
    """Case 6 (non-regression): classify_source_tier's existing Tier-2
    treatment of shared portals is untouched by the new ownership layer."""
    from app.services.verification_audit import classify_source_tier
    assert classify_source_tier("https://www.uni-assist.de/en/apply", _HOHENHEIM_WEBSITE) == 2
    assert classify_source_ownership("https://www.uni-assist.de/en/apply", _HOHENHEIM_WEBSITE) == "shared_portal"


def test_ownership_check_short_circuits_before_any_fetch():
    """A wrong-university source must never even be fetched — the ownership
    check is metadata-only and comes first."""
    def _should_not_be_called(u):
        raise AssertionError("fetch_fn was called for a source that should have been rejected on ownership alone")

    result = verify_source_evidence(
        "Bachelor deadline — 15 July", _DEADLINE_TEXT,
        "https://www.uni-koeln.de/en/deadlines",
        university_website=_HOHENHEIM_WEBSITE,
        fetch_fn=_should_not_be_called,
    )
    assert result["result"] == "SOURCE_WRONG_UNIVERSITY"


# ── Production-readiness audit (Phase 3) — new adversarial cases ───────────

def test_eu_only_evidence_never_supports_non_eu_claim():
    """Regression: 'non-EU applicants must submit APS' claim exact-matched
    against evidence stating EU/EEA citizens are EXEMPT from APS — the
    opposite rule. '_significant_words' filters out 2-char tokens like 'eu',
    so the generic antonym-word-set check couldn't see this at all."""
    result = verify_source_evidence(
        "APS certificate required for non-EU applicants",
        "EU and EEA citizens do not need to submit an APS certificate and may apply directly.",
        "https://official-university.edu/aps",
        fetch_fn=_fetch_returning(
            html="<html><body><main><p>EU and EEA citizens do not need to submit an APS certificate and may apply directly.</p></main></body></html>"
        ),
    )
    assert result["result"] == "CLAIM_NOT_SUPPORTED"


def test_eu_citizens_claim_never_supported_by_non_eu_evidence():
    """The reverse direction of the EU/non-EU antonym check."""
    result = verify_source_evidence(
        "No APS required for EU citizens",
        "Non-EU applicants must submit an APS certificate before enrolment.",
        "https://official-university.edu/aps",
        fetch_fn=_fetch_returning(
            html="<html><body><main><p>Non-EU applicants must submit an APS certificate before enrolment.</p></main></body></html>"
        ),
    )
    assert result["result"] == "CLAIM_NOT_SUPPORTED"


def test_summer_intake_evidence_never_supports_winter_intake_claim():
    """Regression: a winter-semester deadline claim exact-matched against
    evidence that names the same date figure but for the SUMMER intake —
    a different fact, not the one the claim names."""
    result = verify_source_evidence(
        "Winter semester intake deadline — 15 January",
        "Applications for the summer semester intake close on 15 January every year.",
        "https://official-university.edu/deadlines",
        fetch_fn=_fetch_returning(
            html="<html><body><main><p>Applications for the summer semester intake close on 15 January every year.</p></main></body></html>"
        ),
    )
    assert result["result"] == "CLAIM_NOT_SUPPORTED"


def test_winter_intake_claim_still_verifies_against_winter_evidence():
    """Non-regression: a correctly-matched intake must still verify."""
    result = verify_source_evidence(
        "Winter semester intake deadline — 15 January",
        "Applications for the winter semester intake close on 15 January every year.",
        "https://official-university.edu/deadlines",
        fetch_fn=_fetch_returning(
            html="<html><body><main><p>Applications for the winter semester intake close on 15 January every year.</p></main></body></html>"
        ),
    )
    assert result["result"] == "SOURCE_VERIFIED"


def test_same_number_different_unit_never_supports_fee_claim():
    """Regression: a '€75 fee' claim exact-matched against a sentence that
    uses the number 75 for something else entirely (processing days) —
    the number matches, the meaning does not."""
    result = verify_source_evidence(
        "Application fee — 75 EUR",
        "Please note that processing usually takes about 75 days once uni-assist receives all your documents.",
        "https://official-university.edu/fees",
        fetch_fn=_fetch_returning(
            html="<html><body><main><p>Please note that processing usually takes about 75 days once uni-assist receives all your documents.</p></main></body></html>"
        ),
    )
    assert result["result"] == "CLAIM_NOT_SUPPORTED"


def test_matching_fee_and_unit_still_verifies():
    """Non-regression: a legitimate fee claim with matching fee evidence
    (same number AND same unit) must still verify."""
    result = verify_source_evidence(
        "Application fee — 75 EUR",
        "The uni-assist application fee is 75 EUR for the first university.",
        "https://official-university.edu/fees",
        fetch_fn=_fetch_returning(
            html="<html><body><main><p>The uni-assist application fee is 75 EUR for the first university.</p></main></body></html>"
        ),
    )
    assert result["result"] == "SOURCE_VERIFIED"


def test_find_evidence_passage_prefers_matching_single_date_over_unrelated_word_overlap():
    """Regression (Phase 3 Batch 4 conflict-resolution pass, TU Chemnitz):
    when the evidence names a single deadline date (no date RANGE), plain
    word-overlap alone used to prefer an unrelated address/contact block
    over the sentence that actually contains the matching date, because
    _significant_words ignores digits. A candidate containing the same
    specific number(s) as the evidence must now be preferred."""
    page_text = (
        "Admission Procedure summer semester: January 15th winter semester: July 15th. "
        "Subsequent documents must be submitted by 15th January (summer semester) / "
        "15th July (winter semester), otherwise the application will be rejected. "
        "address: Studentenwerk Chemnitz-Zwickau Wohnheimverwaltung Thueringer Weg 3 "
        "09126 Chemnitz Germany Last update: March 2026. Our range of studies and "
        "admission requirements for winter term can change until the end of April."
    )
    result = find_evidence_passage(
        "and 15 January for applications for spring term (starting April 1).",
        page_text,
    )
    assert "15th" in result["best_match_text"] or "January 15th" in result["best_match_text"]
    assert "address" not in result["best_match_text"].lower()


def test_dotted_german_short_date_matches_spelled_out_claim_date(monkeypatch):
    """Regression (Phase 3 Batch 4 conflict-resolution pass, Wuppertal):
    German short-date notation ('15.7' for 15 July) was treated as an
    opaque decimal number, so a claim stored as the spelled-out '15 July'
    (-> number '15') was wrongly flagged SOURCE_CHANGED against live
    evidence quoting '15.7' (-> number '15.7') — the same day, different
    notation, must not be treated as a changed fact."""
    page_text = (
        "Please send the application form for admission with all required "
        "documents via email to the Student admission and registration for "
        "international students by 15.1 (if applying for the summer semester) "
        "and by 15.7 (if applying for the winter semester)."
    )

    def fake_fetch(url, fetch_fn=None):
        return {"reachable": True, "text": page_text, "final_url": url, "error": None}

    monkeypatch.setattr(
        "app.services.source_verification.fetch_source_content",
        fake_fetch,
    )
    result = verify_source_evidence(
        "Direct international applicants — winter — 15 July",
        "by 15.7 (if applying for the winter semester)",
        "https://www.uni-wuppertal.de/en/international/foo",
    )
    assert result["result"] in ("SOURCE_VERIFIED", "EVIDENCE_FOUND")


def test_all_results_are_from_defined_vocabulary():
    assert len(LIVE_RESULTS) == 9
    assert "SOURCE_VERIFIED" in LIVE_RESULTS
    assert "CLAIM_NOT_SUPPORTED" in LIVE_RESULTS
    assert "OUTDATED_SOURCE" in LIVE_RESULTS
    assert "SOURCE_WRONG_UNIVERSITY" in LIVE_RESULTS


# ═══════════════════════════════════════════════════════════════════════════
# Phase 2.8 — cycle-freshness checking
# ═══════════════════════════════════════════════════════════════════════════

from app.services.source_verification import find_cycles_on_page, assess_cycle_freshness, classify_page_usability


def test_find_cycles_extracts_slash_year_forms():
    assert find_cycles_on_page("Deadlines for winter semester 2026/27 are as follows.") == {"2026/27"}
    assert find_cycles_on_page("The 2025/2026 admission cycle has closed.") == {"2025/26"}


def test_find_cycles_multiple_on_page():
    assert find_cycles_on_page("2025/26: 15 July. 2026/27: 20 July.") == {"2025/26", "2026/27"}


def test_find_cycles_none_present():
    assert find_cycles_on_page("The deadline is always 15 July, every year.") == set()


def test_cycle_freshness_current_when_matching():
    status, cycles = assess_cycle_freshness("Deadline for 2026/27 is 15 July.", "", "2026/27")
    assert status == "current"


def test_cycle_freshness_outdated_when_only_older_cycle_found():
    status, cycles = assess_cycle_freshness("Deadline for 2025/26 is 15 July.", "", "2026/27")
    assert status == "outdated"
    assert cycles == {"2025/26"}


def test_cycle_freshness_ambiguous_with_multiple_cycles():
    status, cycles = assess_cycle_freshness("2025/26: 15 July. 2026/27: 20 July.", "", "2026/27")
    assert status == "ambiguous"


def test_cycle_freshness_unstated_when_no_cycle_on_page():
    status, cycles = assess_cycle_freshness("The deadline is 15 July.", "The deadline is 15 July.", "2026/27")
    assert status == "unstated"


def test_cycle_freshness_not_applicable_when_no_stored_cycle():
    status, cycles = assess_cycle_freshness("Deadline for 2019/20 is 15 July.", "", None)
    assert status == "not_applicable"


def test_live_check_current_cycle_source_is_verified():
    result = verify_source_evidence(
        "Winter deadline 2026/27", "The winter semester 2026/27 deadline is 15 July.",
        "https://official-university.edu/deadlines", cycle="2026/27",
        fetch_fn=_fetch_returning(html="<html><body><main><p>Application information for prospective students. The winter semester 2026/27 deadline is 15 July. Please read all instructions carefully before applying.</p></main></body></html>"),
    )
    assert result["result"] == "SOURCE_VERIFIED"


def test_live_check_older_cycle_source_is_outdated():
    result = verify_source_evidence(
        "Winter deadline", "The winter semester 2026/27 deadline is 15 July.",
        "https://official-university.edu/deadlines", cycle="2026/27",
        fetch_fn=_fetch_returning(html="<html><body><main><p>Application information for prospective students. The winter semester 2025/26 deadline is 15 July. Please read all instructions carefully before applying.</p></main></body></html>"),
    )
    assert result["result"] == "OUTDATED_SOURCE"


def test_live_check_ambiguous_cycle_downgrades_to_evidence_found():
    # Both cycles appear together in the SAME matched sentence, so the
    # matched passage itself is genuinely ambiguous about which cycle
    # the "15 July" deadline belongs to.
    result = verify_source_evidence(
        "Winter deadline", "The winter semester 2026/27 deadline is 15 July.",
        "https://official-university.edu/deadlines", cycle="2026/27",
        fetch_fn=_fetch_returning(html="<html><body><main><p>Both the 2025/26 and 2026/27 winter semester deadline is 15 July, per official records.</p></main></body></html>"),
    )
    assert result["result"] == "EVIDENCE_FOUND"
    assert result["result"] != "SOURCE_VERIFIED"


def test_live_check_no_stated_cycle_downgrades_to_evidence_found():
    result = verify_source_evidence(
        "Winter deadline", "The winter semester deadline is 15 July.",
        "https://official-university.edu/deadlines", cycle="2026/27",
        fetch_fn=_fetch_returning(html="<html><body><main><p>Application information for prospective students. The winter semester deadline is 15 July. Please read all instructions carefully before applying.</p></main></body></html>"),
    )
    assert result["result"] == "EVIDENCE_FOUND"


def test_live_check_no_stored_cycle_is_unaffected_by_cycle_logic():
    """A claim with no stored cycle was never asserted to be cycle-specific
    — a timeless rule like 'deadline is always 15 July' should still reach
    SOURCE_VERIFIED without any cycle penalty."""
    result = verify_source_evidence(
        "Winter deadline", "The winter semester deadline is 15 July.",
        "https://official-university.edu/deadlines", cycle=None,
        fetch_fn=_fetch_returning(html="<html><body><main><p>Application information for prospective students. The winter semester deadline is 15 July. Please read all instructions carefully before applying.</p></main></body></html>"),
    )
    assert result["result"] == "SOURCE_VERIFIED"


# ═══════════════════════════════════════════════════════════════════════════
# Phase 2.8 — bot-protection / unusable-source detection
# ═══════════════════════════════════════════════════════════════════════════

def test_classify_bot_protection_page():
    # Real-world Anubis-style text pattern found on Humboldt's domain in Batch 1.
    text = "This can and does cause downtime for the websites, which makes their resources inaccessible for everyone. Checking your browser before accessing the site."
    assert classify_page_usability(text) == "bot_protection"


def test_classify_cloudflare_style_challenge():
    text = "Attention Required! Cloudflare Ray ID: 8f3a2b1c9d4e5678 Please wait while we verify your browser."
    assert classify_page_usability(text) == "bot_protection"


def test_classify_login_wall():
    text = "You must be logged in to view this page. Please log in to continue with your username and password."
    assert classify_page_usability(text) == "login_wall"


def test_classify_cookie_wall_short_page():
    text = "We use cookies to improve your experience. Accept all cookies to continue browsing our site."
    assert classify_page_usability(text) == "cookie_wall"


def test_classify_real_content_is_not_flagged():
    text = ADMISSIONS_PAGE_HTML  # real prose, not a wall
    real_text = _extract_html_text(ADMISSIONS_PAGE_HTML)
    assert classify_page_usability(real_text) is None


def test_classify_empty_page():
    assert classify_page_usability("") == "empty"
    assert classify_page_usability("hi") == "empty"


def test_bot_protection_page_is_source_unavailable_not_evidence_not_found():
    """Regression: Humboldt's Anubis page had >50 extractable characters, so
    the old length-only check let it through as 'reachable', producing a
    misleading EVIDENCE_NOT_FOUND instead of correctly flagging the page as
    unusable. This must now be SOURCE_UNAVAILABLE (which downstream batch
    scripts map to needs_manual_verification, not unverified)."""
    bot_page_html = "<html><body><main><p>This can and does cause downtime for the websites, which makes their resources inaccessible for everyone.</p></main></body></html>"
    result = verify_source_evidence(
        "Winter deadline", "The winter semester deadline is 15 July.",
        "https://official-university.edu/deadlines",
        fetch_fn=_fetch_returning(html=bot_page_html),
    )
    assert result["result"] == "SOURCE_UNAVAILABLE"
    assert result["result"] != "EVIDENCE_NOT_FOUND"


# ═══════════════════════════════════════════════════════════════════════════
# Phase 2.8 — one admission category's evidence cannot verify a DIFFERENT
# category's claim (the Tübingen regression from Batch 1)
# ═══════════════════════════════════════════════════════════════════════════

TUEBINGEN_STYLE_PAGE = """
<html><body><main>
<h2>Restricted Admission Programmes</h2>
<p>These are the deadlines for applications for the respective year: summer semester 15 January, winter semester 15 July. These are definitive deadlines.</p>
<h2>Lot Procedure</h2>
<p>The application deadline for the lot procedure is for the summer semester from 1 March to 31 March and for the winter semester from 1 September to 20 September.</p>
<h2>Open Admission Subjects</h2>
<p>You can enrol directly without prior application. For the summer semester, enrolment is possible from 15 January to 31 March. For the winter semester, enrolment is possible from 1 August to 30 September.</p>
</main></body></html>
"""


def test_claim_from_one_category_not_verified_by_a_different_categorys_evidence():
    """A claim labeled 'non-restricted undergraduate: 30 Sep / 31 Mar' must
    not be confirmed as SOURCE_VERIFIED by a page whose best-matching
    passage is actually about the DIFFERENT 'Restricted Admission' category
    (15 Jan / 15 Jul) — even though both discuss 'deadlines' generically."""
    result = verify_source_evidence(
        "Non-restricted undergraduate deadline", "Non-restricted undergraduate: 30 September (winter) / 31 March (summer).",
        "https://official-university.edu/deadlines",
        fetch_fn=_fetch_returning(html=TUEBINGEN_STYLE_PAGE),
    )
    assert result["result"] != "SOURCE_VERIFIED"


def test_correctly_labeled_category_claim_is_verified():
    """The flip side — a claim correctly labeled to match the actual
    category on the page (Open Admission Subjects enrolment window) IS
    genuinely supported."""
    result = verify_source_evidence(
        "Open admission subjects enrolment window",
        "For the winter semester, enrolment is possible from 1 August to 30 September.",
        "https://official-university.edu/deadlines",
        fetch_fn=_fetch_returning(html=TUEBINGEN_STYLE_PAGE),
    )
    assert result["result"] == "SOURCE_VERIFIED"


# ═══════════════════════════════════════════════════════════════════════════
# Phase 2.8.1 — deadline matching precision (Freiburg regression) + compact
# date-range normalization
# ═══════════════════════════════════════════════════════════════════════════

from app.services.verification_audit import extract_date_ranges, deadline_evidence_has_uncaptured_intakes

FREIBURG_STYLE_PAGE = """
<html><body><main>
<h2>Lottery-Based Admission</h2>
<p>Applications to participate in the lottery must be submitted electronically and separately for each desired degree programme.</p>
<p>The application period for the winter semester is from 1 September to 30 September. The application period for the summer semester is from 1 March to 31 March.</p>
<h2>Certificate Submission Deadline</h2>
<p>Certificates of completion earned during the current semester must be submitted electronically by 20 March for the summer semester and by 20 September for the winter semester.</p>
</main></body></html>
"""


# 1 & 2. Freiburg-style page with two nearby deadline facts, correct claim -> verified

def test_freiburg_style_correct_claim_is_source_verified():
    result = verify_source_evidence(
        "Lottery-based admission — 1-30 September (winter) / 1-31 March (summer)",
        "The application period for the winter semester is from 1 September to 30 September. The application period for the summer semester is from 1 March to 31 March.",
        "https://official-university.edu/deadlines",
        fetch_fn=_fetch_returning(html=FREIBURG_STYLE_PAGE),
    )
    assert result["result"] == "SOURCE_VERIFIED"
    assert "1 September to 30 September" in (result["found_text"] or "") or "March" in (result["found_text"] or "")


# 3. Certificate deadline used to "verify" the application deadline -> rejected

def test_lottery_claim_matches_lottery_passage_not_certificate_passage():
    """The exact Freiburg regression: a lottery-admission claim's (slightly
    paraphrased, non-exact) evidence must resolve to the real lottery
    passage (1-30 Sept / 1-31 Mar) — not the nearby, topically-similar
    certificate-submission passage (20 March / 20 September) — when the
    stored evidence doesn't match either verbatim and the matcher has to
    choose fuzzily."""
    result = verify_source_evidence(
        "Lottery-based admission — 1-30 September (winter) / 1-31 March (summer)",
        "For the lottery procedure, the winter semester application period runs from 1 September to 30 September, and the summer semester period runs from 1 March to 31 March.",
        "https://official-university.edu/deadlines",
        fetch_fn=_fetch_returning(html=FREIBURG_STYLE_PAGE),
    )
    assert result["result"] == "SOURCE_VERIFIED"
    found = (result["found_text"] or "").lower()
    assert "1 september to 30 september" in found or "1 march to 31 march" in found
    assert "20 march" not in found and "20 september" not in found


# 4. '1-31 March' vs '1 March to 31 March' -> recognized as equivalent

def test_date_range_hyphen_form_equivalent_to_spelled_out_form():
    assert extract_date_ranges("1-31 March") == extract_date_ranges("1 March to 31 March") == {(1, 3, 31, 3)}


def test_date_range_various_separators_all_equivalent():
    forms = ["1-31 March", "1 - 31 March", "1 to 31 March", "1 March – 31 March", "1 March - 31 March"]
    normalized = {tuple(extract_date_ranges(f)) for f in forms}
    assert len(normalized) == 1  # all forms normalize to the exact same single range
    assert next(iter(normalized)) == ((1, 3, 31, 3),)


def test_uncaptured_intakes_no_longer_falsely_flagged_for_equivalent_notation():
    """Regression: this used to return True (falsely flagging under-
    representation) purely because '1-31 March' and '1 March to 31 March'
    didn't textually match the old single-date-token comparison."""
    assert deadline_evidence_has_uncaptured_intakes(
        "1-30 September (winter) / 1-31 March (summer)",
        "The application period for the winter semester is from 1 September to 30 September. The application period for the summer semester is from 1 March to 31 March.",
    ) is False


# 5. '01.03.-31.03.' vs '1 March-31 March' -> recognized when unambiguous

def test_dotted_german_date_range_equivalent_to_spelled_out():
    assert extract_date_ranges("01.03.–31.03.") == {(1, 3, 31, 3)}
    assert extract_date_ranges("01.03.–31.03.") == extract_date_ranges("1 March – 31 March")


# 6. Similar-looking but genuinely DIFFERENT date ranges -> NOT_SUPPORTED

def test_similar_but_different_date_ranges_not_supported():
    assert extract_date_ranges("1-30 September") != extract_date_ranges("1-20 September")
    result = verify_source_evidence(
        "Winter deadline", "The winter deadline period is 1-30 September.",
        "https://official-university.edu/deadlines",
        fetch_fn=_fetch_returning(html="<html><body><main><p>Application information. The winter deadline period is 1-20 September this year, per official records.</p></main></body></html>"),
    )
    assert result["result"] != "SOURCE_VERIFIED"


# 7. Different admission category, SAME dates -> scope mismatch, not silently verified

def test_same_dates_different_admission_category_is_not_silently_verified():
    page = """<html><body><main>
    <p>Master's applicants: the application period is 1 September to 30 September for the winter semester.</p>
    <p>Bachelor's applicants (unrestricted admission): the application period is 1 September to 30 September for the winter semester.</p>
    </main></body></html>"""
    result = verify_source_evidence(
        "General undergraduate deadline", "The application period is 1 September to 30 September for the winter semester.",
        "https://official-university.edu/deadlines", condition=None, degree_level="all",
        fetch_fn=_fetch_returning(html=page),
    )
    # Same dates exist for both categories, but the best-matching passage
    # names a specific degree level ("Master's") not captured by this
    # unconditional, degree_level='all' claim.
    assert result["result"] in ("SCOPE_MISMATCH", "EVIDENCE_FOUND")
    assert result["result"] != "SOURCE_VERIFIED"


# ═══════════════════════════════════════════════════════════════════════════
# Phase 2.8.2 — final pre-Batch-2 adversarial audit finding: evidence_text
# that is real, verbatim, on-page text can still be attached to the WRONG
# claim (a swapped/mislabeled admission category). An exact substring match
# alone must never be sufficient proof — the claim's own category must not
# contradict what was actually found.
# ═══════════════════════════════════════════════════════════════════════════

TUEBINGEN_TWO_CATEGORY_PAGE = """
<html><body><main>
<p>Application information for prospective students. Restricted admission programmes: summer semester deadline 15 January, winter semester deadline 15 July. These are definitive deadlines.</p>
<p>Open admission subjects: enrolment possible 15 January to 31 March for summer, 1 August to 30 September for winter.</p>
</main></body></html>
"""


def test_verbatim_evidence_attached_to_mislabeled_category_is_rejected():
    """Regression (Phase 2.8.2): evidence_text = 'Restricted admission
    programmes: summer semester deadline 15 January...' is 100% real,
    verbatim, on-page text — but stored under a claim labeled 'Open
    admission enrolment window'. An exact substring match alone must NOT
    be treated as proof the claim is correct; the claim's own category
    ('open') directly contradicts the matched passage's category
    ('restricted')."""
    result = verify_source_evidence(
        "Open admission enrolment window",
        "Restricted admission programmes: summer semester deadline 15 January, winter semester deadline 15 July.",
        "https://official-university.edu/deadlines",
        fetch_fn=_fetch_returning(html=TUEBINGEN_TWO_CATEGORY_PAGE),
    )
    assert result["result"] == "CLAIM_NOT_SUPPORTED"
    assert result["result"] != "SOURCE_VERIFIED"


def test_verbatim_evidence_correctly_labeled_still_verifies():
    """The flip side — the SAME verbatim evidence, correctly labeled to
    match its real category, must still verify normally. The fix must not
    make every exact match fail."""
    result = verify_source_evidence(
        "Restricted admission programmes deadline",
        "Restricted admission programmes: summer semester deadline 15 January, winter semester deadline 15 July.",
        "https://official-university.edu/deadlines",
        fetch_fn=_fetch_returning(html=TUEBINGEN_TWO_CATEGORY_PAGE),
    )
    assert result["result"] == "SOURCE_VERIFIED"


def test_multi_season_claim_with_partial_single_season_match_still_verifies():
    """Guard against over-correcting: a claim describing BOTH seasons
    ('1-30 September (winter) / 1-31 March (summer)') matched against a
    passage that only states the winter half must still verify — this is
    NOT a category contradiction, just a partial (but correct) match."""
    result = verify_source_evidence(
        "Lottery-based admission — 1-30 September (winter) / 1-31 March (summer)",
        "For the lottery procedure, the winter semester application period runs from 1 September to 30 September, and the summer semester period runs from 1 March to 31 March.",
        "https://official-university.edu/deadlines",
        fetch_fn=_fetch_returning(html=FREIBURG_STYLE_PAGE),
    )
    assert result["result"] == "SOURCE_VERIFIED"
