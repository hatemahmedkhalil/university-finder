"""Tests for /learning — placement tests, courses, lessons."""


def test_list_placement_tests_empty(client):
    r = client.get("/learning/placement-tests")
    assert r.status_code == 200
    assert r.json() == []


def test_create_placement_test_requires_admin(client, student_headers):
    r = client.post("/learning/placement-tests", json={"title": "German A1 Test", "language": "german"}, headers=student_headers)
    assert r.status_code == 403


def test_create_and_list_placement_test(client, admin_headers):
    created = client.post("/learning/placement-tests", json={"title": "German A1 Test", "language": "german"}, headers=admin_headers)
    assert created.status_code == 200

    r = client.get("/learning/placement-tests")
    assert len(r.json()) == 1
    assert r.json()[0]["title"] == "German A1 Test"


def test_list_placement_tests_filter_by_language(client, admin_headers):
    client.post("/learning/placement-tests", json={"title": "German Test", "language": "german"}, headers=admin_headers)
    client.post("/learning/placement-tests", json={"title": "English Test", "language": "english"}, headers=admin_headers)

    r = client.get("/learning/placement-tests", params={"language": "german"})
    titles = {t["title"] for t in r.json()}
    assert titles == {"German Test"}


def test_get_placement_test(client, admin_headers):
    created = client.post("/learning/placement-tests", json={"title": "Test", "language": "german"}, headers=admin_headers).json()
    r = client.get(f"/learning/placement-tests/{created['id']}")
    assert r.status_code == 200
    assert r.json()["questions"] == []


def test_get_placement_test_not_found(client):
    r = client.get("/learning/placement-tests/999999")
    assert r.status_code == 404


def test_update_placement_test(client, admin_headers):
    created = client.post("/learning/placement-tests", json={"title": "Old", "language": "german"}, headers=admin_headers).json()
    r = client.patch(f"/learning/placement-tests/{created['id']}", json={"title": "New"}, headers=admin_headers)
    assert r.status_code == 200
    assert r.json()["title"] == "New"


def test_update_placement_test_not_found(client, admin_headers):
    r = client.patch("/learning/placement-tests/999999", json={"title": "x"}, headers=admin_headers)
    assert r.status_code == 404


def test_delete_placement_test(client, admin_headers):
    created = client.post("/learning/placement-tests", json={"title": "Temp", "language": "german"}, headers=admin_headers).json()
    r = client.delete(f"/learning/placement-tests/{created['id']}", headers=admin_headers)
    assert r.status_code == 200
    assert client.get(f"/learning/placement-tests/{created['id']}").status_code == 404


def test_delete_placement_test_not_found(client, admin_headers):
    r = client.delete("/learning/placement-tests/999999", headers=admin_headers)
    assert r.status_code == 404


# ── Placement test questions ─────────────────────────────────────────────────

def test_add_question(client, admin_headers):
    test = client.post("/learning/placement-tests", json={"title": "Test", "language": "german"}, headers=admin_headers).json()
    r = client.post(f"/learning/placement-tests/{test['id']}/questions", json={"question_text": "Was ist das?"}, headers=admin_headers)
    assert r.status_code == 200

    detail = client.get(f"/learning/placement-tests/{test['id']}")
    assert len(detail.json()["questions"]) == 1


def test_add_question_unknown_test(client, admin_headers):
    r = client.post("/learning/placement-tests/999999/questions", json={"question_text": "x"}, headers=admin_headers)
    assert r.status_code == 404


def test_delete_question(client, admin_headers):
    test = client.post("/learning/placement-tests", json={"title": "Test", "language": "german"}, headers=admin_headers).json()
    q = client.post(f"/learning/placement-tests/{test['id']}/questions", json={"question_text": "Q1"}, headers=admin_headers).json()

    r = client.delete(f"/learning/placement-tests/questions/{q['id']}", headers=admin_headers)
    assert r.status_code == 200


def test_delete_question_not_found(client, admin_headers):
    r = client.delete("/learning/placement-tests/questions/999999", headers=admin_headers)
    assert r.status_code == 404


# ── Courses ──────────────────────────────────────────────────────────────────

def test_list_courses_empty(client):
    r = client.get("/learning/courses")
    assert r.status_code == 200
    assert r.json() == []


def test_create_course_requires_admin(client, student_headers):
    r = client.post("/learning/courses", json={"title": "German A1", "language": "german"}, headers=student_headers)
    assert r.status_code == 403


def test_create_and_list_course(client, admin_headers):
    client.post("/learning/courses", json={"title": "German A1", "language": "german", "level": "a1"}, headers=admin_headers)
    r = client.get("/learning/courses")
    assert len(r.json()) == 1
    assert r.json()[0]["level"] == "a1"


def test_list_courses_filter(client, admin_headers):
    client.post("/learning/courses", json={"title": "German A1", "language": "german", "level": "A1"}, headers=admin_headers)
    client.post("/learning/courses", json={"title": "German B2", "language": "german", "level": "B2"}, headers=admin_headers)

    r = client.get("/learning/courses", params={"level": "a1"})
    titles = {c["title"] for c in r.json()}
    assert titles == {"German A1"}


def test_get_course(client, admin_headers):
    created = client.post("/learning/courses", json={"title": "Course", "language": "german"}, headers=admin_headers).json()
    r = client.get(f"/learning/courses/{created['id']}")
    assert r.status_code == 200
    assert r.json()["lessons"] == []


def test_get_course_not_found(client):
    r = client.get("/learning/courses/999999")
    assert r.status_code == 404


def test_update_course(client, admin_headers):
    created = client.post("/learning/courses", json={"title": "Old", "language": "german"}, headers=admin_headers).json()
    r = client.patch(f"/learning/courses/{created['id']}", json={"title": "New"}, headers=admin_headers)
    assert r.status_code == 200
    assert r.json()["title"] == "New"


def test_delete_course(client, admin_headers):
    created = client.post("/learning/courses", json={"title": "Temp", "language": "german"}, headers=admin_headers).json()
    r = client.delete(f"/learning/courses/{created['id']}", headers=admin_headers)
    assert r.status_code == 200
    assert client.get(f"/learning/courses/{created['id']}").status_code == 404


def test_delete_course_not_found(client, admin_headers):
    r = client.delete("/learning/courses/999999", headers=admin_headers)
    assert r.status_code == 404


# ── Lessons ──────────────────────────────────────────────────────────────────

def test_add_lesson(client, admin_headers):
    course = client.post("/learning/courses", json={"title": "Course", "language": "german"}, headers=admin_headers).json()
    r = client.post(f"/learning/courses/{course['id']}/lessons", json={"title": "Lesson 1"}, headers=admin_headers)
    assert r.status_code == 200

    detail = client.get(f"/learning/courses/{course['id']}")
    assert len(detail.json()["lessons"]) == 1


def test_add_lesson_unknown_course(client, admin_headers):
    r = client.post("/learning/courses/999999/lessons", json={"title": "x"}, headers=admin_headers)
    assert r.status_code == 404


def test_add_lesson_requires_admin(client, student_headers, admin_headers):
    course = client.post("/learning/courses", json={"title": "Course", "language": "german"}, headers=admin_headers).json()
    r = client.post(f"/learning/courses/{course['id']}/lessons", json={"title": "x"}, headers=student_headers)
    assert r.status_code == 403


def test_delete_lesson(client, admin_headers):
    course = client.post("/learning/courses", json={"title": "Course", "language": "german"}, headers=admin_headers).json()
    lesson = client.post(f"/learning/courses/{course['id']}/lessons", json={"title": "L1"}, headers=admin_headers).json()

    r = client.delete(f"/learning/courses/lessons/{lesson['id']}", headers=admin_headers)
    assert r.status_code == 200


def test_delete_lesson_not_found(client, admin_headers):
    r = client.delete("/learning/courses/lessons/999999", headers=admin_headers)
    assert r.status_code == 404
