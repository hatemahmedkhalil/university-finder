"""Tests for /applications — student application tracking + document upload."""
import io


def test_list_applications_empty(client, student_headers):
    r = client.get("/applications", headers=student_headers)
    assert r.status_code == 200
    assert r.json() == []


def test_create_application(client, student_headers, sample_universities):
    uni = sample_universities[0]
    r = client.post("/applications", json={"university_id": uni.id}, headers=student_headers)
    assert r.status_code == 200
    body = r.json()
    assert body["status"] == "under_review"
    assert body["university"]["id"] == uni.id


def test_create_application_requires_auth(client, sample_universities):
    r = client.post("/applications", json={"university_id": sample_universities[0].id})
    assert r.status_code == 401


def test_create_application_invalid_status(client, student_headers, sample_universities):
    r = client.post("/applications", json={"university_id": sample_universities[0].id, "status": "bogus"}, headers=student_headers)
    assert r.status_code == 400


def test_create_application_unknown_university(client, student_headers):
    r = client.post("/applications", json={"university_id": 999999}, headers=student_headers)
    assert r.status_code == 404


def test_create_application_duplicate(client, student_headers, sample_universities):
    uni = sample_universities[0]
    client.post("/applications", json={"university_id": uni.id}, headers=student_headers)
    r = client.post("/applications", json={"university_id": uni.id}, headers=student_headers)
    assert r.status_code == 409


def test_free_plan_limit_two_applications(client, student_headers, sample_universities):
    for uni in sample_universities[:2]:
        r = client.post("/applications", json={"university_id": uni.id}, headers=student_headers)
        assert r.status_code == 200
    # a 3rd would need a 4th university; reuse via admin-created one isn't easy here,
    # so just confirm the limit triggers on an existing set of >=2 with a fresh one blocked
    # by checking the count-based 403 with only 3 sample universities available:
    r3 = client.post("/applications", json={"university_id": sample_universities[2].id}, headers=student_headers)
    assert r3.status_code == 403
    assert "Free plan limit" in r3.json()["detail"]


def test_update_application(client, student_headers, sample_universities):
    created = client.post("/applications", json={"university_id": sample_universities[0].id}, headers=student_headers).json()
    r = client.patch(f"/applications/{created['id']}", json={"status": "accepted", "notes": "Got in!"}, headers=student_headers)
    assert r.status_code == 200
    assert r.json()["status"] == "accepted"
    assert r.json()["notes"] == "Got in!"


def test_update_application_invalid_status(client, student_headers, sample_universities):
    created = client.post("/applications", json={"university_id": sample_universities[0].id}, headers=student_headers).json()
    r = client.patch(f"/applications/{created['id']}", json={"status": "bogus"}, headers=student_headers)
    assert r.status_code == 400


def test_update_application_wrong_owner_404(client, db, sample_universities):
    from tests.conftest import register_and_login

    alice = register_and_login(client, db, "alice_app@test.com")
    bob = register_and_login(client, db, "bob_app@test.com")
    created = client.post("/applications", json={"university_id": sample_universities[0].id}, headers=alice).json()

    r = client.patch(f"/applications/{created['id']}", json={"status": "accepted"}, headers=bob)
    assert r.status_code == 404


def test_delete_application(client, student_headers, sample_universities):
    created = client.post("/applications", json={"university_id": sample_universities[0].id}, headers=student_headers).json()
    r = client.delete(f"/applications/{created['id']}", headers=student_headers)
    assert r.status_code == 200
    assert client.get("/applications", headers=student_headers).json() == []


def test_get_application_for_university_none(client, student_headers, sample_universities):
    r = client.get(f"/applications/university/{sample_universities[0].id}", headers=student_headers)
    assert r.status_code == 200
    assert r.json() is None


def test_get_application_for_university_found(client, student_headers, sample_universities):
    uni = sample_universities[0]
    client.post("/applications", json={"university_id": uni.id}, headers=student_headers)
    r = client.get(f"/applications/university/{uni.id}", headers=student_headers)
    assert r.json()["university_id"] == uni.id


# ── Admin endpoints ──────────────────────────────────────────────────────────

def test_admin_list_all_requires_admin(client, student_headers):
    r = client.get("/applications/admin/all", headers=student_headers)
    assert r.status_code == 403


def test_admin_create_application(client, db, admin_headers, sample_universities):
    from tests.conftest import register_and_login
    from app.core.security import decode_token

    alice = register_and_login(client, db, "alice_app2@test.com")
    uid = int(decode_token(alice["Authorization"].split(" ")[1], "access")[0])

    r = client.post(
        "/applications/admin",
        json={"user_id": uid, "university_id": sample_universities[0].id, "status": "interested"},
        headers=admin_headers,
    )
    assert r.status_code == 200


def test_admin_create_application_invalid_status(client, admin_headers, sample_universities):
    r = client.post(
        "/applications/admin",
        json={"user_id": 1, "university_id": sample_universities[0].id, "status": "bogus"},
        headers=admin_headers,
    )
    assert r.status_code == 400


def test_admin_update_application(client, student_headers, admin_headers, sample_universities):
    created = client.post("/applications", json={"university_id": sample_universities[0].id}, headers=student_headers).json()
    r = client.patch(f"/applications/admin/{created['id']}", json={"status": "rejected"}, headers=admin_headers)
    assert r.status_code == 200
    assert r.json()["status"] == "rejected"


def test_admin_delete_application(client, student_headers, admin_headers, sample_universities):
    created = client.post("/applications", json={"university_id": sample_universities[0].id}, headers=student_headers).json()
    r = client.delete(f"/applications/admin/{created['id']}", headers=admin_headers)
    assert r.status_code == 200


# ── Document upload ──────────────────────────────────────────────────────────

def _make_pdf():
    return io.BytesIO(b"%PDF-1.4 fake pdf content for testing"), "transcript.pdf", "application/pdf"


def test_upload_document(client, student_headers, sample_universities):
    app_ = client.post("/applications", json={"university_id": sample_universities[0].id}, headers=student_headers).json()
    file_obj, name, ctype = _make_pdf()
    r = client.post(
        f"/applications/{app_['id']}/documents",
        files={"file": (name, file_obj, ctype)},
        headers=student_headers,
    )
    assert r.status_code == 200
    body = r.json()
    assert body["original_name"] == "transcript.pdf"
    assert body["is_approved"] is False


def test_upload_document_wrong_type_rejected(client, student_headers, sample_universities):
    app_ = client.post("/applications", json={"university_id": sample_universities[0].id}, headers=student_headers).json()
    file_obj = io.BytesIO(b"#!/bin/sh\necho pwned")
    r = client.post(
        f"/applications/{app_['id']}/documents",
        files={"file": ("script.sh", file_obj, "application/x-sh")},
        headers=student_headers,
    )
    assert r.status_code == 400


def test_upload_document_wrong_owner_404(client, db, sample_universities):
    from tests.conftest import register_and_login

    alice = register_and_login(client, db, "alice_doc@test.com")
    bob = register_and_login(client, db, "bob_doc@test.com")
    app_ = client.post("/applications", json={"university_id": sample_universities[0].id}, headers=alice).json()

    file_obj, name, ctype = _make_pdf()
    r = client.post(f"/applications/{app_['id']}/documents", files={"file": (name, file_obj, ctype)}, headers=bob)
    assert r.status_code == 404


def test_list_documents(client, student_headers, sample_universities):
    app_ = client.post("/applications", json={"university_id": sample_universities[0].id}, headers=student_headers).json()
    file_obj, name, ctype = _make_pdf()
    client.post(f"/applications/{app_['id']}/documents", files={"file": (name, file_obj, ctype)}, headers=student_headers)

    r = client.get(f"/applications/{app_['id']}/documents", headers=student_headers)
    assert r.status_code == 200
    assert len(r.json()) == 1


def test_download_document(client, student_headers, sample_universities):
    app_ = client.post("/applications", json={"university_id": sample_universities[0].id}, headers=student_headers).json()
    file_obj, name, ctype = _make_pdf()
    doc = client.post(f"/applications/{app_['id']}/documents", files={"file": (name, file_obj, ctype)}, headers=student_headers).json()

    r = client.get(f"/applications/{app_['id']}/documents/{doc['id']}/download", headers=student_headers)
    assert r.status_code == 200
    assert b"fake pdf content" in r.content


def test_download_document_wrong_owner_404(client, db, sample_universities):
    from tests.conftest import register_and_login

    alice = register_and_login(client, db, "alice_dl@test.com")
    bob = register_and_login(client, db, "bob_dl@test.com")
    app_ = client.post("/applications", json={"university_id": sample_universities[0].id}, headers=alice).json()
    file_obj, name, ctype = _make_pdf()
    doc = client.post(f"/applications/{app_['id']}/documents", files={"file": (name, file_obj, ctype)}, headers=alice).json()

    r = client.get(f"/applications/{app_['id']}/documents/{doc['id']}/download", headers=bob)
    assert r.status_code == 404


def test_admin_can_download_any_document(client, student_headers, admin_headers, sample_universities):
    app_ = client.post("/applications", json={"university_id": sample_universities[0].id}, headers=student_headers).json()
    file_obj, name, ctype = _make_pdf()
    doc = client.post(f"/applications/{app_['id']}/documents", files={"file": (name, file_obj, ctype)}, headers=student_headers).json()

    r = client.get(f"/applications/{app_['id']}/documents/{doc['id']}/download", headers=admin_headers)
    assert r.status_code == 200


def test_delete_document(client, student_headers, sample_universities):
    app_ = client.post("/applications", json={"university_id": sample_universities[0].id}, headers=student_headers).json()
    file_obj, name, ctype = _make_pdf()
    doc = client.post(f"/applications/{app_['id']}/documents", files={"file": (name, file_obj, ctype)}, headers=student_headers).json()

    r = client.delete(f"/applications/{app_['id']}/documents/{doc['id']}", headers=student_headers)
    assert r.status_code == 200

    listed = client.get(f"/applications/{app_['id']}/documents", headers=student_headers)
    assert listed.json() == []


def test_admin_approve_document(client, student_headers, admin_headers, sample_universities):
    app_ = client.post("/applications", json={"university_id": sample_universities[0].id}, headers=student_headers).json()
    file_obj, name, ctype = _make_pdf()
    doc = client.post(f"/applications/{app_['id']}/documents", files={"file": (name, file_obj, ctype)}, headers=student_headers).json()

    r = client.patch(f"/applications/admin/{app_['id']}/documents/{doc['id']}", json={"is_approved": True}, headers=admin_headers)
    assert r.status_code == 200
    assert r.json()["is_approved"] is True
