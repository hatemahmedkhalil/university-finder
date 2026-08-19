"""Tests for the application readiness / requirements / deadline intelligence
service (app/services/application_readiness.py) and its wiring into /pipeline."""
from datetime import date

from app.services.application_readiness import (
    build_requirements, compute_readiness, parse_deadline,
    compute_deadline_risk, next_best_action, match_requirement,
    compute_profile_completeness, compute_submission_readiness,
    evaluate_condition,
    SUBMISSION_READY, SUBMISSION_BLOCKED, SUBMISSION_DATA_INCOMPLETE, SUBMISSION_DEADLINE_PASSED,
)
from app.models.university import UniversityDocumentItem
from tests.conftest import requires_groq


class _FakeProfile:
    """Stand-in for a StudentProfile ORM object — avoids DB setup for pure logic tests."""
    def __init__(self, **kwargs):
        self.full_name = kwargs.get("full_name")
        self.gpa = kwargs.get("gpa")
        self.degree_level = kwargs.get("degree_level")
        self.field_of_study = kwargs.get("field_of_study")
        self.nationality = kwargs.get("nationality")
        self.english_level = kwargs.get("english_level")
        self.language = kwargs.get("language")
        self.budget_eur = kwargs.get("budget_eur")


FULL_PROFILE_KWARGS = dict(
    full_name="Ali", gpa=3.5, degree_level="master", field_of_study="CS",
    nationality="Egyptian", english_level="c1", language="german", budget_eur=5000,
)


# ── compute_profile_completeness ─────────────────────────────────────────────

def test_profile_completeness_none_profile():
    result = compute_profile_completeness(None)
    assert result["complete"] is False
    assert result["filled_count"] == 0
    assert result["total_count"] == 8
    assert len(result["missing_fields"]) == 8


def test_profile_completeness_fully_filled():
    result = compute_profile_completeness(_FakeProfile(**FULL_PROFILE_KWARGS))
    assert result["complete"] is True
    assert result["filled_count"] == 8
    assert result["missing_fields"] == []


def test_profile_completeness_partial():
    kwargs = {**FULL_PROFILE_KWARGS, "full_name": None, "field_of_study": ""}
    result = compute_profile_completeness(_FakeProfile(**kwargs))
    assert result["complete"] is False
    assert result["filled_count"] == 6
    assert "Full Name" in result["missing_fields"]
    assert "Field of Study" in result["missing_fields"]


# ── compute_submission_readiness ─────────────────────────────────────────────

def _reqs(items, source="verified"):
    return {"items": items, "source": source, "degree_level_note": None}


COMPLETE_PROFILE = compute_profile_completeness(_FakeProfile(**FULL_PROFILE_KWARGS))
INCOMPLETE_PROFILE = compute_profile_completeness(None)


# ── evaluate_condition (Phase 2 — conditional requirements) ─────────────────

class _NationalityProfile:
    def __init__(self, nationality=None, prev_country=None):
        self.nationality = nationality
        self.prev_country = prev_country


def test_condition_none_always_applies():
    assert evaluate_condition(None, None) is True


def test_condition_nationality_matches():
    condition = {"type": "nationality", "values": ["China", "Vietnam", "India"]}
    assert evaluate_condition(condition, _NationalityProfile(nationality="China")) is True
    assert evaluate_condition(condition, _NationalityProfile(nationality="china")) is True  # case-insensitive


def test_condition_nationality_does_not_match():
    condition = {"type": "nationality", "values": ["China", "Vietnam", "India"]}
    assert evaluate_condition(condition, _NationalityProfile(nationality="Egyptian")) is False


def test_condition_nationality_unknown_when_no_profile_data():
    condition = {"type": "nationality", "values": ["China"]}
    assert evaluate_condition(condition, None) is None
    assert evaluate_condition(condition, _NationalityProfile(nationality=None)) is None


def test_condition_education_country_matches():
    condition = {"type": "education_country", "values": ["China"]}
    assert evaluate_condition(condition, _NationalityProfile(prev_country="China")) is True
    assert evaluate_condition(condition, _NationalityProfile(prev_country="Egypt")) is False


def test_condition_unrecognized_type_is_never_evaluated():
    # "other" (or any type we don't have a rule for) must never be silently
    # resolved either way — showing a possibly-irrelevant requirement is
    # safer than wrongly hiding a real one.
    condition = {"type": "other", "values": ["something"]}
    assert evaluate_condition(condition, _NationalityProfile(nationality="China")) is None


def test_condition_missing_values_is_unevaluable():
    assert evaluate_condition({"type": "nationality", "values": []}, _NationalityProfile(nationality="China")) is None


# ── build_requirements + conditions + verification metadata ────────────────

def test_build_requirements_new_rows_default_to_unverified(db, sample_universities):
    """A freshly created UniversityDocumentItem (no verification_status set
    explicitly) must default to 'unverified' — never silently 'verified'."""
    uni = sample_universities[0]
    item = UniversityDocumentItem(university_id=uni.id, name="Passport copy", is_required=True, order_index=0, degree_level="all")
    db.add(item)
    db.commit()
    db.refresh(uni)

    reqs = build_requirements(uni, degree_level=None, owned_types=set(), has_motivation_letter=False)
    assert reqs["items"][0]["verification_status"] == "unverified"
    assert reqs["items"][0]["source_url"] is None
    assert reqs["items"][0]["evidence_text"] is None


def test_build_requirements_exposes_verified_metadata(db, sample_universities):
    uni = sample_universities[0]
    db.add(UniversityDocumentItem(
        university_id=uni.id, name="Curriculum Vitae", is_required=True, order_index=0, degree_level="all",
        source_url="https://example-university.edu/admissions/cv",
        evidence_text="A CV in Europass format must be submitted with the application.",
        verification_status="verified",
        verified_at=date(2026, 8, 1),
    ))
    db.commit()
    db.refresh(uni)

    reqs = build_requirements(uni, degree_level=None, owned_types=set(), has_motivation_letter=False)
    item = reqs["items"][0]
    assert item["verification_status"] == "verified"
    assert item["source_url"] == "https://example-university.edu/admissions/cv"
    assert "Europass" in item["evidence_text"]
    assert item["verified_at"] == "2026-08-01"


def test_build_requirements_nonapplicable_condition_does_not_block_readiness(db, sample_universities):
    """The APS-certificate scenario: a conditional requirement that does NOT
    apply to this student must not count as required, and must not block
    their readiness score."""
    uni = sample_universities[0]
    db.add_all([
        UniversityDocumentItem(university_id=uni.id, name="Passport copy", is_required=True, order_index=0, degree_level="all"),
        UniversityDocumentItem(
            university_id=uni.id, name="APS Certificate", is_required=True, order_index=1, degree_level="all",
            condition={"type": "nationality", "values": ["China", "Vietnam", "India", "Mongolia"]},
        ),
    ])
    db.commit()
    db.refresh(uni)

    egyptian_student = _NationalityProfile(nationality="Egyptian")
    reqs = build_requirements(uni, degree_level=None, owned_types={"passport"}, has_motivation_letter=False, profile=egyptian_student)

    aps_item = next(i for i in reqs["items"] if i["name"] == "APS Certificate")
    assert aps_item["required"] is False
    assert aps_item["condition_applies"] is False

    readiness = compute_readiness(reqs)
    assert readiness["required_total"] == 1  # only Passport, APS correctly excluded
    assert readiness["score"] == 100  # passport owned, APS doesn't apply -> fully ready


def test_build_requirements_applicable_condition_still_blocks_readiness(db, sample_universities):
    uni = sample_universities[0]
    db.add(UniversityDocumentItem(
        university_id=uni.id, name="APS Certificate", is_required=True, order_index=0, degree_level="all",
        condition={"type": "nationality", "values": ["China", "Vietnam", "India", "Mongolia"]},
    ))
    db.commit()
    db.refresh(uni)

    chinese_student = _NationalityProfile(nationality="China")
    reqs = build_requirements(uni, degree_level=None, owned_types=set(), has_motivation_letter=False, profile=chinese_student)

    aps_item = reqs["items"][0]
    assert aps_item["required"] is True
    assert aps_item["condition_applies"] is True
    readiness = compute_readiness(reqs)
    assert readiness["score"] == 0  # applies to this student and isn't matched -> not ready


def test_build_requirements_unevaluable_condition_still_shown_as_required(db, sample_universities):
    """No profile supplied at all -> condition can't be evaluated -> the
    requirement must still be shown as required (never wrongly hidden)."""
    uni = sample_universities[0]
    db.add(UniversityDocumentItem(
        university_id=uni.id, name="APS Certificate", is_required=True, order_index=0, degree_level="all",
        condition={"type": "nationality", "values": ["China"]},
    ))
    db.commit()
    db.refresh(uni)

    reqs = build_requirements(uni, degree_level=None, owned_types=set(), has_motivation_letter=False, profile=None)
    aps_item = reqs["items"][0]
    assert aps_item["required"] is True
    assert aps_item["condition_applies"] is None


def test_build_requirements_freetext_and_generic_are_marked_appropriately(db, sample_universities):
    uni = sample_universities[0]
    uni.required_documents = "Passport\nTranscript"
    db.commit()
    db.refresh(uni)
    reqs = build_requirements(uni, degree_level=None, owned_types=set(), has_motivation_letter=False)
    assert all(i["verification_status"] == "unverified" for i in reqs["items"])

    uni.required_documents = None
    db.commit()
    db.refresh(uni)
    reqs2 = build_requirements(uni, degree_level=None, owned_types=set(), has_motivation_letter=False)
    assert all(i["verification_status"] == "unknown" for i in reqs2["items"])
FUTURE_DEADLINE = {"parseable": True, "next_date": "2099-01-01", "days_remaining": 100, "multiple_dates": False, "raw": "x"}
PASSED_DEADLINE_RISK = {"level": "passed", "reason": "This deadline has passed."}
ON_TRACK_RISK = {"level": "on_track", "reason": "x"}


def test_submission_ready_when_everything_complete():
    reqs = _reqs([{"name": "Passport", "required": True, "matched": True}])
    result = compute_submission_readiness(reqs, compute_readiness(reqs), COMPLETE_PROFILE, True, FUTURE_DEADLINE, ON_TRACK_RISK)
    assert result["state"] == SUBMISSION_READY
    assert result["issues"] == []


def test_submission_blocked_missing_document():
    reqs = _reqs([{"name": "IELTS certificate", "required": True, "matched": False}])
    result = compute_submission_readiness(reqs, compute_readiness(reqs), COMPLETE_PROFILE, True, FUTURE_DEADLINE, ON_TRACK_RISK)
    assert result["state"] == SUBMISSION_BLOCKED
    assert any(i["type"] == "requirement" for i in result["issues"])


def test_submission_blocked_missing_motivation_letter():
    reqs = _reqs([{"name": "Passport", "required": True, "matched": True}])
    result = compute_submission_readiness(reqs, compute_readiness(reqs), COMPLETE_PROFILE, False, FUTURE_DEADLINE, ON_TRACK_RISK)
    assert result["state"] == SUBMISSION_BLOCKED
    assert any(i["type"] == "motivation_letter" for i in result["issues"])


def test_submission_blocked_incomplete_profile():
    reqs = _reqs([{"name": "Passport", "required": True, "matched": True}])
    result = compute_submission_readiness(reqs, compute_readiness(reqs), INCOMPLETE_PROFILE, True, FUTURE_DEADLINE, ON_TRACK_RISK)
    assert result["state"] == SUBMISSION_BLOCKED
    assert any(i["type"] == "personal_info" for i in result["issues"])


def test_submission_optional_missing_item_does_not_block():
    reqs = _reqs([
        {"name": "Passport", "required": True, "matched": True},
        {"name": "Portfolio (optional)", "required": False, "matched": False},
    ])
    result = compute_submission_readiness(reqs, compute_readiness(reqs), COMPLETE_PROFILE, True, FUTURE_DEADLINE, ON_TRACK_RISK)
    assert result["state"] == SUBMISSION_READY


def test_submission_generic_requirements_data_incomplete():
    reqs = _reqs([{"name": "Transcript / academic records", "required": True, "matched": True}], source="generic")
    result = compute_submission_readiness(reqs, compute_readiness(reqs), COMPLETE_PROFILE, True, FUTURE_DEADLINE, ON_TRACK_RISK)
    assert result["state"] == SUBMISSION_DATA_INCOMPLETE
    assert result["confidence_note"] is not None


def test_submission_no_requirements_does_not_report_ready():
    reqs = _reqs([], source="generic")
    result = compute_submission_readiness(reqs, compute_readiness(reqs), COMPLETE_PROFILE, True, FUTURE_DEADLINE, ON_TRACK_RISK)
    assert result["state"] != SUBMISSION_READY


def test_submission_deadline_passed():
    reqs = _reqs([{"name": "Passport", "required": True, "matched": True}])
    result = compute_submission_readiness(reqs, compute_readiness(reqs), COMPLETE_PROFILE, True, FUTURE_DEADLINE, PASSED_DEADLINE_RISK)
    assert result["state"] == SUBMISSION_DEADLINE_PASSED


def test_submission_multiple_dates_does_not_block_alone():
    reqs = _reqs([{"name": "Passport", "required": True, "matched": True}])
    ambiguous_deadline = {**FUTURE_DEADLINE, "multiple_dates": True}
    result = compute_submission_readiness(reqs, compute_readiness(reqs), COMPLETE_PROFILE, True, ambiguous_deadline, ON_TRACK_RISK)
    assert result["state"] == SUBMISSION_READY


def test_submission_freetext_requirements_ready_but_notes_confidence():
    reqs = _reqs([{"name": "Passport", "required": True, "matched": True}], source="freetext")
    result = compute_submission_readiness(reqs, compute_readiness(reqs), COMPLETE_PROFILE, True, FUTURE_DEADLINE, ON_TRACK_RISK)
    assert result["state"] == SUBMISSION_READY
    assert result["confidence_note"] is not None


def test_submission_motivation_letter_not_double_counted_when_covered_by_requirement():
    # University explicitly lists "Motivation letter" as a requirement, and it's not matched —
    # this should be ONE issue (the requirement), not also a separate motivation_letter issue.
    reqs = _reqs([{"name": "Motivation letter", "required": True, "matched": False}])
    result = compute_submission_readiness(reqs, compute_readiness(reqs), COMPLETE_PROFILE, False, FUTURE_DEADLINE, ON_TRACK_RISK)
    assert result["state"] == SUBMISSION_BLOCKED
    assert len(result["issues"]) == 1
    assert result["issues"][0]["type"] == "requirement"


# ── match_requirement ──────────────────────────────────────────────────────

def test_match_requirement_transcript():
    matched, via = match_requirement("Academic transcript", {"transcript"}, False)
    assert matched is True
    assert via == "transcript"


def test_match_requirement_not_owned():
    matched, via = match_requirement("IELTS certificate", {"transcript"}, False)
    assert matched is False
    assert via is None


def test_match_requirement_motivation_letter_via_pipeline_field():
    # Motivation letter is satisfied by PipelineEntry.motivation_letter, not a StudentDocument.
    matched, via = match_requirement("Motivation letter", set(), has_motivation_letter=True)
    assert matched is True
    assert via == "motivation_letter"

    matched2, via2 = match_requirement("Statement of purpose", set(), has_motivation_letter=False)
    assert matched2 is False
    assert via2 is None


# ── build_requirements / compute_readiness ──────────────────────────────────

def test_build_requirements_uses_structured_data_when_available(db, sample_universities):
    uni = sample_universities[0]
    db.add_all([
        UniversityDocumentItem(university_id=uni.id, name="Passport copy", is_required=True, order_index=0, degree_level="all"),
        UniversityDocumentItem(university_id=uni.id, name="Academic transcript", is_required=True, order_index=1, degree_level="all"),
        UniversityDocumentItem(university_id=uni.id, name="IELTS certificate", is_required=True, order_index=2, degree_level="all"),
        UniversityDocumentItem(university_id=uni.id, name="Portfolio (optional)", is_required=False, order_index=3, degree_level="all"),
    ])
    db.commit()
    db.refresh(uni)

    reqs = build_requirements(uni, degree_level=None, owned_types={"passport", "transcript"}, has_motivation_letter=False)
    assert reqs["source"] == "verified"
    assert len(reqs["items"]) == 4
    matched_names = {i["name"] for i in reqs["items"] if i["matched"]}
    assert "Passport copy" in matched_names
    assert "Academic transcript" in matched_names
    assert "IELTS certificate" not in matched_names

    readiness = compute_readiness(reqs)
    # 3 required items, 2 matched -> 67%
    assert readiness["required_total"] == 3
    assert readiness["required_done"] == 2
    assert readiness["score"] == 67
    assert readiness["optional_total"] == 1


def test_build_requirements_degree_level_filtering(db, sample_universities):
    uni = sample_universities[0]
    db.add_all([
        UniversityDocumentItem(university_id=uni.id, name="Bachelor transcript", is_required=True, order_index=0, degree_level="bachelor"),
        UniversityDocumentItem(university_id=uni.id, name="Master thesis proposal", is_required=True, order_index=1, degree_level="master"),
        UniversityDocumentItem(university_id=uni.id, name="Passport copy", is_required=True, order_index=2, degree_level="all"),
    ])
    db.commit()
    db.refresh(uni)

    reqs = build_requirements(uni, degree_level="master", owned_types=set(), has_motivation_letter=False)
    names = {i["name"] for i in reqs["items"]}
    assert "Master thesis proposal" in names
    assert "Passport copy" in names
    assert "Bachelor transcript" not in names  # wrong degree level, correctly excluded


def test_build_requirements_falls_back_to_freetext(db, sample_universities):
    uni = sample_universities[0]
    uni.required_documents = "Passport\nTranscript\nCV"
    db.commit()
    db.refresh(uni)

    reqs = build_requirements(uni, degree_level=None, owned_types=set(), has_motivation_letter=False)
    assert reqs["source"] == "freetext"
    assert len(reqs["items"]) == 3


def test_build_requirements_generic_fallback_when_no_data(db, sample_universities):
    uni = sample_universities[0]
    uni.required_documents = None
    db.commit()
    db.refresh(uni)

    reqs = build_requirements(uni, degree_level=None, owned_types=set(), has_motivation_letter=False)
    assert reqs["source"] == "generic"
    assert len(reqs["items"]) > 0


def test_compute_readiness_insufficient_data_returns_none_score():
    readiness = compute_readiness({"items": [], "source": "generic"})
    assert readiness["score"] is None
    assert "insufficient" in readiness["explanation"].lower() or "not enough" in readiness["explanation"].lower()


# ── parse_deadline ────────────────────────────────────────────────────────

def test_parse_deadline_single_unambiguous_date():
    today = date(2026, 1, 1)
    result = parse_deadline("Application deadline: March 15", today=today)
    assert result["parseable"] is True
    assert result["next_date"] == "2026-03-15"
    assert result["days_remaining"] == (date(2026, 3, 15) - today).days
    assert result["multiple_dates"] is False


def test_parse_deadline_day_before_month_format():
    today = date(2026, 1, 1)
    result = parse_deadline("Winter: 15 July; Summer: 15 January", today=today)
    assert result["parseable"] is True
    assert result["multiple_dates"] is True  # two distinct dates — must be flagged, not silently picked


def test_parse_deadline_rolls_to_next_year_if_passed():
    today = date(2026, 12, 1)
    result = parse_deadline("Deadline: March 15", today=today)
    assert result["parseable"] is True
    assert result["next_date"] == "2027-03-15"


def test_parse_deadline_unparseable_text_is_honest():
    result = parse_deadline("Rolling admissions, contact the office for details")
    assert result["parseable"] is False
    assert result["next_date"] is None
    assert result["days_remaining"] is None


def test_parse_deadline_none_input():
    result = parse_deadline(None)
    assert result["parseable"] is False


# ── compute_deadline_risk ────────────────────────────────────────────────

def test_deadline_risk_high_when_close_and_incomplete():
    deadline = {"parseable": True, "days_remaining": 10, "next_date": "x", "multiple_dates": False, "raw": "x"}
    readiness = {"required_total": 5, "required_done": 2}
    risk = compute_deadline_risk(deadline, readiness)
    assert risk["level"] == "high"


def test_deadline_risk_on_track_when_complete():
    deadline = {"parseable": True, "days_remaining": 5, "next_date": "x", "multiple_dates": False, "raw": "x"}
    readiness = {"required_total": 5, "required_done": 5}
    risk = compute_deadline_risk(deadline, readiness)
    assert risk["level"] == "on_track"


def test_deadline_risk_unknown_when_unparseable():
    deadline = {"parseable": False, "days_remaining": None, "next_date": None, "multiple_dates": False, "raw": "x"}
    readiness = {"required_total": 5, "required_done": 2}
    risk = compute_deadline_risk(deadline, readiness)
    assert risk["level"] == "unknown"


def test_deadline_risk_passed():
    deadline = {"parseable": True, "days_remaining": -3, "next_date": "x", "multiple_dates": False, "raw": "x"}
    readiness = {"required_total": 5, "required_done": 2}
    risk = compute_deadline_risk(deadline, readiness)
    assert risk["level"] == "passed"


# ── next_best_action ──────────────────────────────────────────────────────

def test_next_best_action_missing_required_item():
    reqs = {"items": [{"name": "IELTS certificate", "required": True, "matched": False}], "source": "verified"}
    risk = {"level": "medium", "reason": "x"}
    action = next_best_action(reqs, risk, "preparing")
    assert "IELTS certificate" in action["action"]


def test_next_best_action_all_complete():
    reqs = {"items": [{"name": "Passport", "required": True, "matched": True}], "source": "verified"}
    risk = {"level": "on_track", "reason": "x"}
    action = next_best_action(reqs, risk, "preparing")
    assert "ready to submit" in action["action"].lower()


def test_next_best_action_submitted_status():
    reqs = {"items": [], "source": "generic"}
    risk = {"level": "unknown", "reason": "x"}
    action = next_best_action(reqs, risk, "submitted")
    assert "waiting" in action["action"].lower()


def test_next_best_action_decision_status():
    reqs = {"items": [], "source": "generic"}
    risk = {"level": "unknown", "reason": "x"}
    action = next_best_action(reqs, risk, "decision")
    assert "decision" in action["action"].lower()


# ── End-to-end via the real /pipeline API ──────────────────────────────────

@requires_groq
def test_pipeline_entry_includes_intelligence_fields(client, db, student_headers, sample_universities):
    uni = sample_universities[0]
    db.add(UniversityDocumentItem(university_id=uni.id, name="Passport copy", is_required=True, order_index=0, degree_level="all"))
    db.commit()

    r = client.post("/pipeline", json={"university_id": uni.id}, headers=student_headers)
    assert r.status_code == 201
    body = r.json()
    assert "requirements" in body and body["requirements"] is not None
    assert "readiness" in body and body["readiness"] is not None
    assert "deadline" in body
    assert "deadline_risk" in body
    assert "next_action" in body and body["next_action"] is not None

    # And the list endpoint returns the same live-computed fields
    r2 = client.get("/pipeline", headers=student_headers)
    assert r2.status_code == 200
    assert r2.json()[0]["readiness"] is not None
