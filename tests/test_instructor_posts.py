"""Tests for /instructor-posts."""
from app.models.instructor import Instructor


def _link_instructor(db, user_id, **overrides):
    defaults = dict(name="Prof X", language="english", is_published=True, user_id=user_id)
    defaults.update(overrides)
    inst = Instructor(**defaults)
    db.add(inst)
    db.commit()
    db.refresh(inst)
    return inst


def test_list_all_posts_empty(client):
    r = client.get("/instructor-posts")
    assert r.status_code == 200
    assert r.json() == []


def test_create_post_requires_linked_instructor(client, student_headers):
    r = client.post("/instructor-posts", json={"content": "Hello students"}, headers=student_headers)
    assert r.status_code == 403


def test_create_post(client, db, student_headers):
    from app.core.security import decode_token

    uid = int(decode_token(student_headers["Authorization"].split(" ")[1], "access")[0])
    _link_instructor(db, uid)

    r = client.post("/instructor-posts", json={"content": "Welcome to the course!"}, headers=student_headers)
    assert r.status_code == 200
    assert r.json()["content"] == "Welcome to the course!"


def test_create_post_empty_content_rejected(client, db, student_headers):
    from app.core.security import decode_token

    uid = int(decode_token(student_headers["Authorization"].split(" ")[1], "access")[0])
    _link_instructor(db, uid)

    r = client.post("/instructor-posts", json={"content": "   "}, headers=student_headers)
    assert r.status_code == 400


def test_posts_by_instructor(client, db, student_headers):
    from app.core.security import decode_token

    uid = int(decode_token(student_headers["Authorization"].split(" ")[1], "access")[0])
    inst = _link_instructor(db, uid)
    client.post("/instructor-posts", json={"content": "Post 1"}, headers=student_headers)

    r = client.get(f"/instructor-posts/instructor/{inst.id}")
    assert r.status_code == 200
    assert len(r.json()) == 1


def test_delete_own_post(client, db, student_headers):
    from app.core.security import decode_token

    uid = int(decode_token(student_headers["Authorization"].split(" ")[1], "access")[0])
    _link_instructor(db, uid)
    created = client.post("/instructor-posts", json={"content": "Deleting this"}, headers=student_headers).json()

    r = client.delete(f"/instructor-posts/{created['id']}", headers=student_headers)
    assert r.status_code == 200


def test_delete_post_not_found(client, student_headers):
    r = client.delete("/instructor-posts/999999", headers=student_headers)
    assert r.status_code == 404


def test_delete_post_wrong_instructor_forbidden(client, db, sample_universities):
    from tests.conftest import register_and_login
    from app.core.security import decode_token

    owner = register_and_login(client, db, "post_owner@test.com")
    other = register_and_login(client, db, "post_other@test.com")
    owner_id = int(decode_token(owner["Authorization"].split(" ")[1], "access")[0])
    other_id = int(decode_token(other["Authorization"].split(" ")[1], "access")[0])
    _link_instructor(db, owner_id, name="Owner Inst")
    _link_instructor(db, other_id, name="Other Inst")

    created = client.post("/instructor-posts", json={"content": "Owner's post"}, headers=owner).json()
    r = client.delete(f"/instructor-posts/{created['id']}", headers=other)
    assert r.status_code == 403


def test_admin_can_delete_any_post(client, db, admin_headers, student_headers):
    from app.core.security import decode_token

    uid = int(decode_token(student_headers["Authorization"].split(" ")[1], "access")[0])
    _link_instructor(db, uid)
    created = client.post("/instructor-posts", json={"content": "Some post"}, headers=student_headers).json()

    r = client.delete(f"/instructor-posts/{created['id']}", headers=admin_headers)
    assert r.status_code == 200
