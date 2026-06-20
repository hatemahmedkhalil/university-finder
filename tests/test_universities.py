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
