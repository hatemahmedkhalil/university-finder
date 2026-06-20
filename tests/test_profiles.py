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
