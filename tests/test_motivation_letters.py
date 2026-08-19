"""Tests for /motivation-letters. generate_letter makes a real Groq call
(GROQ_API_KEY is loaded from the real .env), matching the pattern used
elsewhere in this suite for live-AI endpoints."""


from tests.conftest import requires_groq

def test_list_letters_empty(client, student_headers):
    r = client.get("/motivation-letters", headers=student_headers)
    assert r.status_code == 200
    assert r.json() == []


def test_save_letter(client, student_headers, sample_universities):
    uni = sample_universities[0]
    r = client.post(
        "/motivation-letters",
        json={"university_id": uni.id, "university_name": uni.name, "program": "Computer Science", "content": "Dear admissions committee, I am writing to express my interest..."},
        headers=student_headers,
    )
    assert r.status_code == 201
    assert r.json()["program"] == "Computer Science"


def test_save_letter_requires_auth(client):
    r = client.post("/motivation-letters", json={"content": "A" * 20})
    assert r.status_code == 401


def test_save_letter_too_short_rejected(client, student_headers):
    r = client.post("/motivation-letters", json={"content": "short"}, headers=student_headers)
    assert r.status_code == 422


def test_list_letters(client, student_headers):
    client.post("/motivation-letters", json={"content": "A" * 20}, headers=student_headers)
    r = client.get("/motivation-letters", headers=student_headers)
    assert len(r.json()) == 1


def test_update_letter(client, student_headers):
    created = client.post("/motivation-letters", json={"content": "A" * 20}, headers=student_headers).json()
    r = client.patch(f"/motivation-letters/{created['id']}", json={"content": "B" * 30, "program": "Law"}, headers=student_headers)
    assert r.status_code == 200
    assert r.json()["content"] == "B" * 30
    assert r.json()["program"] == "Law"


def test_update_letter_not_found(client, student_headers):
    r = client.patch("/motivation-letters/999999", json={"content": "A" * 20}, headers=student_headers)
    assert r.status_code == 404


def test_update_letter_wrong_owner_404(client, db, sample_universities):
    from tests.conftest import register_and_login

    alice = register_and_login(client, db, "alice_letter@test.com")
    bob = register_and_login(client, db, "bob_letter@test.com")
    created = client.post("/motivation-letters", json={"content": "A" * 20}, headers=alice).json()

    r = client.patch(f"/motivation-letters/{created['id']}", json={"content": "hijacked" * 5}, headers=bob)
    assert r.status_code == 404


def test_delete_letter(client, student_headers):
    created = client.post("/motivation-letters", json={"content": "A" * 20}, headers=student_headers).json()
    r = client.delete(f"/motivation-letters/{created['id']}", headers=student_headers)
    assert r.status_code == 204
    assert client.get("/motivation-letters", headers=student_headers).json() == []


def test_delete_letter_wrong_owner_404(client, db, sample_universities):
    from tests.conftest import register_and_login

    alice = register_and_login(client, db, "alice_letter2@test.com")
    bob = register_and_login(client, db, "bob_letter2@test.com")
    created = client.post("/motivation-letters", json={"content": "A" * 20}, headers=alice).json()

    r = client.delete(f"/motivation-letters/{created['id']}", headers=bob)
    assert r.status_code == 404


@requires_groq
def test_generate_letter(client, student_headers, sample_universities):
    uni = sample_universities[0]
    r = client.post(
        "/motivation-letters/generate",
        json={"university_id": uni.id, "program": "Computer Science"},
        headers=student_headers,
    )
    assert r.status_code == 200
    assert len(r.json()["content"]) > 50


def test_generate_letter_mocked(client, student_headers, sample_universities, mock_ai_client):
    """Deterministic counterpart of test_generate_letter — mocks
    app.services.ai_client so this always runs in CI regardless of Groq
    availability."""
    mock_ai_client.set("A" * 60)
    uni = sample_universities[0]
    r = client.post(
        "/motivation-letters/generate",
        json={"university_id": uni.id, "program": "Computer Science"},
        headers=student_headers,
    )
    assert r.status_code == 200
    assert len(r.json()["content"]) > 50


def test_generate_letter_requires_auth(client):
    r = client.post("/motivation-letters/generate", json={})
    assert r.status_code == 401
