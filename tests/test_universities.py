UNI_PAYLOAD = {
    "name": "Test University",
    "country": "Germany",
    "city": "Berlin",
    "ranking": 200,
    "tuition_fee_eur": 0,
    "is_public": True,
    "english_programs_available": True,
}


def test_create_university_as_admin(client, admin_headers):
    r = client.post("/universities", json=UNI_PAYLOAD, headers=admin_headers)
    assert r.status_code == 201
    assert r.json()["name"] == "Test University"


def test_create_university_as_student_forbidden(client, student_headers):
    r = client.post("/universities", json=UNI_PAYLOAD, headers=student_headers)
    assert r.status_code == 403


def test_list_universities(client, admin_headers, sample_universities):
    r = client.get("/universities", headers=admin_headers)
    assert r.status_code == 200
    data = r.json()
    assert "items" in data
    assert "total" in data
    assert data["total"] >= 3


def test_list_universities_country_filter(client, admin_headers, sample_universities):
    r = client.get("/universities?country=Germany", headers=admin_headers)
    assert r.status_code == 200
    for uni in r.json()["items"]:
        assert "Germany" in uni["country"]


def test_list_universities_english_only(client, admin_headers, sample_universities):
    r = client.get("/universities?english_only=true", headers=admin_headers)
    assert r.status_code == 200
    for uni in r.json()["items"]:
        assert uni["english_programs_available"] is True


def test_list_universities_search(client, admin_headers, sample_universities):
    r = client.get("/universities?search=Munich", headers=admin_headers)
    assert r.status_code == 200
    names = [u["name"] for u in r.json()["items"]]
    assert any("Munich" in n for n in names)


def test_get_university(client, student_headers, sample_universities):
    uni_id = sample_universities[0].id
    r = client.get(f"/universities/{uni_id}", headers=student_headers)
    assert r.status_code == 200
    assert r.json()["id"] == uni_id


def test_get_university_not_found(client, student_headers):
    r = client.get("/universities/999999", headers=student_headers)
    assert r.status_code == 404


def test_update_university_as_admin(client, admin_headers, sample_universities):
    uni_id = sample_universities[0].id
    r = client.patch(f"/universities/{uni_id}", json={"ranking": 42}, headers=admin_headers)
    assert r.status_code == 200
    assert r.json()["ranking"] == 42


def test_update_university_as_student_forbidden(client, student_headers, sample_universities):
    uni_id = sample_universities[0].id
    r = client.patch(f"/universities/{uni_id}", json={"ranking": 1}, headers=student_headers)
    assert r.status_code == 403


def test_delete_university_as_admin(client, admin_headers, sample_universities):
    uni_id = sample_universities[2].id
    r = client.delete(f"/universities/{uni_id}", headers=admin_headers)
    assert r.status_code == 204


def test_invalid_website_url(client, admin_headers):
    bad = {**UNI_PAYLOAD, "website": "not-a-url"}
    r = client.post("/universities", json=bad, headers=admin_headers)
    assert r.status_code == 422


def test_pagination(client, admin_headers, sample_universities):
    r = client.get("/universities?skip=0&limit=2", headers=admin_headers)
    assert r.status_code == 200
    data = r.json()
    assert len(data["items"]) <= 2
    assert data["skip"] == 0
    assert data["limit"] == 2


# ── Document items — verification/traceability fields (Phase 2) ────────────

def test_create_document_item_defaults_to_unverified(client, admin_headers, sample_universities):
    uni_id = sample_universities[0].id
    r = client.post(f"/universities/{uni_id}/documents", json={"name": "Passport copy"}, headers=admin_headers)
    assert r.status_code == 201
    body = r.json()
    assert body["verification_status"] == "unverified"
    assert body["source_url"] is None
    assert body["condition"] is None


def test_create_document_item_with_full_verification_metadata(client, admin_headers, sample_universities):
    uni_id = sample_universities[0].id
    r = client.post(f"/universities/{uni_id}/documents", json={
        "name": "APS Certificate",
        "is_required": True,
        "condition": {"type": "nationality", "values": ["China", "Vietnam"]},
        "source_url": "https://official-university.edu/admissions/aps",
        "evidence_text": "Applicants from China and Vietnam must submit an APS certificate.",
        "verification_status": "verified",
        "verified_at": "2026-08-01",
    }, headers=admin_headers)
    assert r.status_code == 201
    body = r.json()
    assert body["verification_status"] == "verified"
    assert body["condition"]["values"] == ["China", "Vietnam"]
    assert body["source_url"].startswith("https://")
    assert body["verified_at"] == "2026-08-01"


def test_create_document_item_rejects_invalid_verification_status(client, admin_headers, sample_universities):
    uni_id = sample_universities[0].id
    r = client.post(f"/universities/{uni_id}/documents", json={"name": "X", "verification_status": "definitely_true"}, headers=admin_headers)
    assert r.status_code == 422


def test_update_document_item_verification_status(client, admin_headers, sample_universities):
    uni_id = sample_universities[0].id
    created = client.post(f"/universities/{uni_id}/documents", json={"name": "CV"}, headers=admin_headers).json()
    r = client.patch(f"/universities/{uni_id}/documents/{created['id']}", json={
        "verification_status": "partially_verified",
        "source_url": "https://official-university.edu/cv-info",
        "evidence_text": "A CV must be submitted with the application.",
    }, headers=admin_headers)
    assert r.status_code == 200
    assert r.json()["verification_status"] == "partially_verified"


def test_update_document_item_verified_without_evidence_rejected(client, admin_headers, sample_universities):
    """NO CLAIM WITHOUT PROOF: a PATCH that sets verification_status='verified'
    without the item already having (or this call also providing) source_url/
    evidence_text/verified_at must be rejected — even though PATCH only sends
    the fields it changes, the invariant is checked against the final state."""
    uni_id = sample_universities[0].id
    created = client.post(f"/universities/{uni_id}/documents", json={"name": "CV"}, headers=admin_headers).json()
    r = client.patch(f"/universities/{uni_id}/documents/{created['id']}", json={
        "verification_status": "verified",
    }, headers=admin_headers)
    assert r.status_code == 422
    # The row must be untouched — still unverified, not silently half-applied.
    check = client.get(f"/universities/{uni_id}/documents", headers=admin_headers).json()
    assert next(i for i in check if i["id"] == created["id"])["verification_status"] == "unverified"


def test_create_document_item_verified_without_evidence_rejected(client, admin_headers, sample_universities):
    uni_id = sample_universities[0].id
    r = client.post(f"/universities/{uni_id}/documents", json={
        "name": "CV", "verification_status": "verified",
    }, headers=admin_headers)
    assert r.status_code == 422


def test_document_item_create_requires_admin(client, student_headers, sample_universities):
    uni_id = sample_universities[0].id
    r = client.post(f"/universities/{uni_id}/documents", json={"name": "X"}, headers=student_headers)
    assert r.status_code == 403


def test_conditional_item_must_stay_required_true(client, admin_headers, sample_universities):
    """Regression: the old anti-pattern set is_required=False on conditional
    items (condition baked into freetext name instead of structured data) —
    a real Phase 3 pilot bug where a DB row was left with is_required=False
    after adding a structured `condition`, silently making it never required
    even for a student the condition DOES apply to. A conditional item's
    is_required must be True; `condition` narrows WHO it applies to, not
    whether it's required when it does apply."""
    uni_id = sample_universities[0].id
    r = client.post(f"/universities/{uni_id}/documents", json={
        "name": "APS Certificate",
        "is_required": True,
        "condition": {"type": "nationality", "values": ["China", "India", "Vietnam"]},
        "verification_status": "verified",
        "source_url": "https://official-university.edu/aps",
        "evidence_text": "Applicants from China, India and Vietnam must submit an APS certificate.",
        "verified_at": "2026-08-16",
    }, headers=admin_headers)
    assert r.status_code == 201
    assert r.json()["is_required"] is True


# ── Deadline endpoints (Phase 3.5 — auditable deadline evidence) ────────────

def test_create_deadline_defaults_to_unverified(client, admin_headers, sample_universities):
    uni_id = sample_universities[0].id
    r = client.post(f"/universities/{uni_id}/deadlines", json={
        "label": "Winter semester", "deadline_text": "15 July",
    }, headers=admin_headers)
    assert r.status_code == 201
    assert r.json()["verification_status"] == "unverified"


def test_create_deadline_verified_requires_evidence(client, admin_headers, sample_universities):
    uni_id = sample_universities[0].id
    r = client.post(f"/universities/{uni_id}/deadlines", json={
        "label": "Winter semester", "deadline_text": "15 July", "verification_status": "verified",
    }, headers=admin_headers)
    assert r.status_code == 422


def test_create_deadline_verified_with_full_evidence(client, admin_headers, sample_universities):
    uni_id = sample_universities[0].id
    r = client.post(f"/universities/{uni_id}/deadlines", json={
        "label": "Winter semester", "deadline_text": "15 July", "cycle": "2026/27",
        "source_url": "https://official-university.edu/deadlines",
        "evidence_text": "The winter semester application deadline is 15 July.",
        "verification_status": "verified", "verified_at": "2026-08-16",
    }, headers=admin_headers)
    assert r.status_code == 201
    assert r.json()["cycle"] == "2026/27"


def test_list_deadlines(client, admin_headers, sample_universities):
    uni_id = sample_universities[0].id
    client.post(f"/universities/{uni_id}/deadlines", json={"label": "Winter", "deadline_text": "15 July"}, headers=admin_headers)
    r = client.get(f"/universities/{uni_id}/deadlines", headers=admin_headers)
    assert r.status_code == 200
    assert len(r.json()) == 1


def test_update_deadline_to_verified_without_evidence_rejected(client, admin_headers, sample_universities):
    uni_id = sample_universities[0].id
    created = client.post(f"/universities/{uni_id}/deadlines", json={"label": "Winter", "deadline_text": "15 July"}, headers=admin_headers).json()
    r = client.patch(f"/universities/{uni_id}/deadlines/{created['id']}", json={"verification_status": "verified"}, headers=admin_headers)
    assert r.status_code == 422


def test_delete_deadline(client, admin_headers, sample_universities):
    uni_id = sample_universities[0].id
    created = client.post(f"/universities/{uni_id}/deadlines", json={"label": "Winter", "deadline_text": "15 July"}, headers=admin_headers).json()
    r = client.delete(f"/universities/{uni_id}/deadlines/{created['id']}", headers=admin_headers)
    assert r.status_code == 204
    assert client.get(f"/universities/{uni_id}/deadlines", headers=admin_headers).json() == []


def test_deadline_create_requires_admin(client, student_headers, sample_universities):
    uni_id = sample_universities[0].id
    r = client.post(f"/universities/{uni_id}/deadlines", json={"label": "Winter", "deadline_text": "15 July"}, headers=student_headers)
    assert r.status_code == 403
