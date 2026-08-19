"""Tests for /instructor-messages."""
from app.models.instructor import Instructor


def _link_instructor(db, user_id, **overrides):
    defaults = dict(name="Prof X", language="english", is_published=True, user_id=user_id)
    defaults.update(overrides)
    inst = Instructor(**defaults)
    db.add(inst)
    db.commit()
    db.refresh(inst)
    return inst


def test_ask_question(client, db):
    inst = _link_instructor(db, user_id=None)
    from tests.conftest import register_and_login
    student = register_and_login(client, db, "asker@test.com")

    r = client.post(f"/instructor-messages/instructors/{inst.id}", json={"question": "How do I apply?"}, headers=student)
    assert r.status_code == 200
    assert r.json()["question"] == "How do I apply?"


def test_ask_question_requires_auth(client, db):
    inst = _link_instructor(db, user_id=None)
    r = client.post(f"/instructor-messages/instructors/{inst.id}", json={"question": "Hi"})
    assert r.status_code == 401


def test_ask_question_empty_rejected(client, db):
    from tests.conftest import register_and_login
    inst = _link_instructor(db, user_id=None)
    student = register_and_login(client, db, "asker2@test.com")

    r = client.post(f"/instructor-messages/instructors/{inst.id}", json={"question": "   "}, headers=student)
    assert r.status_code == 400


def test_ask_question_unknown_instructor(client, db):
    from tests.conftest import register_and_login
    student = register_and_login(client, db, "asker3@test.com")
    r = client.post("/instructor-messages/instructors/999999", json={"question": "Hi"}, headers=student)
    assert r.status_code == 404


def test_get_my_messages_with_instructor(client, db):
    from tests.conftest import register_and_login
    inst = _link_instructor(db, user_id=None)
    student = register_and_login(client, db, "asker4@test.com")
    client.post(f"/instructor-messages/instructors/{inst.id}", json={"question": "Q1"}, headers=student)

    r = client.get(f"/instructor-messages/instructors/{inst.id}", headers=student)
    assert r.status_code == 200
    assert len(r.json()) == 1


def test_get_all_my_messages(client, db):
    from tests.conftest import register_and_login
    inst = _link_instructor(db, user_id=None)
    student = register_and_login(client, db, "asker5@test.com")
    client.post(f"/instructor-messages/instructors/{inst.id}", json={"question": "Q1"}, headers=student)

    r = client.get("/instructor-messages/my", headers=student)
    assert len(r.json()) == 1


def test_instructor_inbox_requires_linked_instructor(client, student_headers):
    r = client.get("/instructor-messages/inbox", headers=student_headers)
    assert r.status_code == 403


def test_instructor_inbox_and_reply(client, db):
    from tests.conftest import register_and_login
    from app.core.security import decode_token

    teacher = register_and_login(client, db, "teacher@test.com")
    teacher_id = int(decode_token(teacher["Authorization"].split(" ")[1], "access")[0])
    inst = _link_instructor(db, user_id=teacher_id)

    student = register_and_login(client, db, "asker6@test.com")
    msg = client.post(f"/instructor-messages/instructors/{inst.id}", json={"question": "Help?"}, headers=student).json()

    inbox = client.get("/instructor-messages/inbox", headers=teacher)
    assert inbox.status_code == 200
    assert len(inbox.json()) == 1

    reply = client.post(f"/instructor-messages/inbox/{msg['id']}/reply", json={"reply": "Sure, here's how..."}, headers=teacher)
    assert reply.status_code == 200
    assert reply.json()["reply"] == "Sure, here's how..."


def test_instructor_reply_not_found(client, db):
    from tests.conftest import register_and_login
    from app.core.security import decode_token

    teacher = register_and_login(client, db, "teacher2@test.com")
    teacher_id = int(decode_token(teacher["Authorization"].split(" ")[1], "access")[0])
    _link_instructor(db, user_id=teacher_id)

    r = client.post("/instructor-messages/inbox/999999/reply", json={"reply": "x"}, headers=teacher)
    assert r.status_code == 404


def test_instructor_stats(client, db):
    """Regression test: stats endpoint previously crashed with AttributeError
    (referenced m.student_id, which doesn't exist — the field is user_id)."""
    from tests.conftest import register_and_login
    from app.core.security import decode_token

    teacher = register_and_login(client, db, "teacher3@test.com")
    teacher_id = int(decode_token(teacher["Authorization"].split(" ")[1], "access")[0])
    inst = _link_instructor(db, user_id=teacher_id)

    student = register_and_login(client, db, "asker7@test.com")
    client.post(f"/instructor-messages/instructors/{inst.id}", json={"question": "Q1"}, headers=student)

    r = client.get("/instructor-messages/stats", headers=teacher)
    assert r.status_code == 200
    body = r.json()
    assert body["total_students"] == 1
    assert body["total_messages"] == 1
    assert body["pending_replies"] == 1


def test_stats_requires_instructor(client, student_headers):
    r = client.get("/instructor-messages/stats", headers=student_headers)
    assert r.status_code == 403


def test_get_my_instructor_profile_none(client, student_headers):
    r = client.get("/instructor-messages/profile", headers=student_headers)
    assert r.status_code == 200
    assert r.json() == {}


def test_get_my_instructor_profile(client, db):
    from tests.conftest import register_and_login
    from app.core.security import decode_token

    teacher = register_and_login(client, db, "teacher4@test.com")
    teacher_id = int(decode_token(teacher["Authorization"].split(" ")[1], "access")[0])
    _link_instructor(db, user_id=teacher_id, name="Dr. Smith")

    r = client.get("/instructor-messages/profile", headers=teacher)
    assert r.json()["name"] == "Dr. Smith"


# ── Admin endpoints ──────────────────────────────────────────────────────────

def test_admin_list_all_requires_admin(client, student_headers):
    r = client.get("/instructor-messages", headers=student_headers)
    assert r.status_code == 403


def test_admin_list_all(client, db, admin_headers):
    from tests.conftest import register_and_login

    inst = _link_instructor(db, user_id=None)
    student = register_and_login(client, db, "asker8@test.com")
    client.post(f"/instructor-messages/instructors/{inst.id}", json={"question": "Q1"}, headers=student)

    r = client.get("/instructor-messages", headers=admin_headers)
    assert r.status_code == 200
    assert len(r.json()) == 1


def test_admin_get_one_not_found(client, admin_headers):
    r = client.get("/instructor-messages/999999", headers=admin_headers)
    assert r.status_code == 404


def test_admin_reply(client, db, admin_headers):
    from tests.conftest import register_and_login

    inst = _link_instructor(db, user_id=None)
    student = register_and_login(client, db, "asker9@test.com")
    msg = client.post(f"/instructor-messages/instructors/{inst.id}", json={"question": "Q1"}, headers=student).json()

    r = client.post(f"/instructor-messages/{msg['id']}/reply", json={"reply": "Admin reply"}, headers=admin_headers)
    assert r.status_code == 200
    assert r.json()["reply"] == "Admin reply"


def test_admin_delete(client, db, admin_headers):
    from tests.conftest import register_and_login

    inst = _link_instructor(db, user_id=None)
    student = register_and_login(client, db, "asker10@test.com")
    msg = client.post(f"/instructor-messages/instructors/{inst.id}", json={"question": "Q1"}, headers=student).json()

    r = client.delete(f"/instructor-messages/{msg['id']}", headers=admin_headers)
    assert r.status_code == 200
