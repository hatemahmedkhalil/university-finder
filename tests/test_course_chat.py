"""Tests for /course-chat."""
from app.models.learning import Course


def _create_course(db, **overrides):
    defaults = dict(title="German A1", language="german", level="A1", is_published=True)
    defaults.update(overrides)
    c = Course(**defaults)
    db.add(c)
    db.commit()
    db.refresh(c)
    return c


def test_get_chat_empty(client, db, student_headers):
    course = _create_course(db)
    r = client.get(f"/course-chat/{course.id}", headers=student_headers)
    assert r.status_code == 200
    assert r.json() == []


def test_get_chat_unpublished_404(client, db, student_headers):
    course = _create_course(db, is_published=False)
    r = client.get(f"/course-chat/{course.id}", headers=student_headers)
    assert r.status_code == 404


def test_get_chat_unknown_course_404(client, student_headers):
    r = client.get("/course-chat/999999", headers=student_headers)
    assert r.status_code == 404


def test_post_message(client, db, student_headers):
    course = _create_course(db)
    r = client.post(f"/course-chat/{course.id}", json={"content": "Hello everyone!"}, headers=student_headers)
    assert r.status_code == 201
    body = r.json()
    assert body["content"] == "Hello everyone!"
    assert body["author_role"] == "student"


def test_post_message_requires_auth(client, db):
    course = _create_course(db)
    r = client.post(f"/course-chat/{course.id}", json={"content": "Hi"})
    assert r.status_code == 401


def test_post_message_then_appears_in_chat(client, db, student_headers):
    course = _create_course(db)
    client.post(f"/course-chat/{course.id}", json={"content": "First message"}, headers=student_headers)
    r = client.get(f"/course-chat/{course.id}", headers=student_headers)
    assert len(r.json()) == 1


def test_delete_own_message(client, db, student_headers):
    course = _create_course(db)
    msg = client.post(f"/course-chat/{course.id}", json={"content": "Delete me"}, headers=student_headers).json()
    r = client.delete(f"/course-chat/{msg['id']}/delete", headers=student_headers)
    assert r.status_code == 200


def test_delete_message_not_found(client, student_headers):
    r = client.delete("/course-chat/999999/delete", headers=student_headers)
    assert r.status_code == 404


def test_delete_message_wrong_owner_forbidden(client, db, sample_universities):
    from tests.conftest import register_and_login

    alice = register_and_login(client, db, "alice_coursechat@test.com")
    bob = register_and_login(client, db, "bob_coursechat@test.com")
    course = _create_course(db)
    msg = client.post(f"/course-chat/{course.id}", json={"content": "Alice's message"}, headers=alice).json()

    r = client.delete(f"/course-chat/{msg['id']}/delete", headers=bob)
    assert r.status_code == 403


def test_admin_can_delete_any_message(client, db, admin_headers, student_headers):
    course = _create_course(db)
    msg = client.post(f"/course-chat/{course.id}", json={"content": "Some message"}, headers=student_headers).json()

    r = client.delete(f"/course-chat/{msg['id']}/delete", headers=admin_headers)
    assert r.status_code == 200
