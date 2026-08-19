"""Tests for /calendar — student calendar events."""


def _create(client, headers, title="Application deadline", event_date="2026-12-01", event_type="deadline"):
    r = client.post("/calendar", json={"title": title, "event_date": event_date, "event_type": event_type}, headers=headers)
    assert r.status_code == 201
    return r.json()


def test_list_events_empty(client, student_headers):
    r = client.get("/calendar", headers=student_headers)
    assert r.status_code == 200
    assert r.json() == []


def test_create_event(client, student_headers):
    body = _create(client, student_headers)
    assert body["title"] == "Application deadline"
    assert body["source"] == "manual"


def test_create_event_requires_auth(client):
    r = client.post("/calendar", json={"title": "x", "event_date": "2026-12-01"})
    assert r.status_code == 401


def test_list_events_sorted_by_date(client, student_headers):
    _create(client, student_headers, title="Later", event_date="2026-12-15")
    _create(client, student_headers, title="Earlier", event_date="2026-11-01")

    r = client.get("/calendar", headers=student_headers)
    events = r.json()
    assert len(events) == 2
    assert events[0]["title"] == "Earlier"
    assert events[1]["title"] == "Later"


def test_list_events_isolated_between_users(client, db, sample_universities):
    from tests.conftest import register_and_login

    alice = register_and_login(client, db, "alice_cal@test.com")
    bob = register_and_login(client, db, "bob_cal@test.com")

    _create(client, alice, title="Alice's event")
    r = client.get("/calendar", headers=bob)
    assert r.json() == []


def test_update_event(client, student_headers):
    event = _create(client, student_headers)
    r = client.patch(f"/calendar/{event['id']}", json={"title": "Updated title", "is_done": True}, headers=student_headers)
    assert r.status_code == 200
    assert r.json()["title"] == "Updated title"
    assert r.json()["is_done"] is True


def test_update_event_not_found(client, student_headers):
    r = client.patch("/calendar/999999", json={"title": "x"}, headers=student_headers)
    assert r.status_code == 404


def test_update_event_wrong_owner_404(client, db, sample_universities):
    from tests.conftest import register_and_login

    alice = register_and_login(client, db, "alice_cal2@test.com")
    bob = register_and_login(client, db, "bob_cal2@test.com")
    event = _create(client, alice)

    r = client.patch(f"/calendar/{event['id']}", json={"title": "hijacked"}, headers=bob)
    assert r.status_code == 404


def test_delete_event(client, student_headers):
    event = _create(client, student_headers)
    r = client.delete(f"/calendar/{event['id']}", headers=student_headers)
    assert r.status_code == 204

    r2 = client.get("/calendar", headers=student_headers)
    assert r2.json() == []


def test_delete_event_wrong_owner_404(client, db, sample_universities):
    from tests.conftest import register_and_login

    alice = register_and_login(client, db, "alice_cal3@test.com")
    bob = register_and_login(client, db, "bob_cal3@test.com")
    event = _create(client, alice)

    r = client.delete(f"/calendar/{event['id']}", headers=bob)
    assert r.status_code == 404


def test_delete_event_not_found(client, student_headers):
    r = client.delete("/calendar/999999", headers=student_headers)
    assert r.status_code == 404
