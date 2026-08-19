"""Tests for /users (admin-only user directory)."""


def test_list_users_requires_admin(client, student_headers):
    r = client.get("/users", headers=student_headers)
    assert r.status_code == 403


def test_list_users(client, admin_headers, db):
    from tests.conftest import register_and_login

    register_and_login(client, db, "someone@test.com")
    r = client.get("/users", headers=admin_headers)
    assert r.status_code == 200
    body = r.json()
    assert body["total"] >= 1
    assert "items" in body


def test_list_users_search(client, admin_headers, db):
    from tests.conftest import register_and_login

    register_and_login(client, db, "findme_unique@test.com")
    r = client.get("/users", params={"search": "findme_unique"}, headers=admin_headers)
    body = r.json()
    assert body["total"] == 1
    assert body["items"][0]["email"] == "findme_unique@test.com"


def test_list_users_filter_by_role(client, admin_headers, db):
    from tests.conftest import register_and_login

    register_and_login(client, db, "roletest@test.com", role="student")
    r = client.get("/users", params={"role": "admin"}, headers=admin_headers)
    emails = {u["email"] for u in r.json()["items"]}
    assert "roletest@test.com" not in emails


def test_get_user(client, admin_headers, db):
    from tests.conftest import register_and_login
    from app.core.security import decode_token

    headers = register_and_login(client, db, "getme@test.com")
    uid = int(decode_token(headers["Authorization"].split(" ")[1], "access")[0])

    r = client.get(f"/users/{uid}", headers=admin_headers)
    assert r.status_code == 200
    assert r.json()["email"] == "getme@test.com"


def test_get_user_requires_admin(client, student_headers):
    r = client.get("/users/1", headers=student_headers)
    assert r.status_code == 403


def test_get_user_not_found(client, admin_headers):
    """Regression test: previously crashed with a ResponseValidationError
    (500) instead of a clean 404 when the user id doesn't exist."""
    r = client.get("/users/999999", headers=admin_headers)
    assert r.status_code == 404
