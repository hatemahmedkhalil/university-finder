"""
Tests enforcing "NO CLAIM WITHOUT PROOF" — the mechanical invariant behind
verification_status, both as pure-function unit tests and as a live scan
over the actual database (so a violation is a test failure, not something
that depends on anyone remembering to check).
"""
from datetime import date

from app.services.verification_audit import (
    audit_verification_fields, compute_verification_coverage,
    audit_claim, detect_deadline_conflicts, generate_university_audit_report,
    render_audit_report_markdown, classify_source_tier,
    deadline_evidence_has_uncaptured_intakes,
)


# ── audit_verification_fields — pure logic ──────────────────────────────────

def test_verified_requires_all_three_fields():
    assert audit_verification_fields("verified", "https://x.edu", "quote", date(2026, 1, 1)) == []


def test_verified_missing_source_url_is_a_violation():
    problems = audit_verification_fields("verified", None, "quote", date(2026, 1, 1))
    assert any("source_url" in p for p in problems)


def test_verified_missing_evidence_text_is_a_violation():
    problems = audit_verification_fields("verified", "https://x.edu", None, date(2026, 1, 1))
    assert any("evidence_text" in p for p in problems)


def test_verified_missing_verified_at_is_a_violation():
    problems = audit_verification_fields("verified", "https://x.edu", "quote", None)
    assert any("verified_at" in p for p in problems)


def test_verified_missing_everything_reports_all_three():
    problems = audit_verification_fields("verified", None, None, None)
    assert len(problems) == 3


def test_partially_verified_requires_evidence_text():
    assert audit_verification_fields("partially_verified", None, "quote", None) == []
    problems = audit_verification_fields("partially_verified", None, None, None)
    assert any("evidence_text" in p for p in problems)


def test_unverified_and_unknown_have_no_requirements():
    assert audit_verification_fields("unverified", None, None, None) == []
    assert audit_verification_fields("unknown", None, None, None) == []


def test_invalid_status_is_a_violation():
    problems = audit_verification_fields("definitely_true", None, None, None)
    assert len(problems) == 1


# ── compute_verification_coverage ───────────────────────────────────────────

class _FakeItem:
    def __init__(self, verification_status):
        self.verification_status = verification_status


def test_coverage_empty_university():
    result = compute_verification_coverage([])
    assert result["total_claims"] == 0
    assert result["verification_coverage_pct"] is None


def test_coverage_mixed_statuses():
    items = [_FakeItem("verified"), _FakeItem("verified"), _FakeItem("partially_verified"),
             _FakeItem("unverified"), _FakeItem("unverified")]
    result = compute_verification_coverage(items)
    assert result["total_claims"] == 5
    assert result["verified"] == 2
    assert result["partially_verified"] == 1
    assert result["unverified"] == 2
    # covered = verified + partially_verified = 3/5 = 60%
    assert result["verification_coverage_pct"] == 60


def test_coverage_includes_deadlines():
    items = [_FakeItem("verified")]
    deadlines = [_FakeItem("unverified"), _FakeItem("unverified")]
    result = compute_verification_coverage(items, deadlines)
    assert result["total_claims"] == 3
    assert result["verification_coverage_pct"] == 33


# ── Live DB scan — the actual invariant, not just the pure function ────────

def test_no_verified_document_item_in_db_is_missing_evidence(db):
    """Scans every real UniversityDocumentItem row currently in the database.
    A 'verified' or 'partially_verified' row without its required evidence
    fields is a test FAILURE, independent of anything anyone claimed in a
    report — this is what makes the database auditable, not just trusted."""
    from app.models.university import UniversityDocumentItem
    violations = []
    for item in db.query(UniversityDocumentItem).filter(
        UniversityDocumentItem.verification_status.in_(["verified", "partially_verified"])
    ).all():
        problems = audit_verification_fields(item.verification_status, item.source_url, item.evidence_text, item.verified_at)
        if problems:
            violations.append((item.id, item.university_id, item.name, problems))
    assert violations == [], f"Verification invariant violated by {len(violations)} document item row(s): {violations}"


def test_no_verified_deadline_in_db_is_missing_evidence(db):
    from app.models.university import UniversityDeadline
    violations = []
    for item in db.query(UniversityDeadline).filter(
        UniversityDeadline.verification_status.in_(["verified", "partially_verified"])
    ).all():
        problems = audit_verification_fields(item.verification_status, item.source_url, item.evidence_text, item.verified_at)
        if problems:
            violations.append((item.id, item.university_id, item.label, problems))
    assert violations == [], f"Verification invariant violated by {len(violations)} deadline row(s): {violations}"


# ── audit_claim — independent re-check, never trusts verification_status ────

def test_audit_unverified_is_insufficient_evidence():
    result = audit_claim("CV", "unverified", None, None, None)
    assert result["audit_result"] == "INSUFFICIENT_EVIDENCE"


def test_audit_verified_without_source_is_source_unavailable():
    result = audit_claim("CV", "verified", None, "A CV is required.", date(2026, 1, 1))
    assert result["audit_result"] == "SOURCE_UNAVAILABLE"


def test_audit_verified_without_evidence_is_insufficient():
    result = audit_claim("CV", "verified", "https://x.edu", None, date(2026, 1, 1))
    assert result["audit_result"] == "INSUFFICIENT_EVIDENCE"


def test_audit_verified_with_trivial_evidence_is_insufficient():
    result = audit_claim("CV", "verified", "https://x.edu", "ok", date(2026, 1, 1))
    assert result["audit_result"] == "INSUFFICIENT_EVIDENCE"


def test_audit_catches_reused_evidence_from_a_different_claim():
    """The exact real bug class this audit exists to catch: evidence that
    proves uni-assist is used, reused as 'proof' of a specific €75 fee
    figure it never mentions."""
    result = audit_claim(
        "uni-assist processing fee receipt (€75 first application, €30 each additional)",
        "verified", "https://hu-berlin.de/admissions",
        "International applicants with restrictions on admission must send their applications to Vorprüfstelle UNI-ASSIST at Humboldt-Universität.",
        date(2026, 1, 1),
    )
    assert result["audit_result"] == "NOT_SUPPORTED"


def test_audit_strong_match_is_supported():
    # Matches the real LMU production row: condition MUST be supplied to
    # match the nationality list the evidence actually names — omitting it
    # (as this test originally did) is itself the over-claim this audit
    # exists to catch, caught retroactively by the Phase 2.7 nationality-
    # list detector hardening.
    result = audit_claim(
        "APS Certificate", "verified",
        "https://lmu.de/guide",
        "Applicants with university degrees from the PR China, India and Vietnam should submit the original certificate from the Akademische Prüfstelle (APS).",
        date(2026, 8, 16),
        condition={"type": "nationality", "values": ["China", "India", "Vietnam"]},
    )
    assert result["audit_result"] == "SUPPORTED"


def test_audit_partially_verified_is_partially_supported():
    result = audit_claim(
        "uni-assist online application form", "partially_verified",
        "https://hu-berlin.de/admissions",
        "International applicants with restrictions on admission must send their applications to Vorprüfstelle UNI-ASSIST.",
        None,
    )
    assert result["audit_result"] == "PARTIALLY_SUPPORTED"


def test_audit_outdated_cycle():
    result = audit_claim(
        "Winter deadline", "verified", "https://x.edu",
        "The winter semester deadline is 15 July 2024 for the 2024/25 cycle.",
        date(2026, 1, 1), cycle="2024/25", current_cycle="2026/27",
    )
    assert result["audit_result"] == "OUTDATED_SOURCE"


def test_audit_invalid_status_is_insufficient_evidence():
    result = audit_claim("CV", "definitely_true", "https://x.edu", "evidence", date(2026, 1, 1))
    assert result["audit_result"] == "INSUFFICIENT_EVIDENCE"


# ── new statuses (Phase 3 Batch 1): conflicting / needs_manual_verification ─

def test_audit_conflicting_status_never_reaches_supported():
    result = audit_claim(
        "Winter deadline", "conflicting", "https://a.edu",
        "The official winter deadline page states conflicting winter deadline dates from two sources.",
        date(2026, 1, 1),
    )
    assert result["audit_result"] == "CONFLICTING_SOURCES"
    assert result["audit_result"] != "SUPPORTED"


def test_audit_needs_manual_verification_never_reaches_supported():
    result = audit_claim(
        "Application deadline required documents", "needs_manual_verification", "https://protected-uni.edu",
        "Application deadline and required documents text preserved for manual follow-up.",
        date(2026, 1, 1),
    )
    assert result["audit_result"] != "SUPPORTED"


def test_invariant_conflicting_requires_evidence_text():
    problems = audit_verification_fields("conflicting", "https://x.edu", None, date(2026, 1, 1))
    assert any("evidence_text" in p for p in problems)


def test_invariant_needs_manual_verification_requires_evidence_text():
    problems = audit_verification_fields("needs_manual_verification", None, None, date(2026, 1, 1))
    assert any("evidence_text" in p for p in problems)


def test_coverage_counts_conflicting_and_needs_manual_verification_as_covered():
    items = [_FakeItem("conflicting"), _FakeItem("needs_manual_verification"), _FakeItem("unverified"), _FakeItem("unverified")]
    result = compute_verification_coverage(items)
    assert result["conflicting"] == 1
    assert result["needs_manual_verification"] == 1
    # 2 of 4 are "covered" (have SOME independently traceable evidence)
    assert result["verification_coverage_pct"] == 50


# ── detect_deadline_conflicts ───────────────────────────────────────────────

class _FakeDeadline:
    def __init__(self, id, label, deadline_text, verification_status="verified", condition=None):
        self.id = id
        self.label = label
        self.deadline_text = deadline_text
        self.verification_status = verification_status
        self.condition = condition


def test_conflict_detected_when_same_scope_disagrees():
    rows = [
        _FakeDeadline(1, "Winter semester", "15 July"),
        _FakeDeadline(2, "Winter semester", "31 May"),
    ]
    conflicts = detect_deadline_conflicts(rows)
    assert len(conflicts) == 1
    assert {r.id for r in conflicts[0]} == {1, 2}


def test_no_conflict_when_scopes_differ():
    rows = [
        _FakeDeadline(1, "Winter semester", "15 July"),
        _FakeDeadline(2, "Summer semester", "15 January"),
    ]
    assert detect_deadline_conflicts(rows) == []


def test_no_conflict_when_agree():
    rows = [
        _FakeDeadline(1, "Winter semester", "15 July"),
        _FakeDeadline(2, "Winter semester", "15 July"),
    ]
    assert detect_deadline_conflicts(rows) == []


def test_unverified_rows_never_trigger_conflicts():
    rows = [
        _FakeDeadline(1, "Winter semester", "15 July", verification_status="unverified"),
        _FakeDeadline(2, "Winter semester", "31 May", verification_status="unverified"),
    ]
    assert detect_deadline_conflicts(rows) == []


# ── generate_university_audit_report / render_audit_report_markdown ────────

def test_generate_report_end_to_end(db, sample_universities):
    from app.models.university import UniversityDocumentItem, UniversityDeadline

    uni = sample_universities[0]
    db.add(UniversityDocumentItem(
        university_id=uni.id, name="APS Certificate", is_required=True, order_index=0, degree_level="all",
        condition={"type": "nationality", "values": ["China"]},
        source_url="https://lmu.de/guide",
        evidence_text="Applicants with degrees from China should submit the original APS certificate.",
        verification_status="verified", verified_at=date(2026, 8, 16),
    ))
    db.add(UniversityDeadline(
        university_id=uni.id, label="Winter semester", deadline_text="15 July",
        source_url="https://lmu.de/deadlines", evidence_text="The winter semester deadline is 15 July.",
        verification_status="verified", verified_at=date(2026, 8, 16),
    ))
    db.commit()
    db.refresh(uni)

    report = generate_university_audit_report(uni)
    assert report["university"] == uni.name
    assert report["coverage"]["total_claims"] == 2
    assert report["requirements"][0]["audit_result"] == "SUPPORTED"
    assert report["deadlines"][0]["audit_result"] == "SUPPORTED"

    md = render_audit_report_markdown(report)
    assert uni.name in md
    assert "SUPPORTED" in md
    assert "verification coverage" in md.lower()


def test_report_surfaces_conflicting_deadlines(db, sample_universities):
    from app.models.university import UniversityDeadline

    uni = sample_universities[0]
    db.add_all([
        UniversityDeadline(university_id=uni.id, label="Winter semester", deadline_text="15 July",
                            source_url="https://a.edu", evidence_text="Winter deadline is 15 July.",
                            verification_status="verified", verified_at=date(2026, 8, 16)),
        UniversityDeadline(university_id=uni.id, label="Winter semester", deadline_text="31 May",
                            source_url="https://b.edu", evidence_text="Winter deadline is 31 May.",
                            verification_status="verified", verified_at=date(2026, 8, 16)),
    ])
    db.commit()
    db.refresh(uni)

    report = generate_university_audit_report(uni)
    assert len(report["conflicts"]) == 1
    assert all(r["audit_result"] == "CONFLICTING_SOURCES" for r in report["deadlines"])


# ═══════════════════════════════════════════════════════════════════════════
# Phase 2.6 — Adversarial verification-system validation
# Goal: prove the audit engine CATCHES bad claims, not that current data is
# good. Every test here constructs a deliberately wrong/incomplete/over-
# scoped/outdated/conflicting claim and asserts the audit engine flags it.
# ═══════════════════════════════════════════════════════════════════════════

# ── 1. Exact-claim support: document required ≠ exact score/fee required ───

def test_adversarial_fee_amount_not_proven_by_uni_assist_usage():
    result = audit_claim(
        "uni-assist fee is €75", "verified", "https://official-uni.edu/admissions",
        "Applications are submitted through uni-assist.", date(2026, 1, 1),
    )
    assert result["audit_result"] == "NOT_SUPPORTED"


def test_adversarial_exact_score_not_proven_by_generic_certificate_mention():
    """'IELTS certificate required' proves the TEST is required, not that a
    6.5 threshold is required — these are different claims."""
    result = audit_claim(
        "IELTS 6.5 required", "verified", "https://official-uni.edu/admissions",
        "An IELTS certificate is required for admission.", date(2026, 1, 1),
    )
    assert result["audit_result"] != "SUPPORTED"
    assert result["audit_result"] == "NOT_SUPPORTED"


# ── 2. Scope over-claims ────────────────────────────────────────────────────

def test_adversarial_programme_specific_evidence_never_becomes_university_wide():
    result = audit_claim(
        "CV is required for all applicants", "verified", "https://official-uni.edu/cs-masters",
        "Applicants to the Master's Computer Science programme must submit a CV.",
        date(2026, 1, 1), condition=None, degree_level="all",
    )
    assert result["audit_result"] in ("PARTIALLY_SUPPORTED", "NOT_SUPPORTED")
    assert result["audit_result"] != "SUPPORTED"


def test_adversarial_bachelor_evidence_does_not_universally_support_all_degree_levels():
    result = audit_claim(
        "Transcript required", "verified", "https://official-uni.edu/admissions",
        "Bachelor's applicants must submit an academic transcript with their application.",
        date(2026, 1, 1), degree_level="all",
    )
    assert result["audit_result"] != "SUPPORTED"


def test_adversarial_non_eu_specific_evidence_flagged_when_condition_missing():
    result = audit_claim(
        "Blocked account proof required", "verified", "https://official-uni.edu/finance",
        "Non-EU applicants must provide proof of a blocked account for financial means.",
        date(2026, 1, 1), condition=None,
    )
    assert result["audit_result"] != "SUPPORTED"


def test_adversarial_nationality_specific_evidence_flagged_when_condition_missing():
    result = audit_claim(
        "APS certificate required", "verified", "https://official-uni.edu/admissions",
        "Applicants from China must submit the APS certificate with their application.",
        date(2026, 1, 1), condition=None,
    )
    assert result["audit_result"] != "SUPPORTED"


def test_adversarial_nationality_list_with_non_adjacent_from_is_flagged():
    """Regression (Phase 2.7): the literal 'applicants from' adjacency
    regex missed the project's own recurring APS example — LMU's real
    wording is 'Applicants with university degrees from the PR China,
    India and Vietnam', where several words sit between 'applicants' and
    'from'. Found by the source-verification adversarial suite reusing
    this exact real-world phrasing."""
    result = audit_claim(
        "APS certificate required", "verified", "https://official-uni.edu/admissions",
        "Applicants with university degrees from the PR China, India and Vietnam should submit the original APS certificate.",
        date(2026, 1, 1), condition=None,
    )
    assert result["audit_result"] != "SUPPORTED"


def test_scoped_claim_with_matching_condition_is_supported():
    """The flip side: when the stored condition DOES match what the
    evidence actually scopes to, the claim is legitimately supported —
    over-claim detection should not punish correctly-scoped claims."""
    result = audit_claim(
        "APS certificate required", "verified", "https://official-uni.edu/admissions",
        "Applicants from China must submit the APS certificate with their application.",
        date(2026, 1, 1), condition={"type": "nationality", "values": ["China"]},
    )
    assert result["audit_result"] == "SUPPORTED"


# ── 3. Conditional requirements applied per real student profile ───────────

def test_adversarial_aps_condition_only_applies_to_named_nationalities():
    from app.services.application_readiness import evaluate_condition

    condition = {"type": "nationality", "values": ["China", "India", "Vietnam"]}

    class P:
        def __init__(self, nationality):
            self.nationality = nationality

    assert evaluate_condition(condition, P("Egyptian")) is False
    assert evaluate_condition(condition, P("China")) is True
    assert evaluate_condition(condition, P("India")) is True
    assert evaluate_condition(condition, P("Vietnam")) is True


# ── 4. Deadline scope — multi-intake and programme-specific ────────────────

def test_deadline_claim_kind_skips_numeric_check_for_date_format_differences():
    """Regression: running the hardened engine against real production data
    (Humboldt's undergraduate deadline) found a false NOT_SUPPORTED — the
    row's deadline_text ('2 May - 31 May') and its own evidence_text
    ('02.05. to 31.05.') describe the IDENTICAL date, just in different
    notations, but the generic numeric-figure check (built for fees/scores)
    saw '2'/'31' vs '02.05'/'31.05' as non-overlapping numbers. claim_kind
    ='deadline' skips that check in favor of the date-aware comparison."""
    result = audit_claim(
        "Winter semester (undergraduate) — 2 May - 31 May", "partially_verified",
        "https://hu-berlin.de/admissions",
        "For undergraduate programmes, the Winter semester application period is 02.05. to 31.05.",
        date(2026, 1, 1), claim_kind="deadline",
    )
    assert result["audit_result"] != "NOT_SUPPORTED"


def test_adversarial_multi_intake_evidence_not_collapsed_to_one_date():
    result = audit_claim(
        "Winter semester — 15 July", "verified", "https://official-uni.edu/deadlines",
        "July 15 for Winter intake; January 15 for Summer intake.", date(2026, 1, 1),
    )
    # Numeric check alone would pass ('15' is shared) — the multi-intake
    # check is a separate, additional safeguard tested directly below.
    assert deadline_evidence_has_uncaptured_intakes("15 July", "July 15 for Winter intake; January 15 for Summer intake.")


def test_adversarial_programme_specific_deadline_not_university_wide():
    result = audit_claim(
        "University deadline — 15 July", "verified", "https://official-uni.edu/cs-deadlines",
        "Computer Science Master's deadline: 15 July.", date(2026, 1, 1), condition=None,
    )
    assert result["audit_result"] != "SUPPORTED"


# ── 5. Outdated sources ─────────────────────────────────────────────────────

def test_adversarial_old_cycle_flagged_outdated():
    result = audit_claim(
        "Winter deadline", "verified", "https://official-uni.edu/deadlines",
        "The winter semester 2023/24 deadline is 15 July.", date(2024, 1, 1),
        cycle="2023/24", current_cycle="2026/27",
    )
    assert result["audit_result"] == "OUTDATED_SOURCE"


def test_adversarial_2024_25_cycle_flagged_outdated_for_2026_27():
    result = audit_claim(
        "Winter deadline", "verified", "https://official-uni.edu/deadlines",
        "The winter semester deadline is 15 July for the 2024/25 academic year.", date(2025, 1, 1),
        cycle="2024/25", current_cycle="2026/27",
    )
    assert result["audit_result"] == "OUTDATED_SOURCE"


# ── 6. Conflicting official sources ─────────────────────────────────────────

class _FD:
    def __init__(self, id, label, deadline_text, verification_status="verified", condition=None):
        self.id, self.label, self.deadline_text = id, label, deadline_text
        self.verification_status, self.condition = verification_status, condition


def test_adversarial_two_authoritative_sources_disagreeing_is_flagged_not_resolved():
    rows = [
        _FD(1, "Winter semester", "15 July"),   # Source A
        _FD(2, "Winter semester", "1 August"),  # Source B
    ]
    conflicts = detect_deadline_conflicts(rows)
    assert len(conflicts) == 1
    ids = {r.id for r in conflicts[0]}
    assert ids == {1, 2}, "Both sources must be preserved, neither silently chosen"


# ── 7. Source quality hierarchy ─────────────────────────────────────────────

def test_source_tier_official_university_domain():
    assert classify_source_tier("https://www.lmu.de/en/admissions", university_website="https://www.lmu.de") == 1


def test_source_tier_known_national_platform():
    assert classify_source_tier("https://www.daad.de/en/") == 2
    assert classify_source_tier("https://www.uni-assist.de/en/") == 2


def test_source_tier_reddit_is_tier5():
    assert classify_source_tier("https://www.reddit.com/r/germany/comments/xyz") == 5


def test_tier5_source_can_never_support_a_verified_claim():
    result = audit_claim(
        "Application deadline is 15 July", "verified",
        "https://www.reddit.com/r/germany/comments/xyz",
        "Someone told me the deadline is 15 July.", date(2026, 1, 1),
    )
    assert result["audit_result"] == "NOT_SUPPORTED"


# ── 8. Source-to-claim specificity (authority ≠ proof of the exact claim) ──

def test_adversarial_authoritative_source_still_not_proof_of_unrelated_figure():
    """The source IS official (Tier 1) — that alone is not enough. The
    specific numeric claim it's cited for must actually appear in it."""
    result = audit_claim(
        "uni-assist charges €75", "verified", "https://www.fu-berlin.de/en/studium/bewerbung",
        "Applications are submitted through uni-assist.", date(2026, 1, 1),
    )
    assert result["audit_result"] == "NOT_SUPPORTED"


# ── 9. Fabricated evidence ───────────────────────────────────────────────────

def test_adversarial_fabricated_ielts_score_mismatch_with_decimals():
    """Regression: a naive integer-only number extractor would let '7.0' and
    '6.0' match on the shared digit '0' — found and fixed in this phase."""
    result = audit_claim(
        "IELTS 7.0 required", "verified", "https://official-uni.edu/admissions",
        "IELTS 6.0 required for admission.", date(2026, 1, 1),
    )
    assert result["audit_result"] == "NOT_SUPPORTED"


def test_adversarial_fabricated_deadline_mismatch():
    result = audit_claim(
        "Application deadline: 15 July", "verified", "https://official-uni.edu/deadlines",
        "Application deadline: 1 August.", date(2026, 1, 1),
    )
    assert result["audit_result"] == "NOT_SUPPORTED"


# ── 10. Missing evidence per status — confirms the field-presence and the
# independent-audit checks agree with each other, end to end ───────────────

def test_adversarial_verified_status_alone_never_implies_supported():
    """A row saying verification_status='verified' AND having a source_url
    must NOT be trusted as SUPPORTED just because both fields are non-null —
    the evidence content itself still has to hold up."""
    result = audit_claim(
        "IELTS 7.0 required", "verified", "https://official-uni.edu/admissions",
        "An English certificate may be required.", date(2026, 1, 1),
    )
    assert result["audit_result"] != "SUPPORTED"


def test_adversarial_unknown_status_never_reads_as_any_kind_of_supported():
    result = audit_claim("Some requirement", "unknown", "https://x.edu", "Some evidence text here.", date(2026, 1, 1))
    assert result["audit_result"] == "INSUFFICIENT_EVIDENCE"


# ── Batch 2 finding: zero-padded numbers ('01' vs '1') are the same number ──

def test_zero_padded_number_equals_unpadded():
    from app.services.verification_audit import _claim_has_unconfirmed_numbers
    assert _claim_has_unconfirmed_numbers("Opens 1 June", "Applications open 01 June each year.") is False


def test_genuinely_different_numbers_still_caught_after_normalization():
    from app.services.verification_audit import _claim_has_unconfirmed_numbers
    assert _claim_has_unconfirmed_numbers("Fee is 75 EUR", "The fee is 070 EUR.") is True


def test_audit_zero_padded_date_not_flagged_source_changed():
    """Regression (Phase 3 Batch 2, found against real TU Darmstadt data):
    claim said '1 June', live evidence said '01 June' — the SAME date,
    just zero-padded. Must not be treated as SOURCE_CHANGED."""
    result = audit_claim(
        "Winter semester application opens — 1 June", "verified", "https://tu-darmstadt.de/deadlines",
        "The online application for a winter semester usually starts on 01 June.", date(2026, 1, 1),
    )
    assert result["audit_result"] != "NOT_SUPPORTED"
