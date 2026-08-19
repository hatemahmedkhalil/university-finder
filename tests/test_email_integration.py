"""Tests for /email-integration — Gmail-forwarding inbox tracking."""


def test_get_link_status_none(client, student_headers):
    r = client.get("/email-integration/status", headers=student_headers)
    assert r.status_code == 200
    assert r.json() is None


def test_link_email_requires_consent(client, student_headers):
    r = client.post("/email-integration/link", json={"linked_email": "me@gmail.com", "consent_given": False}, headers=student_headers)
    assert r.status_code == 400


def test_link_email(client, student_headers):
    r = client.post("/email-integration/link", json={"linked_email": "me@gmail.com", "consent_given": True}, headers=student_headers)
    assert r.status_code == 200
    body = r.json()
    assert body["linked_email"] == "me@gmail.com"
    assert body["forwarding_confirmed"] is False


def test_link_email_replaces_existing(client, student_headers):
    client.post("/email-integration/link", json={"linked_email": "old@gmail.com", "consent_given": True}, headers=student_headers)
    r = client.post("/email-integration/link", json={"linked_email": "new@gmail.com", "consent_given": True}, headers=student_headers)
    assert r.json()["linked_email"] == "new@gmail.com"

    status = client.get("/email-integration/status", headers=student_headers)
    assert status.json()["linked_email"] == "new@gmail.com"


def test_link_email_requires_auth(client):
    r = client.post("/email-integration/link", json={"linked_email": "me@gmail.com", "consent_given": True})
    assert r.status_code == 401


def test_confirm_forwarding(client, student_headers):
    client.post("/email-integration/link", json={"linked_email": "me@gmail.com", "consent_given": True}, headers=student_headers)
    r = client.post("/email-integration/confirm-forwarding", headers=student_headers)
    assert r.status_code == 200
    assert r.json()["forwarding_confirmed"] is True


def test_confirm_forwarding_no_link_404(client, student_headers):
    r = client.post("/email-integration/confirm-forwarding", headers=student_headers)
    assert r.status_code == 404


def test_unlink_email(client, student_headers):
    client.post("/email-integration/link", json={"linked_email": "me@gmail.com", "consent_given": True}, headers=student_headers)
    r = client.delete("/email-integration/unlink", headers=student_headers)
    assert r.status_code == 204

    status = client.get("/email-integration/status", headers=student_headers)
    assert status.json() is None


def test_list_emails_empty(client, student_headers):
    r = client.get("/email-integration/emails", headers=student_headers)
    assert r.status_code == 200
    assert r.json() == []


# ── Inbound webhook ──────────────────────────────────────────────────────────

def test_inbound_webhook_unmatched(client, student_headers):
    """No linked email matches -> silently ignored, not an error."""
    r = client.post("/email-integration/inbound", data={
        "from": "admissions@tum.de",
        "subject": "Congratulations on your admission",
        "plain": "We are pleased to inform you...",
    })
    assert r.status_code == 200
    assert r.json()["status"] == "unmatched"


def test_inbound_webhook_matched_creates_email_notification_and_event(client, db, student_headers):
    import json

    client.post("/email-integration/link", json={"linked_email": "student@gmail.com", "consent_given": True}, headers=student_headers)

    r = client.post("/email-integration/inbound", data={
        "from": "admissions@tum.de",
        "subject": "Congratulations, you have been admitted",
        "plain": "We are pleased to inform you that you have been accepted.",
        "headers": json.dumps({"X-Original-To": "student@gmail.com"}),
    })
    assert r.status_code == 200
    assert r.json()["status"] == "ok"

    emails = client.get("/email-integration/emails", headers=student_headers)
    assert len(emails.json()) == 1
    assert emails.json()[0]["detected_status"] == "accepted"
    assert emails.json()[0]["detected_university"] == "TU Munich"

    notif = client.get("/notifications", headers=student_headers)
    assert len(notif.json()) == 1

    events = client.get("/calendar", headers=student_headers)
    assert len(events.json()) == 1
    assert events.json()[0]["event_type"] == "accepted"


def test_inbound_webhook_rejects_wrong_secret(client, monkeypatch):
    from app.config import settings

    monkeypatch.setattr(settings, "EMAIL_WEBHOOK_SECRET", "correct-secret", raising=False)
    r = client.post(
        "/email-integration/inbound",
        data={"from": "x@y.com", "subject": "s", "plain": "b"},
        headers={"x-webhook-secret": "wrong"},
    )
    assert r.status_code == 403


def test_mark_email_read(client, db, student_headers):
    import json

    client.post("/email-integration/link", json={"linked_email": "student2@gmail.com", "consent_given": True}, headers=student_headers)
    client.post("/email-integration/inbound", data={
        "from": "x@y.com", "subject": "Update", "plain": "text",
        "headers": json.dumps({"X-Original-To": "student2@gmail.com"}),
    })
    emails = client.get("/email-integration/emails", headers=student_headers).json()
    assert emails[0]["is_read"] is False

    r = client.patch(f"/email-integration/emails/{emails[0]['id']}/read", headers=student_headers)
    assert r.status_code == 204

    updated = client.get("/email-integration/emails", headers=student_headers).json()
    assert updated[0]["is_read"] is True


def test_mark_email_read_wrong_owner_noop(client, db, sample_universities):
    import json
    from tests.conftest import register_and_login

    alice = register_and_login(client, db, "alice_email@test.com")
    bob = register_and_login(client, db, "bob_email@test.com")
    client.post("/email-integration/link", json={"linked_email": "alice_inbox@gmail.com", "consent_given": True}, headers=alice)
    client.post("/email-integration/inbound", data={
        "from": "x@y.com", "subject": "s", "plain": "b",
        "headers": json.dumps({"X-Original-To": "alice_inbox@gmail.com"}),
    })
    email = client.get("/email-integration/emails", headers=alice).json()[0]

    r = client.patch(f"/email-integration/emails/{email['id']}/read", headers=bob)
    assert r.status_code == 204  # silently no-ops, doesn't leak existence

    still_unread = client.get("/email-integration/emails", headers=alice).json()
    assert still_unread[0]["is_read"] is False


# ── Admin endpoint ───────────────────────────────────────────────────────────

def test_admin_log_email_requires_admin(client, student_headers):
    r = client.post(
        "/email-integration/admin/log",
        params={"user_id": 1, "from_address": "x@y.com", "subject": "s"},
        headers=student_headers,
    )
    assert r.status_code == 403


def test_admin_log_email(client, admin_headers, student_headers):
    from app.core.security import decode_token

    uid = int(decode_token(student_headers["Authorization"].split(" ")[1], "access")[0])
    r = client.post(
        "/email-integration/admin/log",
        params={"user_id": uid, "from_address": "admissions@tum.de", "subject": "Rejected — we regret to inform you"},
        headers=admin_headers,
    )
    assert r.status_code == 200
    assert r.json()["detected_status"] == "rejected"

    emails = client.get("/email-integration/emails", headers=student_headers)
    assert len(emails.json()) == 1
