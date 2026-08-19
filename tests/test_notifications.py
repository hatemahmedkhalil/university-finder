"""Tests for /notifications."""
from app.models.notification import Notification
from app.core.security import decode_token


def _user_id(headers):
    return int(decode_token(headers["Authorization"].split(" ")[1], "access")[0])


def test_list_notifications_empty(client, student_headers):
    r = client.get("/notifications", headers=student_headers)
    assert r.status_code == 200
    assert r.json() == []


def test_list_notifications(client, db, student_headers):
    uid = _user_id(student_headers)
    db.add(Notification(user_id=uid, title="Deadline soon", message="Your TU Munich deadline is in 5 days", type="ai_insight"))
    db.commit()

    r = client.get("/notifications", headers=student_headers)
    assert r.status_code == 200
    body = r.json()
    assert len(body) == 1
    assert body[0]["title"] == "Deadline soon"
    assert body[0]["is_read"] is False


def test_notifications_isolated_between_users(client, db, sample_universities):
    from tests.conftest import register_and_login

    alice = register_and_login(client, db, "alice_notif@test.com")
    bob = register_and_login(client, db, "bob_notif@test.com")
    alice_id = _user_id(alice)

    db.add(Notification(user_id=alice_id, title="Alice-only", message="x", type="ai_insight"))
    db.commit()

    r = client.get("/notifications", headers=bob)
    assert r.json() == []


def test_unread_count_zero(client, student_headers):
    r = client.get("/notifications/unread-count", headers=student_headers)
    assert r.status_code == 200
    assert r.json() == {"count": 0}


def test_unread_count(client, db, student_headers):
    uid = _user_id(student_headers)
    db.add(Notification(user_id=uid, title="A", message="x", type="ai_insight"))
    db.add(Notification(user_id=uid, title="B", message="y", type="ai_insight", is_read=True))
    db.commit()

    r = client.get("/notifications/unread-count", headers=student_headers)
    assert r.json() == {"count": 1}


def test_mark_read(client, db, student_headers):
    uid = _user_id(student_headers)
    n = Notification(user_id=uid, title="A", message="x", type="ai_insight")
    db.add(n)
    db.commit()
    db.refresh(n)

    r = client.post(f"/notifications/{n.id}/read", headers=student_headers)
    assert r.status_code == 200
    assert r.json() == {"ok": True}

    r2 = client.get("/notifications/unread-count", headers=student_headers)
    assert r2.json() == {"count": 0}


def test_mark_read_wrong_owner_noop(client, db, sample_universities):
    from tests.conftest import register_and_login

    alice = register_and_login(client, db, "alice_notif2@test.com")
    bob = register_and_login(client, db, "bob_notif2@test.com")
    alice_id = _user_id(alice)

    n = Notification(user_id=alice_id, title="A", message="x", type="ai_insight")
    db.add(n)
    db.commit()
    db.refresh(n)

    r = client.post(f"/notifications/{n.id}/read", headers=bob)
    assert r.status_code == 200  # silently no-ops rather than 403/404

    still_unread = client.get("/notifications/unread-count", headers=alice)
    assert still_unread.json() == {"count": 1}


def test_mark_read_nonexistent_ok(client, student_headers):
    r = client.post("/notifications/999999/read", headers=student_headers)
    assert r.status_code == 200


def test_mark_all_read(client, db, student_headers):
    uid = _user_id(student_headers)
    db.add(Notification(user_id=uid, title="A", message="x", type="ai_insight"))
    db.add(Notification(user_id=uid, title="B", message="y", type="ai_insight"))
    db.commit()

    r = client.post("/notifications/read-all", headers=student_headers)
    assert r.status_code == 200

    r2 = client.get("/notifications/unread-count", headers=student_headers)
    assert r2.json() == {"count": 0}


def test_notifications_require_auth(client):
    r = client.get("/notifications")
    assert r.status_code == 401
