"""Tests for /instructors."""
import io
from app.models.instructor import Instructor


def _create_instructor(db, **overrides):
    defaults = dict(name="Jane Doe", language="english", is_published=True)
    defaults.update(overrides)
    inst = Instructor(**defaults)
    db.add(inst)
    db.commit()
    db.refresh(inst)
    return inst


def test_list_instructors_public(client, db):
    _create_instructor(db)
    r = client.get("/instructors")
    assert r.status_code == 200
    assert len(r.json()) == 1


def test_list_instructors_hides_unpublished(client, db):
    _create_instructor(db, name="Hidden", is_published=False)
    r = client.get("/instructors")
    assert r.json() == []


def test_list_instructors_filter_by_language(client, db):
    _create_instructor(db, name="English Teacher", language="english")
    _create_instructor(db, name="German Teacher", language="german")

    r = client.get("/instructors", params={"language": "german"})
    body = r.json()
    assert len(body) == 1
    assert body[0]["name"] == "German Teacher"


def test_get_instructor(client, db):
    inst = _create_instructor(db)
    r = client.get(f"/instructors/{inst.id}")
    assert r.status_code == 200
    assert r.json()["name"] == "Jane Doe"


def test_get_instructor_not_found(client):
    r = client.get("/instructors/999999")
    assert r.status_code == 404


def test_create_instructor_requires_admin(client, student_headers):
    r = client.post("/instructors", json={"name": "New", "language": "english"}, headers=student_headers)
    assert r.status_code == 403


def test_create_instructor_admin(client, admin_headers):
    r = client.post("/instructors", json={"name": "New Instructor", "language": "german"}, headers=admin_headers)
    assert r.status_code == 200
    assert r.json()["name"] == "New Instructor"


def test_update_instructor_by_admin(client, db, admin_headers):
    inst = _create_instructor(db)
    r = client.patch(f"/instructors/{inst.id}", json={"name": "Renamed"}, headers=admin_headers)
    assert r.status_code == 200
    assert r.json()["name"] == "Renamed"


def test_update_instructor_by_owner(client, db, student_headers):
    from app.core.security import decode_token

    uid = int(decode_token(student_headers["Authorization"].split(" ")[1], "access")[0])
    inst = _create_instructor(db, user_id=uid)

    r = client.patch(f"/instructors/{inst.id}", json={"bio": "My new bio"}, headers=student_headers)
    assert r.status_code == 200
    assert r.json()["bio"] == "My new bio"


def test_update_instructor_forbidden_for_others(client, db, sample_universities):
    from tests.conftest import register_and_login
    from app.core.security import decode_token

    owner = register_and_login(client, db, "owner_inst@test.com")
    other = register_and_login(client, db, "other_inst@test.com")
    owner_id = int(decode_token(owner["Authorization"].split(" ")[1], "access")[0])
    inst = _create_instructor(db, user_id=owner_id)

    r = client.patch(f"/instructors/{inst.id}", json={"bio": "hijacked"}, headers=other)
    assert r.status_code == 403


def test_update_instructor_not_found(client, admin_headers):
    r = client.patch("/instructors/999999", json={"name": "x"}, headers=admin_headers)
    assert r.status_code == 404


def test_delete_instructor_requires_admin(client, db, student_headers):
    inst = _create_instructor(db)
    r = client.delete(f"/instructors/{inst.id}", headers=student_headers)
    assert r.status_code == 403


def test_delete_instructor_admin(client, db, admin_headers):
    inst = _create_instructor(db)
    r = client.delete(f"/instructors/{inst.id}", headers=admin_headers)
    assert r.status_code == 200

    assert client.get(f"/instructors/{inst.id}").status_code == 404


def test_upload_photo(client, db, admin_headers):
    inst = _create_instructor(db)
    img = io.BytesIO(b"\x89PNG\r\n\x1a\nfakepngcontent")
    r = client.post(
        f"/instructors/{inst.id}/photo",
        files={"file": ("photo.png", img, "image/png")},
        headers=admin_headers,
    )
    assert r.status_code == 200
    assert "photo_url" in r.json()


def test_upload_photo_wrong_type_rejected(client, db, admin_headers):
    inst = _create_instructor(db)
    bad = io.BytesIO(b"not an image")
    r = client.post(
        f"/instructors/{inst.id}/photo",
        files={"file": ("file.txt", bad, "text/plain")},
        headers=admin_headers,
    )
    assert r.status_code == 400


def test_upload_photo_forbidden_for_others(client, db, sample_universities):
    from tests.conftest import register_and_login

    owner = register_and_login(client, db, "photo_owner@test.com")
    other = register_and_login(client, db, "photo_other@test.com")
    inst = _create_instructor(db, name="Someone Else")

    img = io.BytesIO(b"\x89PNG\r\n\x1a\nfakepngcontent")
    r = client.post(f"/instructors/{inst.id}/photo", files={"file": ("p.png", img, "image/png")}, headers=other)
    assert r.status_code == 403
