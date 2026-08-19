"""Tests for /ielts — IELTS simulator content management + student access."""
import io
from app.models.ielts import IeltsTest, IeltsSection, IeltsQuestion
from app.models.instructor import Instructor


def _create_test(db, **overrides):
    defaults = dict(title="IELTS Practice Test 1", duration_minutes=170, is_published=True)
    defaults.update(overrides)
    t = IeltsTest(**defaults)
    db.add(t)
    db.commit()
    db.refresh(t)
    return t


def _link_english_instructor(db, user_id):
    inst = Instructor(name="English Teacher", language="english", is_published=True, user_id=user_id)
    db.add(inst)
    db.commit()
    db.refresh(inst)
    return inst


def test_list_tests_only_published(client, db, student_headers):
    _create_test(db, title="Published", is_published=True)
    _create_test(db, title="Draft", is_published=False)

    r = client.get("/ielts", headers=student_headers)
    assert r.status_code == 200
    titles = {t["title"] for t in r.json()}
    assert titles == {"Published"}


def test_list_tests_requires_auth(client):
    r = client.get("/ielts")
    assert r.status_code == 401


def test_get_test_detail(client, db, student_headers):
    t = _create_test(db)
    r = client.get(f"/ielts/{t.id}", headers=student_headers)
    assert r.status_code == 200
    assert r.json()["sections"] == []


def test_get_test_unpublished_404(client, db, student_headers):
    t = _create_test(db, is_published=False)
    r = client.get(f"/ielts/{t.id}", headers=student_headers)
    assert r.status_code == 404


def test_get_test_not_found(client, student_headers):
    r = client.get("/ielts/999999", headers=student_headers)
    assert r.status_code == 404


# ── Manage access control ────────────────────────────────────────────────────

def test_manage_requires_admin_or_english_instructor(client, student_headers):
    r = client.get("/ielts/manage", headers=student_headers)
    assert r.status_code == 403


def test_manage_allows_admin(client, admin_headers):
    r = client.get("/ielts/manage", headers=admin_headers)
    assert r.status_code == 200


def test_manage_allows_english_instructor(client, db, student_headers):
    from app.core.security import decode_token

    uid = int(decode_token(student_headers["Authorization"].split(" ")[1], "access")[0])
    _link_english_instructor(db, uid)

    r = client.get("/ielts/manage", headers=student_headers)
    assert r.status_code == 200


def test_manage_denies_non_english_instructor(client, db, sample_universities):
    from tests.conftest import register_and_login
    from app.core.security import decode_token

    headers = register_and_login(client, db, "german_teacher@test.com")
    uid = int(decode_token(headers["Authorization"].split(" ")[1], "access")[0])
    db.add(Instructor(name="German Teacher", language="german", is_published=True, user_id=uid))
    db.commit()

    r = client.get("/ielts/manage", headers=headers)
    assert r.status_code == 403


# ── Test CRUD ────────────────────────────────────────────────────────────────

def test_create_test(client, admin_headers):
    r = client.post("/ielts/manage", json={"title": "New Test", "duration_minutes": 165}, headers=admin_headers)
    assert r.status_code == 201
    assert r.json()["title"] == "New Test"


def test_update_test(client, db, admin_headers):
    t = _create_test(db)
    r = client.patch(f"/ielts/manage/{t.id}", json={"title": "Renamed"}, headers=admin_headers)
    assert r.status_code == 200
    assert r.json()["title"] == "Renamed"


def test_update_test_not_found(client, admin_headers):
    r = client.patch("/ielts/manage/999999", json={"title": "x"}, headers=admin_headers)
    assert r.status_code == 404


def test_delete_test(client, db, admin_headers):
    t = _create_test(db)
    r = client.delete(f"/ielts/manage/{t.id}", headers=admin_headers)
    assert r.status_code == 204


def test_delete_test_not_found(client, admin_headers):
    r = client.delete("/ielts/manage/999999", headers=admin_headers)
    assert r.status_code == 404


def test_manage_get_test(client, db, admin_headers):
    t = _create_test(db)
    r = client.get(f"/ielts/manage/{t.id}", headers=admin_headers)
    assert r.status_code == 200
    assert r.json()["title"] == t.title


# ── Section CRUD ─────────────────────────────────────────────────────────────

def test_create_section(client, db, admin_headers):
    t = _create_test(db)
    r = client.post("/ielts/manage/sections", json={"test_id": t.id, "name": "Listening"}, headers=admin_headers)
    assert r.status_code == 201
    assert r.json()["name"] == "Listening"


def test_create_section_unknown_test(client, admin_headers):
    r = client.post("/ielts/manage/sections", json={"test_id": 999999, "name": "x"}, headers=admin_headers)
    assert r.status_code == 404


def test_add_section_via_test_path(client, db, admin_headers):
    t = _create_test(db)
    r = client.post(f"/ielts/manage/{t.id}/sections", json={"name": "Reading"}, headers=admin_headers)
    assert r.status_code == 201


def test_list_sections(client, db, admin_headers):
    t = _create_test(db)
    client.post("/ielts/manage/sections", json={"test_id": t.id, "name": "Writing"}, headers=admin_headers)
    r = client.get("/ielts/manage/sections", headers=admin_headers)
    assert r.status_code == 200
    assert len(r.json()) == 1


def test_get_section(client, db, admin_headers):
    t = _create_test(db)
    created = client.post("/ielts/manage/sections", json={"test_id": t.id, "name": "Speaking"}, headers=admin_headers).json()
    r = client.get(f"/ielts/manage/sections/{created['id']}", headers=admin_headers)
    assert r.status_code == 200


def test_get_section_not_found(client, admin_headers):
    r = client.get("/ielts/manage/sections/999999", headers=admin_headers)
    assert r.status_code == 404


def test_update_section(client, db, admin_headers):
    t = _create_test(db)
    created = client.post("/ielts/manage/sections", json={"test_id": t.id, "name": "Old"}, headers=admin_headers).json()
    r = client.patch(f"/ielts/manage/sections/{created['id']}", json={"name": "New"}, headers=admin_headers)
    assert r.status_code == 200
    assert r.json()["name"] == "New"


def test_delete_section(client, db, admin_headers):
    t = _create_test(db)
    created = client.post("/ielts/manage/sections", json={"test_id": t.id, "name": "Temp"}, headers=admin_headers).json()
    r = client.delete(f"/ielts/manage/sections/{created['id']}", headers=admin_headers)
    assert r.status_code == 204


# ── Audio upload/serve (cloud-storage migration) ────────────────────────────

def test_upload_section_audio(client, db, admin_headers, student_headers):
    """Regression test: audio_url must point to the actual working /ielts/audio/{filename}
    endpoint (previously stored /uploads/ielts/{filename}, which nothing served)."""
    t = _create_test(db)
    section = client.post("/ielts/manage/sections", json={"test_id": t.id, "name": "Listening"}, headers=admin_headers).json()

    audio = io.BytesIO(b"fake mp3 bytes for testing")
    r = client.post(
        f"/ielts/manage/sections/{section['id']}/audio",
        files={"file": ("track.mp3", audio, "audio/mpeg")},
        headers=admin_headers,
    )
    assert r.status_code == 200
    audio_url = r.json()["audio_url"]
    assert audio_url == f"/ielts/audio/section_{section['id']}.mp3"

    # The stored URL must actually resolve — this is the bug regression check.
    played = client.get(audio_url, headers=student_headers)
    assert played.status_code == 200
    assert played.content == b"fake mp3 bytes for testing"


def test_upload_audio_wrong_extension_rejected(client, db, admin_headers):
    t = _create_test(db)
    section = client.post("/ielts/manage/sections", json={"test_id": t.id, "name": "Listening"}, headers=admin_headers).json()
    bad = io.BytesIO(b"not audio")
    r = client.post(
        f"/ielts/manage/sections/{section['id']}/audio",
        files={"file": ("script.exe", bad, "application/octet-stream")},
        headers=admin_headers,
    )
    assert r.status_code == 400


def test_upload_audio_section_not_found(client, admin_headers):
    audio = io.BytesIO(b"x")
    r = client.post(
        "/ielts/manage/sections/999999/audio",
        files={"file": ("t.mp3", audio, "audio/mpeg")},
        headers=admin_headers,
    )
    assert r.status_code == 404


def test_replace_audio_removes_old_file(client, db, admin_headers, student_headers):
    t = _create_test(db)
    section = client.post("/ielts/manage/sections", json={"test_id": t.id, "name": "Listening"}, headers=admin_headers).json()

    audio1 = io.BytesIO(b"first version")
    client.post(f"/ielts/manage/sections/{section['id']}/audio", files={"file": ("a.mp3", audio1, "audio/mpeg")}, headers=admin_headers)

    audio2 = io.BytesIO(b"second version")
    r2 = client.post(f"/ielts/manage/sections/{section['id']}/audio", files={"file": ("a.mp3", audio2, "audio/mpeg")}, headers=admin_headers)
    assert r2.status_code == 200

    played = client.get(r2.json()["audio_url"], headers=student_headers)
    assert played.content == b"second version"


def test_delete_section_audio(client, db, admin_headers, student_headers):
    t = _create_test(db)
    section = client.post("/ielts/manage/sections", json={"test_id": t.id, "name": "Listening"}, headers=admin_headers).json()
    audio = io.BytesIO(b"content")
    uploaded = client.post(f"/ielts/manage/sections/{section['id']}/audio", files={"file": ("a.mp3", audio, "audio/mpeg")}, headers=admin_headers).json()

    r = client.delete(f"/ielts/manage/sections/{section['id']}/audio", headers=admin_headers)
    assert r.status_code == 204

    played = client.get(uploaded["audio_url"], headers=student_headers)
    assert played.status_code == 404


def test_serve_audio_not_found(client, student_headers):
    r = client.get("/ielts/audio/nonexistent.mp3", headers=student_headers)
    assert r.status_code == 404


def test_serve_audio_requires_auth(client):
    r = client.get("/ielts/audio/whatever.mp3")
    assert r.status_code == 401


# ── Question CRUD ────────────────────────────────────────────────────────────

def test_create_question_standalone(client, db, admin_headers):
    t = _create_test(db)
    section = client.post("/ielts/manage/sections", json={"test_id": t.id, "name": "Reading"}, headers=admin_headers).json()

    r = client.post("/ielts/manage/questions", json={"section_id": section["id"], "question_text": "What is the main idea?"}, headers=admin_headers)
    assert r.status_code == 201


def test_create_question_unknown_section(client, admin_headers):
    r = client.post("/ielts/manage/questions", json={"section_id": 999999, "question_text": "x"}, headers=admin_headers)
    assert r.status_code == 404


def test_add_question_via_section_path(client, db, admin_headers):
    t = _create_test(db)
    section = client.post("/ielts/manage/sections", json={"test_id": t.id, "name": "Reading"}, headers=admin_headers).json()
    r = client.post(f"/ielts/manage/sections/{section['id']}/questions", json={"question_text": "Q1"}, headers=admin_headers)
    assert r.status_code == 201


def test_list_questions(client, db, admin_headers):
    t = _create_test(db)
    section = client.post("/ielts/manage/sections", json={"test_id": t.id, "name": "Reading"}, headers=admin_headers).json()
    client.post("/ielts/manage/questions", json={"section_id": section["id"], "question_text": "Q1"}, headers=admin_headers)

    r = client.get("/ielts/manage/questions", headers=admin_headers)
    assert r.status_code == 200
    assert len(r.json()) == 1


def test_get_question(client, db, admin_headers):
    t = _create_test(db)
    section = client.post("/ielts/manage/sections", json={"test_id": t.id, "name": "Reading"}, headers=admin_headers).json()
    created = client.post("/ielts/manage/questions", json={"section_id": section["id"], "question_text": "Q1"}, headers=admin_headers).json()

    r = client.get(f"/ielts/manage/questions/{created['id']}", headers=admin_headers)
    assert r.status_code == 200


def test_get_question_not_found(client, admin_headers):
    r = client.get("/ielts/manage/questions/999999", headers=admin_headers)
    assert r.status_code == 404


def test_update_question(client, db, admin_headers):
    t = _create_test(db)
    section = client.post("/ielts/manage/sections", json={"test_id": t.id, "name": "Reading"}, headers=admin_headers).json()
    created = client.post("/ielts/manage/questions", json={"section_id": section["id"], "question_text": "Old"}, headers=admin_headers).json()

    r = client.patch(f"/ielts/manage/questions/{created['id']}", json={"question_text": "New"}, headers=admin_headers)
    assert r.status_code == 200
    assert r.json()["question_text"] == "New"


def test_delete_question(client, db, admin_headers):
    t = _create_test(db)
    section = client.post("/ielts/manage/sections", json={"test_id": t.id, "name": "Reading"}, headers=admin_headers).json()
    created = client.post("/ielts/manage/questions", json={"section_id": section["id"], "question_text": "Q1"}, headers=admin_headers).json()

    r = client.delete(f"/ielts/manage/questions/{created['id']}", headers=admin_headers)
    assert r.status_code == 204


# ── End-to-end: test with sections and questions appears correctly to students ─

def test_full_test_with_sections_and_questions_visible_to_student(client, db, admin_headers, student_headers):
    t = _create_test(db)
    section = client.post("/ielts/manage/sections", json={"test_id": t.id, "name": "Reading"}, headers=admin_headers).json()
    client.post("/ielts/manage/sections/" + str(section["id"]) + "/questions", json={"question_text": "Q1"}, headers=admin_headers)

    r = client.get(f"/ielts/{t.id}", headers=student_headers)
    assert r.status_code == 200
    body = r.json()
    assert body["section_count"] == 1
    assert body["total_questions"] == 1
    assert len(body["sections"][0]["questions"]) == 1
