"""Tests for /simulators — TOEFL/Cambridge exam simulator."""
from tests.conftest import requires_groq

from app.models.simulator import ExamPassage, ExamQuestion


def test_list_exams(client, student_headers):
    r = client.get("/simulators/exams", headers=student_headers)
    assert r.status_code == 200
    types = {e["name"] for e in r.json()}
    assert "TOEFL iBT" in types
    assert "Cambridge B2 First" in types


def test_list_exams_requires_auth(client):
    r = client.get("/simulators/exams")
    assert r.status_code == 401


def test_get_exam_content_unknown_type(client, student_headers):
    r = client.get("/simulators/exams/bogus/content", headers=student_headers)
    assert r.status_code == 404


def test_get_exam_content(client, db, student_headers):
    p = ExamPassage(exam_type="toefl", section="reading", order_index=1, title="Test Passage", content="Some passage text.")
    db.add(p)
    db.flush()
    db.add(ExamQuestion(
        exam_type="toefl", section="reading", passage_id=p.id,
        question_type="mcq", question_text="What is this about?",
        options_json='["A) x", "B) y"]', correct_answer="A", order_index=1,
    ))
    db.commit()

    r = client.get("/simulators/exams/toefl/content", headers=student_headers)
    assert r.status_code == 200
    body = r.json()
    assert body["exam_type"] == "toefl"
    reading = body["sections"]["reading"]
    assert len(reading["passages"]) == 1
    assert len(reading["passages"][0]["questions"]) == 1


# ── Attempt lifecycle ────────────────────────────────────────────────────────

def test_start_attempt(client, student_headers):
    r = client.post("/simulators/attempts", json={"exam_type": "toefl"}, headers=student_headers)
    assert r.status_code == 201
    assert r.json()["status"] == "in_progress"


def test_start_attempt_invalid_type(client, student_headers):
    r = client.post("/simulators/attempts", json={"exam_type": "bogus"}, headers=student_headers)
    assert r.status_code == 400


def test_list_attempts_empty(client, student_headers):
    r = client.get("/simulators/attempts", headers=student_headers)
    assert r.status_code == 200
    assert r.json() == []


def test_list_attempts(client, student_headers):
    client.post("/simulators/attempts", json={"exam_type": "cambridge"}, headers=student_headers)
    r = client.get("/simulators/attempts", headers=student_headers)
    assert len(r.json()) == 1
    assert r.json()[0]["exam_type"] == "cambridge"


def test_get_attempt(client, student_headers):
    created = client.post("/simulators/attempts", json={"exam_type": "toefl"}, headers=student_headers).json()
    r = client.get(f"/simulators/attempts/{created['id']}", headers=student_headers)
    assert r.status_code == 200
    assert r.json()["status"] == "in_progress"
    assert r.json()["section_results"] == []


def test_get_attempt_not_found(client, student_headers):
    r = client.get("/simulators/attempts/999999", headers=student_headers)
    assert r.status_code == 404


def test_get_attempt_wrong_owner_404(client, db, sample_universities):
    from tests.conftest import register_and_login

    alice = register_and_login(client, db, "alice_sim@test.com")
    bob = register_and_login(client, db, "bob_sim@test.com")
    created = client.post("/simulators/attempts", json={"exam_type": "toefl"}, headers=alice).json()

    r = client.get(f"/simulators/attempts/{created['id']}", headers=bob)
    assert r.status_code == 404


def test_submit_mcq_section(client, db, student_headers):
    p = ExamPassage(exam_type="toefl", section="reading", order_index=1, title="P", content="text")
    db.add(p)
    db.flush()
    q = ExamQuestion(exam_type="toefl", section="reading", passage_id=p.id, question_type="mcq",
                      question_text="Q?", options_json='["A","B"]', correct_answer="A", points=1.0, order_index=1)
    db.add(q)
    db.commit()
    db.refresh(q)

    attempt = client.post("/simulators/attempts", json={"exam_type": "toefl"}, headers=student_headers).json()
    r = client.post(
        f"/simulators/attempts/{attempt['id']}/sections/reading",
        json={"answers": {str(q.id): "A"}, "time_spent": 120},
        headers=student_headers,
    )
    assert r.status_code == 200
    body = r.json()
    assert body["raw_score"] == 1.0
    assert body["scaled_score"] is not None


def test_submit_section_no_active_attempt_404(client, student_headers):
    r = client.post(
        "/simulators/attempts/999999/sections/reading",
        json={"answers": {}},
        headers=student_headers,
    )
    assert r.status_code == 404


def test_submit_section_resubmit_updates(client, db, student_headers):
    p = ExamPassage(exam_type="toefl", section="reading", order_index=1, title="P", content="text")
    db.add(p)
    db.flush()
    q = ExamQuestion(exam_type="toefl", section="reading", passage_id=p.id, question_type="mcq",
                      question_text="Q?", options_json='["A","B"]', correct_answer="A", points=1.0, order_index=1)
    db.add(q)
    db.commit()
    db.refresh(q)

    attempt = client.post("/simulators/attempts", json={"exam_type": "toefl"}, headers=student_headers).json()
    client.post(f"/simulators/attempts/{attempt['id']}/sections/reading", json={"answers": {str(q.id): "B"}}, headers=student_headers)
    r = client.post(f"/simulators/attempts/{attempt['id']}/sections/reading", json={"answers": {str(q.id): "A"}}, headers=student_headers)
    assert r.json()["raw_score"] == 1.0

    detail = client.get(f"/simulators/attempts/{attempt['id']}", headers=student_headers).json()
    assert len(detail["section_results"]) == 1  # upserted, not duplicated


@requires_groq
def test_complete_attempt(client, db, student_headers):
    p = ExamPassage(exam_type="toefl", section="reading", order_index=1, title="P", content="text")
    db.add(p)
    db.flush()
    q = ExamQuestion(exam_type="toefl", section="reading", passage_id=p.id, question_type="mcq",
                      question_text="Q?", options_json='["A","B"]', correct_answer="A", points=1.0, order_index=1)
    db.add(q)
    db.commit()
    db.refresh(q)

    attempt = client.post("/simulators/attempts", json={"exam_type": "toefl"}, headers=student_headers).json()
    client.post(f"/simulators/attempts/{attempt['id']}/sections/reading", json={"answers": {str(q.id): "A"}}, headers=student_headers)

    r = client.post(f"/simulators/attempts/{attempt['id']}/complete", headers=student_headers)
    assert r.status_code == 200
    body = r.json()
    assert body["overall_score"] is not None
    assert body["score_report"] is not None

    final = client.get(f"/simulators/attempts/{attempt['id']}", headers=student_headers).json()
    assert final["status"] == "completed"


def test_complete_attempt_not_found(client, student_headers):
    r = client.post("/simulators/attempts/999999/complete", headers=student_headers)
    assert r.status_code == 404


# ── Admin CRUD ───────────────────────────────────────────────────────────────

def test_admin_passages_requires_admin(client, student_headers):
    r = client.get("/simulators/admin/passages", headers=student_headers)
    assert r.status_code == 403


def test_admin_create_passage(client, admin_headers):
    r = client.post(
        "/simulators/admin/passages",
        json={"exam_type": "toefl", "section": "reading", "title": "New", "content": "text here"},
        headers=admin_headers,
    )
    assert r.status_code == 201
    assert "id" in r.json()


def test_admin_list_passages(client, admin_headers):
    client.post("/simulators/admin/passages", json={"exam_type": "toefl", "section": "reading", "content": "x"}, headers=admin_headers)
    r = client.get("/simulators/admin/passages", headers=admin_headers)
    assert r.status_code == 200
    assert r.json()["total"] >= 1


def test_admin_update_passage(client, admin_headers):
    created = client.post("/simulators/admin/passages", json={"exam_type": "toefl", "section": "reading", "content": "x"}, headers=admin_headers).json()
    r = client.patch(f"/simulators/admin/passages/{created['id']}", json={"exam_type": "toefl", "section": "reading", "content": "updated", "title": "New Title"}, headers=admin_headers)
    assert r.status_code == 200


def test_admin_update_passage_not_found(client, admin_headers):
    r = client.patch("/simulators/admin/passages/999999", json={"exam_type": "toefl", "section": "reading", "content": "x"}, headers=admin_headers)
    assert r.status_code == 404


def test_admin_delete_passage(client, admin_headers):
    created = client.post("/simulators/admin/passages", json={"exam_type": "toefl", "section": "reading", "content": "x"}, headers=admin_headers).json()
    r = client.delete(f"/simulators/admin/passages/{created['id']}", headers=admin_headers)
    assert r.status_code == 204


def test_admin_create_question(client, admin_headers):
    r = client.post(
        "/simulators/admin/questions",
        json={"exam_type": "toefl", "section": "reading", "question_text": "What?", "correct_answer": "A"},
        headers=admin_headers,
    )
    assert r.status_code == 201


def test_admin_list_questions(client, admin_headers):
    client.post("/simulators/admin/questions", json={"exam_type": "toefl", "section": "reading", "question_text": "Q1"}, headers=admin_headers)
    r = client.get("/simulators/admin/questions", headers=admin_headers)
    assert r.status_code == 200
    assert r.json()["total"] >= 1


def test_admin_update_question(client, admin_headers):
    created = client.post("/simulators/admin/questions", json={"exam_type": "toefl", "section": "reading", "question_text": "Q1"}, headers=admin_headers).json()
    r = client.patch(f"/simulators/admin/questions/{created['id']}", json={"exam_type": "toefl", "section": "reading", "question_text": "Updated Q"}, headers=admin_headers)
    assert r.status_code == 200


def test_admin_delete_question(client, admin_headers):
    created = client.post("/simulators/admin/questions", json={"exam_type": "toefl", "section": "reading", "question_text": "Q1"}, headers=admin_headers).json()
    r = client.delete(f"/simulators/admin/questions/{created['id']}", headers=admin_headers)
    assert r.status_code == 204


def test_seed_exam_content_idempotent(client, admin_headers):
    r1 = client.post("/simulators/admin/seed", headers=admin_headers)
    assert r1.status_code == 201
    assert r1.json()["seeded"] is True

    r2 = client.post("/simulators/admin/seed", headers=admin_headers)
    assert r2.json()["seeded"] is False


def test_seed_requires_admin(client, student_headers):
    r = client.post("/simulators/admin/seed", headers=student_headers)
    assert r.status_code == 403


def test_admin_update_passage_partial(client, admin_headers):
    """Regression test: PATCH previously reused the required-fields create
    schema, so a true partial update (e.g. just difficulty) always 422'd."""
    created = client.post(
        "/simulators/admin/passages",
        json={"exam_type": "toefl", "section": "reading", "title": "Original", "content": "text"},
        headers=admin_headers,
    ).json()
    r = client.patch(f"/simulators/admin/passages/{created['id']}", json={"difficulty": "C1"}, headers=admin_headers)
    assert r.status_code == 200


def test_admin_update_question_partial(client, admin_headers):
    """Same regression as above, for questions."""
    created = client.post(
        "/simulators/admin/questions",
        json={"exam_type": "toefl", "section": "reading", "question_text": "Original?"},
        headers=admin_headers,
    ).json()
    r = client.patch(f"/simulators/admin/questions/{created['id']}", json={"points": 2.0}, headers=admin_headers)
    assert r.status_code == 200
