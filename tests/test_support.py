"""Tests for /support — student ticket + admin reply threads."""


def _submit(client, headers, subject="Cannot access my account", message="I keep getting logged out unexpectedly."):
    return client.post("/support", json={"subject": subject, "message": message}, headers=headers)


def test_submit_ticket(client, student_headers):
    r = _submit(client, student_headers)
    assert r.status_code == 201
    body = r.json()
    assert body["status"] == "waiting_admin"
    assert len(body["conversation"]) == 1
    assert body["conversation"][0]["sender_role"] == "student"


def test_submit_ticket_requires_auth(client):
    r = client.post("/support", json={"subject": "x" * 5, "message": "y" * 15})
    assert r.status_code == 401


def test_submit_ticket_too_short_rejected(client, student_headers):
    r = client.post("/support", json={"subject": "ab", "message": "short"}, headers=student_headers)
    assert r.status_code == 422


def test_my_tickets(client, student_headers):
    _submit(client, student_headers)
    r = client.get("/support/my", headers=student_headers)
    assert r.status_code == 200
    assert len(r.json()) == 1


def test_my_tickets_isolated_between_users(client, db, sample_universities):
    from tests.conftest import register_and_login

    alice = register_and_login(client, db, "alice_support@test.com")
    bob = register_and_login(client, db, "bob_support@test.com")
    _submit(client, alice)

    r = client.get("/support/my", headers=bob)
    assert r.json() == []


def test_student_followup(client, student_headers):
    ticket = _submit(client, student_headers).json()
    r = client.post(f"/support/{ticket['id']}/message", json={"message": "Any update?"}, headers=student_headers)
    assert r.status_code == 200
    assert len(r.json()["conversation"]) == 2


def test_student_followup_wrong_owner_forbidden(client, db, sample_universities):
    from tests.conftest import register_and_login

    alice = register_and_login(client, db, "alice_support2@test.com")
    bob = register_and_login(client, db, "bob_support2@test.com")
    ticket = _submit(client, alice).json()

    r = client.post(f"/support/{ticket['id']}/message", json={"message": "Hijack attempt"}, headers=bob)
    assert r.status_code == 403


def test_student_followup_not_found(client, student_headers):
    r = client.post("/support/999999/message", json={"message": "x"}, headers=student_headers)
    assert r.status_code == 404


# ── Admin endpoints ──────────────────────────────────────────────────────────

def test_admin_list_tickets_requires_admin(client, student_headers):
    r = client.get("/support", headers=student_headers)
    assert r.status_code == 403


def test_admin_list_tickets(client, student_headers, admin_headers):
    _submit(client, student_headers)
    r = client.get("/support", headers=admin_headers)
    assert r.status_code == 200
    assert len(r.json()) == 1


def test_admin_stats(client, student_headers, admin_headers):
    _submit(client, student_headers)
    r = client.get("/support/stats", headers=admin_headers)
    assert r.status_code == 200
    body = r.json()
    assert body["total"] == 1
    assert body["waiting_admin"] == 1


def test_admin_get_ticket(client, student_headers, admin_headers):
    ticket = _submit(client, student_headers).json()
    r = client.get(f"/support/{ticket['id']}", headers=admin_headers)
    assert r.status_code == 200


def test_admin_get_ticket_not_found(client, admin_headers):
    r = client.get("/support/999999", headers=admin_headers)
    assert r.status_code == 404


def test_admin_reply(client, student_headers, admin_headers):
    ticket = _submit(client, student_headers).json()
    r = client.post(f"/support/{ticket['id']}/reply", json={"reply": "We're looking into it"}, headers=admin_headers)
    assert r.status_code == 200
    body = r.json()
    assert body["admin_reply"] == "We're looking into it"
    assert body["status"] == "waiting_student"
    assert len(body["conversation"]) == 2


def test_admin_reply_creates_notification(client, student_headers, admin_headers):
    from app.models.notification import Notification
    from app.core.security import decode_token

    ticket = _submit(client, student_headers).json()
    client.post(f"/support/{ticket['id']}/reply", json={"reply": "Fixed!"}, headers=admin_headers)

    notif = client.get("/notifications", headers=student_headers)
    assert notif.status_code == 200
    assert len(notif.json()) == 1
    assert notif.json()[0]["type"] == "support_reply"


def test_admin_reply_empty_rejected(client, student_headers, admin_headers):
    ticket = _submit(client, student_headers).json()
    r = client.post(f"/support/{ticket['id']}/reply", json={"reply": " "}, headers=admin_headers)
    assert r.status_code == 400


def test_admin_update_status(client, student_headers, admin_headers):
    ticket = _submit(client, student_headers).json()
    r = client.patch(f"/support/{ticket['id']}/status", json={"status": "resolved"}, headers=admin_headers)
    assert r.status_code == 200
    assert r.json()["status"] == "resolved"


def test_admin_update_status_invalid(client, student_headers, admin_headers):
    ticket = _submit(client, student_headers).json()
    r = client.patch(f"/support/{ticket['id']}/status", json={"status": "bogus"}, headers=admin_headers)
    assert r.status_code == 400


def test_admin_delete_ticket(client, student_headers, admin_headers):
    ticket = _submit(client, student_headers).json()
    r = client.delete(f"/support/{ticket['id']}", headers=admin_headers)
    assert r.status_code == 204
    assert client.get(f"/support/{ticket['id']}", headers=admin_headers).status_code == 404
