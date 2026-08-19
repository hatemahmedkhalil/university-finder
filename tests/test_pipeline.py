"""
Tests for /pipeline — application tracking. GROQ_API_KEY is loaded from the
real .env, so _run_ai_analysis makes live Groq calls during these tests.
"""


from tests.conftest import requires_groq

@requires_groq
def test_add_to_pipeline_creates_entry(client, student_headers, sample_universities):
    uni = sample_universities[0]
    r = client.post("/pipeline", json={"university_id": uni.id}, headers=student_headers)
    assert r.status_code == 201
    body = r.json()
    assert body["university_id"] == uni.id
    assert body["status"] == "shortlisted"
    assert body["university"]["name"] == uni.name
    assert body["checklist"] is not None


def test_add_to_pipeline_duplicate_rejected(client, student_headers, sample_universities):
    uni = sample_universities[0]
    r1 = client.post("/pipeline", json={"university_id": uni.id}, headers=student_headers)
    assert r1.status_code == 201
    r2 = client.post("/pipeline", json={"university_id": uni.id}, headers=student_headers)
    assert r2.status_code == 409


def test_add_to_pipeline_unknown_university_404(client, student_headers):
    r = client.post("/pipeline", json={"university_id": 999999}, headers=student_headers)
    assert r.status_code == 404


def test_add_to_pipeline_requires_auth(client, sample_universities):
    r = client.post("/pipeline", json={"university_id": sample_universities[0].id})
    assert r.status_code == 401


@requires_groq
def test_get_single_pipeline_entry(client, student_headers, sample_universities):
    """GET /pipeline/{id} — what Apply Hub uses to identify exactly which
    application it's working on. Must include the same live intelligence
    fields as the list endpoint."""
    uni = sample_universities[0]
    created = client.post("/pipeline", json={"university_id": uni.id}, headers=student_headers).json()

    r = client.get(f"/pipeline/{created['id']}", headers=student_headers)
    assert r.status_code == 200
    body = r.json()
    assert body["id"] == created["id"]
    assert body["university"]["name"] == uni.name
    assert body["readiness"] is not None
    assert body["requirements"] is not None
    assert body["deadline"] is not None
    assert body["next_action"] is not None


def test_get_single_pipeline_entry_not_found(client, student_headers):
    r = client.get("/pipeline/999999", headers=student_headers)
    assert r.status_code == 404


@requires_groq
def test_get_single_pipeline_entry_scoped_to_owner(client, db, student_headers, sample_universities):
    from tests.conftest import register_and_login
    uni = sample_universities[0]
    alice = register_and_login(client, db, "alice_gethub@test.com")
    entry = client.post("/pipeline", json={"university_id": uni.id}, headers=alice).json()

    # A different student cannot fetch someone else's application by ID.
    r = client.get(f"/pipeline/{entry['id']}", headers=student_headers)
    assert r.status_code == 404


@requires_groq
def test_pipeline_entry_requirements_include_verification_metadata_and_respect_condition(client, db, student_headers, sample_universities):
    """Real end-to-end proof that Pipeline (and therefore Apply Hub and AI
    Chat, which read the exact same requirements dict) receive the Phase 2
    verification metadata, and that a non-applicable conditional requirement
    (APS certificate for a non-China/Vietnam/India/Mongolia student) is not
    shown as required."""
    from datetime import date
    from app.models.university import UniversityDocumentItem

    uni = sample_universities[0]
    db.add_all([
        UniversityDocumentItem(
            university_id=uni.id, name="Passport copy", is_required=True, order_index=0, degree_level="all",
            source_url="https://example.edu/admissions", evidence_text="A valid passport copy is required.",
            verification_status="verified", verified_at=date(2026, 8, 1),
        ),
        UniversityDocumentItem(
            university_id=uni.id, name="APS Certificate", is_required=True, order_index=1, degree_level="all",
            condition={"type": "nationality", "values": ["China", "Vietnam", "India", "Mongolia"]},
            verification_status="verified",
        ),
    ])
    db.commit()

    # Egyptian student — APS should NOT be required
    client.post("/profiles", json={
        "nationality": "Egyptian", "degree_level": "master", "gpa": 3.5, "budget_eur": 5000,
        "english_level": "c1", "field_of_study": "CS",
    }, headers=student_headers)

    created = client.post("/pipeline", json={"university_id": uni.id}, headers=student_headers).json()
    items = created["requirements"]["items"]

    passport = next(i for i in items if i["name"] == "Passport copy")
    assert passport["verification_status"] == "verified"
    assert passport["source_url"] == "https://example.edu/admissions"

    aps = next(i for i in items if i["name"] == "APS Certificate")
    assert aps["required"] is False
    assert aps["condition_applies"] is False

    # And the list endpoint (used by Pipeline) returns the exact same thing
    listed = client.get("/pipeline", headers=student_headers).json()
    listed_aps = next(i for i in listed[0]["requirements"]["items"] if i["name"] == "APS Certificate")
    assert listed_aps["required"] is False


@requires_groq
def test_submission_check_reports_data_incomplete_for_generic_requirements(client, student_headers, sample_universities):
    """Sample universities have no structured/freetext requirement data in
    tests, so the check must never claim READY off a generic checklist."""
    uni = sample_universities[0]
    created = client.post("/pipeline", json={"university_id": uni.id}, headers=student_headers).json()

    r = client.get(f"/pipeline/{created['id']}/submission-check", headers=student_headers)
    assert r.status_code == 200
    body = r.json()
    assert body["state"] == "DATA_INCOMPLETE"
    assert body["confidence_note"] is not None
    assert body["entry_id"] == created["id"]


def test_submission_check_not_found(client, student_headers):
    r = client.get("/pipeline/999999/submission-check", headers=student_headers)
    assert r.status_code == 404


@requires_groq
def test_submission_check_scoped_to_owner(client, db, student_headers, sample_universities):
    from tests.conftest import register_and_login
    uni = sample_universities[0]
    alice = register_and_login(client, db, "alice_subcheck@test.com")
    entry = client.post("/pipeline", json={"university_id": uni.id}, headers=alice).json()

    r = client.get(f"/pipeline/{entry['id']}/submission-check", headers=student_headers)
    assert r.status_code == 404


@requires_groq
def test_submission_check_ready_when_verified_requirements_all_matched(client, db, student_headers, sample_universities):
    from app.models.university import UniversityDocumentItem

    uni = sample_universities[0]
    db.add(UniversityDocumentItem(university_id=uni.id, name="Passport copy", is_required=True, order_index=0, degree_level="all"))
    db.commit()

    profile_r = client.post("/profiles", json={
        "nationality": "Egyptian", "degree_level": "master", "gpa": 3.5, "budget_eur": 5000,
        "english_level": "c1", "language": "german", "field_of_study": "CS", "full_name": "Test Student",
    }, headers=student_headers)
    assert profile_r.status_code == 201
    assert profile_r.json()["completeness"]["complete"] is True

    doc = client.post(
        "/student-documents",
        data={"name": "My Passport", "doc_type": "passport"},
        files={"file": ("passport.pdf", __import__("io").BytesIO(b"%PDF-1.4 fake"), "application/pdf")},
        headers=student_headers,
    )
    assert doc.status_code == 201

    created = client.post("/pipeline", json={"university_id": uni.id}, headers=student_headers).json()
    client.patch(f"/pipeline/{created['id']}", json={"motivation_letter": "Dear admissions committee..."}, headers=student_headers)

    r = client.get(f"/pipeline/{created['id']}/submission-check", headers=student_headers)
    assert r.status_code == 200
    body = r.json()
    assert body["state"] == "READY"
    assert body["issues"] == []


@requires_groq
def test_add_to_pipeline_survives_unparseable_multi_intake_deadline(client, db, student_headers, sample_universities):
    """Real deadline text like 'July 15 (winter), January 15 (summer)' is not
    a valid timestamp — calendar sync must not 500 the whole request or
    poison the DB session for the rest of it (regression: previously the
    bare `except: pass` never rolled back, so the very next query in the
    same request raised PendingRollbackError)."""
    uni = sample_universities[0]
    uni.application_deadline = "July 15 (winter), January 15 (summer)"
    db.commit()

    r = client.post("/pipeline", json={"university_id": uni.id}, headers=student_headers)
    assert r.status_code == 201
    assert r.json()["university_id"] == uni.id


def test_list_pipeline_empty(client, student_headers):
    r = client.get("/pipeline", headers=student_headers)
    assert r.status_code == 200
    assert r.json() == []


def test_list_pipeline_only_returns_own_entries(client, db, sample_universities):
    from tests.conftest import register_and_login

    alice = register_and_login(client, db, "alice@test.com")
    bob = register_and_login(client, db, "bob@test.com")

    client.post("/pipeline", json={"university_id": sample_universities[0].id}, headers=alice)
    client.post("/pipeline", json={"university_id": sample_universities[1].id}, headers=bob)

    r = client.get("/pipeline", headers=alice)
    assert r.status_code == 200
    entries = r.json()
    assert len(entries) == 1
    assert entries[0]["university_id"] == sample_universities[0].id


def test_update_entry_status(client, student_headers, sample_universities):
    created = client.post("/pipeline", json={"university_id": sample_universities[0].id}, headers=student_headers).json()
    r = client.patch(f"/pipeline/{created['id']}", json={"status": "preparing"}, headers=student_headers)
    assert r.status_code == 200
    assert r.json()["status"] == "preparing"


def test_update_entry_invalid_status_rejected(client, student_headers, sample_universities):
    created = client.post("/pipeline", json={"university_id": sample_universities[0].id}, headers=student_headers).json()
    r = client.patch(f"/pipeline/{created['id']}", json={"status": "not-a-real-status"}, headers=student_headers)
    assert r.status_code == 422


def test_student_cannot_set_decision_status(client, student_headers, sample_universities):
    """Students must not be able to move themselves straight to 'decision' — that's admin-only."""
    created = client.post("/pipeline", json={"university_id": sample_universities[0].id}, headers=student_headers).json()
    r = client.patch(f"/pipeline/{created['id']}", json={"status": "decision"}, headers=student_headers)
    assert r.status_code == 403


def test_update_entry_wrong_owner_404(client, db, sample_universities):
    from tests.conftest import register_and_login

    alice = register_and_login(client, db, "alice2@test.com")
    bob = register_and_login(client, db, "bob2@test.com")

    created = client.post("/pipeline", json={"university_id": sample_universities[0].id}, headers=alice).json()
    r = client.patch(f"/pipeline/{created['id']}", json={"status": "preparing"}, headers=bob)
    assert r.status_code == 404


def test_update_entry_not_found(client, student_headers):
    r = client.patch("/pipeline/999999", json={"status": "preparing"}, headers=student_headers)
    assert r.status_code == 404


def test_update_entry_notes_and_checklist(client, student_headers, sample_universities):
    created = client.post("/pipeline", json={"university_id": sample_universities[0].id}, headers=student_headers).json()
    new_checklist = [{"item": "Transcript", "done": True}]
    r = client.patch(
        f"/pipeline/{created['id']}",
        json={"notes": "Called admissions office", "checklist": new_checklist},
        headers=student_headers,
    )
    assert r.status_code == 200
    body = r.json()
    assert body["notes"] == "Called admissions office"
    assert body["checklist"] == new_checklist


def test_remove_from_pipeline(client, student_headers, sample_universities):
    created = client.post("/pipeline", json={"university_id": sample_universities[0].id}, headers=student_headers).json()
    r = client.delete(f"/pipeline/{created['id']}", headers=student_headers)
    assert r.status_code == 204
    r2 = client.get("/pipeline", headers=student_headers)
    assert r2.json() == []


def test_remove_from_pipeline_wrong_owner_404(client, db, sample_universities):
    from tests.conftest import register_and_login

    alice = register_and_login(client, db, "alice3@test.com")
    bob = register_and_login(client, db, "bob3@test.com")

    created = client.post("/pipeline", json={"university_id": sample_universities[0].id}, headers=alice).json()
    r = client.delete(f"/pipeline/{created['id']}", headers=bob)
    assert r.status_code == 404


@requires_groq
def test_regenerate_analysis(client, student_headers, sample_universities):
    created = client.post("/pipeline", json={"university_id": sample_universities[0].id}, headers=student_headers).json()
    r = client.post(f"/pipeline/{created['id']}/regenerate", headers=student_headers)
    assert r.status_code == 200
    assert r.json()["fit_score"] is not None


def test_regenerate_analysis_mocked(client, student_headers, sample_universities, mock_ai_client):
    """Deterministic counterpart of test_regenerate_analysis — mocks
    app.services.ai_client so this always runs in CI regardless of Groq
    availability."""
    import json as _json

    mock_ai_client.set(_json.dumps({
        "fit_score": 72,
        "strengths": ["Strong GPA", "Relevant field"],
        "gaps": ["No language certificate on file"],
        "recommendation": "A solid candidate profile for this university.",
        "motivation_letter": "A" * 400,
    }))
    created = client.post("/pipeline", json={"university_id": sample_universities[0].id}, headers=student_headers).json()
    r = client.post(f"/pipeline/{created['id']}/regenerate", headers=student_headers)
    assert r.status_code == 200
    assert r.json()["fit_score"] == 72


# ── Admin endpoints ────────────────────────────────────────────────────────

def test_admin_list_all_requires_admin(client, student_headers):
    r = client.get("/pipeline/admin/all", headers=student_headers)
    assert r.status_code == 403


def test_admin_list_all_sees_every_student(client, db, admin_headers, sample_universities):
    from tests.conftest import register_and_login

    alice = register_and_login(client, db, "alice4@test.com")
    client.post("/pipeline", json={"university_id": sample_universities[0].id}, headers=alice)

    r = client.get("/pipeline/admin/all", headers=admin_headers)
    assert r.status_code == 200
    body = r.json()
    assert body["total"] >= 1


def test_admin_set_decision_accepted(client, db, admin_headers, sample_universities):
    from tests.conftest import register_and_login

    alice = register_and_login(client, db, "alice5@test.com")
    created = client.post("/pipeline", json={"university_id": sample_universities[0].id}, headers=alice).json()

    r = client.patch(
        f"/pipeline/admin/{created['id']}/decision",
        json={"decision": "accepted", "admin_note": "Strong application"},
        headers=admin_headers,
    )
    assert r.status_code == 200
    body = r.json()
    assert body["decision"] == "accepted"
    assert body["status"] == "decision"
    assert "Strong application" in body["notes"]


def test_admin_set_decision_invalid_value_rejected(client, db, admin_headers, sample_universities):
    from tests.conftest import register_and_login

    alice = register_and_login(client, db, "alice6@test.com")
    created = client.post("/pipeline", json={"university_id": sample_universities[0].id}, headers=alice).json()

    r = client.patch(
        f"/pipeline/admin/{created['id']}/decision",
        json={"decision": "maybe-later"},
        headers=admin_headers,
    )
    assert r.status_code == 422


def test_admin_clear_decision_reverts_to_submitted(client, db, admin_headers, sample_universities):
    from tests.conftest import register_and_login

    alice = register_and_login(client, db, "alice7@test.com")
    created = client.post("/pipeline", json={"university_id": sample_universities[0].id}, headers=alice).json()

    client.patch(f"/pipeline/admin/{created['id']}/decision", json={"decision": "rejected"}, headers=admin_headers)
    r = client.patch(f"/pipeline/admin/{created['id']}/decision", json={"decision": None}, headers=admin_headers)
    assert r.status_code == 200
    body = r.json()
    assert body["decision"] is None
    assert body["status"] == "submitted"


def test_admin_decision_student_cannot_access(client, student_headers, sample_universities):
    created = client.post("/pipeline", json={"university_id": sample_universities[0].id}, headers=student_headers).json()
    r = client.patch(
        f"/pipeline/admin/{created['id']}/decision",
        json={"decision": "accepted"},
        headers=student_headers,
    )
    assert r.status_code == 403
