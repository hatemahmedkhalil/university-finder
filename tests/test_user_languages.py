"""Tests for /user-languages."""


def test_list_languages_empty(client, student_headers):
    r = client.get("/user-languages", headers=student_headers)
    assert r.status_code == 200
    assert r.json() == []


def test_add_language(client, student_headers):
    r = client.post("/user-languages", json={"language": "german", "level": "b1"}, headers=student_headers)
    assert r.status_code == 201
    body = r.json()
    assert body["language"] == "german"
    assert body["level"] == "B1"


def test_add_language_requires_auth(client):
    r = client.post("/user-languages", json={"language": "german", "level": "B1"})
    assert r.status_code == 401


def test_add_language_invalid_level(client, student_headers):
    r = client.post("/user-languages", json={"language": "german", "level": "Z9"}, headers=student_headers)
    assert r.status_code == 400


def test_add_language_duplicate_rejected(client, student_headers):
    client.post("/user-languages", json={"language": "german", "level": "B1"}, headers=student_headers)
    r = client.post("/user-languages", json={"language": "german", "level": "C1"}, headers=student_headers)
    assert r.status_code == 400


def test_update_language(client, student_headers):
    created = client.post("/user-languages", json={"language": "german", "level": "B1"}, headers=student_headers).json()
    r = client.patch(f"/user-languages/{created['id']}", json={"level": "C1"}, headers=student_headers)
    assert r.status_code == 200
    assert r.json()["level"] == "C1"


def test_update_language_invalid_level(client, student_headers):
    created = client.post("/user-languages", json={"language": "german", "level": "B1"}, headers=student_headers).json()
    r = client.patch(f"/user-languages/{created['id']}", json={"level": "bogus"}, headers=student_headers)
    assert r.status_code == 400


def test_update_language_not_found(client, student_headers):
    r = client.patch("/user-languages/999999", json={"level": "C1"}, headers=student_headers)
    assert r.status_code == 404


def test_update_language_wrong_owner_404(client, db, sample_universities):
    from tests.conftest import register_and_login

    alice = register_and_login(client, db, "alice_lang@test.com")
    bob = register_and_login(client, db, "bob_lang@test.com")
    created = client.post("/user-languages", json={"language": "german", "level": "B1"}, headers=alice).json()

    r = client.patch(f"/user-languages/{created['id']}", json={"level": "C1"}, headers=bob)
    assert r.status_code == 404


def test_delete_language(client, student_headers):
    created = client.post("/user-languages", json={"language": "german", "level": "B1"}, headers=student_headers).json()
    r = client.delete(f"/user-languages/{created['id']}", headers=student_headers)
    assert r.status_code == 204
    assert client.get("/user-languages", headers=student_headers).json() == []


def test_delete_language_wrong_owner_404(client, db, sample_universities):
    from tests.conftest import register_and_login

    alice = register_and_login(client, db, "alice_lang2@test.com")
    bob = register_and_login(client, db, "bob_lang2@test.com")
    created = client.post("/user-languages", json={"language": "german", "level": "B1"}, headers=alice).json()

    r = client.delete(f"/user-languages/{created['id']}", headers=bob)
    assert r.status_code == 404
