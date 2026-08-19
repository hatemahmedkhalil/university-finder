PROFILE_PAYLOAD = {
    "nationality": "Egyptian",
    "degree_level": "master",
    "gpa": 3.5,
    "budget_eur": 5000,
    "english_level": "c1",
    "preferred_countries": "Germany,Poland",
    "field_of_study": "Computer Science",
}


def test_create_profile(client, student_headers):
    r = client.post("/profiles", json=PROFILE_PAYLOAD, headers=student_headers)
    assert r.status_code == 201
    data = r.json()
    assert data["nationality"] == "Egyptian"
    assert data["degree_level"] == "master"
    assert data["gpa"] == 3.5


def test_create_profile_duplicate(client, student_headers):
    client.post("/profiles", json=PROFILE_PAYLOAD, headers=student_headers)
    r = client.post("/profiles", json=PROFILE_PAYLOAD, headers=student_headers)
    assert r.status_code == 409


def test_get_my_profile(client, student_headers):
    client.post("/profiles", json=PROFILE_PAYLOAD, headers=student_headers)
    r = client.get("/profiles/me", headers=student_headers)
    assert r.status_code == 200
    assert r.json()["english_level"] == "c1"


def test_get_profile_not_found(client, student_headers):
    r = client.get("/profiles/me", headers=student_headers)
    assert r.status_code == 404


def test_update_profile(client, student_headers):
    client.post("/profiles", json=PROFILE_PAYLOAD, headers=student_headers)
    r = client.patch("/profiles/me", json={"gpa": 3.9, "budget_eur": 8000}, headers=student_headers)
    assert r.status_code == 200
    data = r.json()
    assert data["gpa"] == 3.9
    assert data["budget_eur"] == 8000


def test_delete_profile(client, student_headers):
    client.post("/profiles", json=PROFILE_PAYLOAD, headers=student_headers)
    r = client.delete("/profiles/me", headers=student_headers)
    assert r.status_code == 204
    r2 = client.get("/profiles/me", headers=student_headers)
    assert r2.status_code == 404


def test_gpa_validation(client, student_headers):
    bad = {**PROFILE_PAYLOAD, "gpa": 5.0}
    r = client.post("/profiles", json=bad, headers=student_headers)
    assert r.status_code == 422


def test_profile_includes_completeness_incomplete(client, student_headers):
    # PROFILE_PAYLOAD has no full_name — the shared readiness-service
    # calculation, not a duplicated frontend one, should reflect that.
    r = client.post("/profiles", json=PROFILE_PAYLOAD, headers=student_headers)
    assert r.status_code == 201
    completeness = r.json()["completeness"]
    assert completeness["complete"] is False
    assert "Full Name" in completeness["missing_fields"]
    assert completeness["total_count"] == 8


def test_profile_completeness_true_when_all_fields_set(client, student_headers):
    full = {**PROFILE_PAYLOAD, "full_name": "Ali Hassan", "language": "german"}
    r = client.post("/profiles", json=full, headers=student_headers)
    assert r.status_code == 201
    assert r.json()["completeness"]["complete"] is True

    r2 = client.get("/profiles/me", headers=student_headers)
    assert r2.json()["completeness"]["complete"] is True
