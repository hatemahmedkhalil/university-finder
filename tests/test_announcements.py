"""Tests for /announcements. Regression coverage for the missing
announcement_reads table bug found and fixed earlier (migration existed
but was never applied to the real DB — /announcements 500'd on every load)."""


def test_list_announcements_empty(client, student_headers):
    r = client.get("/announcements", headers=student_headers)
    assert r.status_code == 200
    assert r.json() == []


def test_create_announcement_requires_admin(client, student_headers):
    r = client.post("/announcements", json={"title": "New feature", "body": "Check it out"}, headers=student_headers)
    assert r.status_code == 403


def test_create_and_list_announcement(client, admin_headers, student_headers):
    created = client.post("/announcements", json={"title": "New feature", "body": "Check it out"}, headers=admin_headers)
    assert created.status_code == 200
    assert created.json()["is_read"] is False

    r = client.get("/announcements", headers=student_headers)
    assert len(r.json()) == 1
    assert r.json()[0]["title"] == "New feature"


def test_unpublished_announcement_hidden(client, admin_headers, student_headers):
    client.post("/announcements", json={"title": "Draft", "body": "Not ready", "is_published": False}, headers=admin_headers)
    r = client.get("/announcements", headers=student_headers)
    assert r.json() == []


def test_targeted_announcement_only_visible_to_target(client, db, admin_headers):
    from tests.conftest import register_and_login
    from app.core.security import decode_token

    alice = register_and_login(client, db, "alice_ann@test.com")
    bob = register_and_login(client, db, "bob_ann@test.com")
    alice_id = int(decode_token(alice["Authorization"].split(" ")[1], "access")[0])

    client.post("/announcements", json={"title": "Just for you", "body": "hi", "target_user_id": alice_id}, headers=admin_headers)

    assert len(client.get("/announcements", headers=alice).json()) == 1
    assert len(client.get("/announcements", headers=bob).json()) == 0


def test_get_announcement(client, admin_headers, student_headers):
    created = client.post("/announcements", json={"title": "T", "body": "B"}, headers=admin_headers).json()
    r = client.get(f"/announcements/{created['id']}", headers=student_headers)
    assert r.status_code == 200
    assert r.json()["is_read"] is False


def test_get_announcement_not_found(client, student_headers):
    r = client.get("/announcements/999999", headers=student_headers)
    assert r.status_code == 404


def test_unread_count(client, admin_headers, student_headers):
    client.post("/announcements", json={"title": "A", "body": "x"}, headers=admin_headers)
    client.post("/announcements", json={"title": "B", "body": "y"}, headers=admin_headers)

    r = client.get("/announcements/unread-count", headers=student_headers)
    assert r.json() == {"count": 2}


def test_mark_as_read(client, admin_headers, student_headers):
    created = client.post("/announcements", json={"title": "A", "body": "x"}, headers=admin_headers).json()
    r = client.post(f"/announcements/{created['id']}/read", headers=student_headers)
    assert r.status_code == 200

    listed = client.get("/announcements", headers=student_headers).json()
    assert listed[0]["is_read"] is True

    count = client.get("/announcements/unread-count", headers=student_headers)
    assert count.json() == {"count": 0}


def test_mark_as_read_not_found(client, student_headers):
    r = client.post("/announcements/999999/read", headers=student_headers)
    assert r.status_code == 404


def test_mark_as_read_idempotent(client, admin_headers, student_headers):
    created = client.post("/announcements", json={"title": "A", "body": "x"}, headers=admin_headers).json()
    client.post(f"/announcements/{created['id']}/read", headers=student_headers)
    r = client.post(f"/announcements/{created['id']}/read", headers=student_headers)
    assert r.status_code == 200  # no duplicate-key crash on second read


def test_mark_all_read(client, admin_headers, student_headers):
    client.post("/announcements", json={"title": "A", "body": "x"}, headers=admin_headers)
    client.post("/announcements", json={"title": "B", "body": "y"}, headers=admin_headers)

    r = client.post("/announcements/read-all", headers=student_headers)
    assert r.status_code == 200
    assert r.json()["marked"] == 2

    count = client.get("/announcements/unread-count", headers=student_headers)
    assert count.json() == {"count": 0}


def test_update_announcement(client, admin_headers):
    created = client.post("/announcements", json={"title": "Old", "body": "x"}, headers=admin_headers).json()
    r = client.patch(f"/announcements/{created['id']}", json={"title": "New"}, headers=admin_headers)
    assert r.status_code == 200
    assert r.json()["title"] == "New"


def test_update_announcement_not_found(client, admin_headers):
    r = client.patch("/announcements/999999", json={"title": "x"}, headers=admin_headers)
    assert r.status_code == 404


def test_delete_announcement(client, admin_headers, student_headers):
    created = client.post("/announcements", json={"title": "Bye", "body": "x"}, headers=admin_headers).json()
    r = client.delete(f"/announcements/{created['id']}", headers=admin_headers)
    assert r.status_code == 200

    assert client.get("/announcements", headers=student_headers).json() == []


def test_delete_announcement_requires_admin(client, admin_headers, student_headers):
    created = client.post("/announcements", json={"title": "Bye", "body": "x"}, headers=admin_headers).json()
    r = client.delete(f"/announcements/{created['id']}", headers=student_headers)
    assert r.status_code == 403
