SCHOLARSHIP_PAYLOAD = {
    "name": "Test Scholarship",
    "provider": "Test Foundation",
    "scholarship_type": "merit",
    "amount_eur": 5000,
    "link": "https://example.com/scholarship",
}


def test_create_scholarship_as_admin(client, admin_headers):
    r = client.post("/scholarships", json=SCHOLARSHIP_PAYLOAD, headers=admin_headers)
    assert r.status_code == 201
    data = r.json()
    assert data["name"] == "Test Scholarship"
    assert data["scholarship_type"] == "merit"


def test_create_scholarship_as_student_forbidden(client, student_headers):
    r = client.post("/scholarships", json=SCHOLARSHIP_PAYLOAD, headers=student_headers)
    assert r.status_code == 403


def test_list_scholarships(client, student_headers, admin_headers):
    client.post("/scholarships", json=SCHOLARSHIP_PAYLOAD, headers=admin_headers)
    r = client.get("/scholarships", headers=student_headers)
    assert r.status_code == 200
    data = r.json()
    assert "items" in data
    assert data["total"] >= 1


def test_filter_by_type(client, student_headers, admin_headers):
    client.post("/scholarships", json=SCHOLARSHIP_PAYLOAD, headers=admin_headers)
    r = client.get("/scholarships?scholarship_type=merit", headers=student_headers)
    assert r.status_code == 200
    for s in r.json()["items"]:
        assert s["scholarship_type"] == "merit"


def test_get_scholarship(client, student_headers, admin_headers):
    created = client.post("/scholarships", json=SCHOLARSHIP_PAYLOAD, headers=admin_headers).json()
    r = client.get(f"/scholarships/{created['id']}", headers=student_headers)
    assert r.status_code == 200


def test_get_scholarship_not_found(client, student_headers):
    r = client.get("/scholarships/999999", headers=student_headers)
    assert r.status_code == 404


def test_update_scholarship_as_admin(client, admin_headers):
    created = client.post("/scholarships", json=SCHOLARSHIP_PAYLOAD, headers=admin_headers).json()
    r = client.patch(f"/scholarships/{created['id']}", json={"amount_eur": 9000}, headers=admin_headers)
    assert r.status_code == 200
    assert r.json()["amount_eur"] == 9000


def test_delete_scholarship_as_admin(client, admin_headers):
    created = client.post("/scholarships", json=SCHOLARSHIP_PAYLOAD, headers=admin_headers).json()
    r = client.delete(f"/scholarships/{created['id']}", headers=admin_headers)
    assert r.status_code == 204


def test_invalid_link_url(client, admin_headers):
    bad = {**SCHOLARSHIP_PAYLOAD, "link": "not-a-url"}
    r = client.post("/scholarships", json=bad, headers=admin_headers)
    assert r.status_code == 422
