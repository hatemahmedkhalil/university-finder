"""Tests for /admin — platform-wide admin operations."""


def test_stats_requires_admin(client, student_headers):
    r = client.get("/admin/stats", headers=student_headers)
    assert r.status_code == 403


def test_stats(client, admin_headers, sample_universities):
    r = client.get("/admin/stats", headers=admin_headers)
    assert r.status_code == 200
    body = r.json()
    assert body["total_universities"] == 3
    assert "users_by_role" in body
    assert "top_favourited_universities" in body


def test_stats_top_favourited(client, admin_headers, student_headers, sample_universities):
    uni = sample_universities[0]
    client.post(f"/favourites/{uni.id}", headers=student_headers)

    r = client.get("/admin/stats", headers=admin_headers)
    top = r.json()["top_favourited_universities"]
    assert any(t["name"] == uni.name and t["count"] == 1 for t in top)


def test_get_students_requires_admin(client, student_headers):
    r = client.get("/admin/students", headers=student_headers)
    assert r.status_code == 403


def test_get_students_empty(client, admin_headers):
    r = client.get("/admin/students", headers=admin_headers)
    assert r.status_code == 200
    assert r.json()["total"] == 0


def test_get_students_lists_registered(client, db, admin_headers):
    from tests.conftest import register_and_login

    register_and_login(client, db, "listedstudent@test.com")
    r = client.get("/admin/students", headers=admin_headers)
    body = r.json()
    assert body["total"] == 1
    assert body["items"][0]["email"] == "listedstudent@test.com"
    assert body["items"][0]["has_profile"] is False


def test_get_students_search(client, db, admin_headers):
    from tests.conftest import register_and_login

    register_and_login(client, db, "findable_unique@test.com")
    r = client.get("/admin/students", params={"search": "findable_unique"}, headers=admin_headers)
    assert r.json()["total"] == 1


def test_get_student_detail(client, db, admin_headers):
    from tests.conftest import register_and_login
    from app.core.security import decode_token

    headers = register_and_login(client, db, "detailstudent@test.com")
    uid = int(decode_token(headers["Authorization"].split(" ")[1], "access")[0])

    r = client.get(f"/admin/students/{uid}", headers=admin_headers)
    assert r.status_code == 200
    assert r.json()["email"] == "detailstudent@test.com"


def test_get_student_not_found(client, admin_headers):
    r = client.get("/admin/students/999999", headers=admin_headers)
    assert r.status_code == 404


def test_update_student_profile_requires_existing_profile(client, db, admin_headers):
    from tests.conftest import register_and_login
    from app.core.security import decode_token

    headers = register_and_login(client, db, "noprofile@test.com")
    uid = int(decode_token(headers["Authorization"].split(" ")[1], "access")[0])

    r = client.patch(f"/admin/students/{uid}", json={"prev_university": "Cairo University"}, headers=admin_headers)
    assert r.status_code == 404


def test_update_student_profile(client, student_headers, admin_headers):
    from app.core.security import decode_token

    uid = int(decode_token(student_headers["Authorization"].split(" ")[1], "access")[0])
    client.post("/profiles", json={
        "nationality": "Egyptian", "degree_level": "bachelor", "gpa": 3.5,
        "budget_eur": 5000, "english_level": "b2", "language": "german",
        "preferred_countries": "Germany", "field_of_study": "CS",
    }, headers=student_headers)

    r = client.patch(f"/admin/students/{uid}", json={"prev_university": "Cairo University"}, headers=admin_headers)
    assert r.status_code == 200

    detail = client.get(f"/admin/students/{uid}", headers=admin_headers)
    assert detail.json()["prev_university"] == "Cairo University"


def test_admin_list_users(client, admin_headers):
    r = client.get("/admin/users", headers=admin_headers)
    assert r.status_code == 200
    assert isinstance(r.json(), list)
    assert len(r.json()) >= 1


def test_admin_get_user(client, admin_headers, student_headers):
    from app.core.security import decode_token

    uid = int(decode_token(student_headers["Authorization"].split(" ")[1], "access")[0])
    r = client.get(f"/admin/users/{uid}", headers=admin_headers)
    assert r.status_code == 200
    assert r.json()["id"] == uid


def test_admin_get_user_not_found(client, admin_headers):
    r = client.get("/admin/users/999999", headers=admin_headers)
    assert r.status_code == 404


def test_admin_update_user(client, admin_headers, student_headers):
    from app.core.security import decode_token

    uid = int(decode_token(student_headers["Authorization"].split(" ")[1], "access")[0])
    r = client.patch(f"/admin/users/{uid}", json={"plan": "premium", "is_active": False}, headers=admin_headers)
    assert r.status_code == 200
    assert r.json()["plan"] == "premium"
    assert r.json()["is_active"] is False


def test_admin_update_user_not_found(client, admin_headers):
    r = client.patch("/admin/users/999999", json={"plan": "premium"}, headers=admin_headers)
    assert r.status_code == 404


def test_admin_delete_user(client, db, admin_headers):
    from tests.conftest import register_and_login
    from app.core.security import decode_token

    headers = register_and_login(client, db, "deleteme@test.com")
    uid = int(decode_token(headers["Authorization"].split(" ")[1], "access")[0])

    r = client.delete(f"/admin/users/{uid}", headers=admin_headers)
    assert r.status_code == 204
    assert client.get(f"/admin/users/{uid}", headers=admin_headers).status_code == 404


def test_admin_delete_user_not_found(client, admin_headers):
    r = client.delete("/admin/users/999999", headers=admin_headers)
    assert r.status_code == 404


def test_send_notification_broadcast(client, db, admin_headers):
    from tests.conftest import register_and_login

    register_and_login(client, db, "broadcast1@test.com")
    register_and_login(client, db, "broadcast2@test.com")

    r = client.post("/admin/notifications/send", json={"title": "Maintenance", "message": "Down for 5 min"}, headers=admin_headers)
    assert r.status_code == 201
    assert r.json()["sent"] == 2


def test_send_notification_targeted(client, db, admin_headers):
    from tests.conftest import register_and_login
    from app.core.security import decode_token

    headers = register_and_login(client, db, "targeted@test.com")
    uid = int(decode_token(headers["Authorization"].split(" ")[1], "access")[0])

    r = client.post("/admin/notifications/send", json={"title": "Hi", "message": "Just you", "user_ids": [uid]}, headers=admin_headers)
    assert r.status_code == 201
    assert r.json()["sent"] == 1

    notif = client.get("/notifications", headers=headers)
    assert len(notif.json()) == 1


def test_admin_list_notifications(client, db, admin_headers):
    from tests.conftest import register_and_login

    register_and_login(client, db, "notiflist@test.com")
    client.post("/admin/notifications/send", json={"title": "T", "message": "M"}, headers=admin_headers)

    r = client.get("/admin/notifications", headers=admin_headers)
    assert r.status_code == 200
    assert len(r.json()) >= 1
    assert "user_email" in r.json()[0]


def test_admin_endpoints_require_admin(client, student_headers):
    assert client.get("/admin/users", headers=student_headers).status_code == 403
    assert client.get("/admin/notifications", headers=student_headers).status_code == 403
    assert client.post("/admin/notifications/send", json={"title": "x", "message": "y"}, headers=student_headers).status_code == 403
