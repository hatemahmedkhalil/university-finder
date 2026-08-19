"""Tests for /api/community — posts, comments, likes."""


def _create_post(client, headers, title="My first post about visas", body="Does anyone have tips for the German visa process?"):
    r = client.post(
        "/api/community/posts",
        json={"title": title, "body": body, "category": "visa"},
        headers=headers,
    )
    assert r.status_code == 201
    return r.json()["id"]


def test_create_post(client, student_headers):
    r = client.post(
        "/api/community/posts",
        json={"title": "Hello everyone", "body": "This is my first community post here.", "category": "general"},
        headers=student_headers,
    )
    assert r.status_code == 201
    assert "id" in r.json()


def test_create_post_requires_auth(client):
    r = client.post("/api/community/posts", json={"title": "x" * 5, "body": "y" * 15, "category": "general"})
    assert r.status_code == 401


def test_create_post_invalid_category(client, student_headers):
    r = client.post(
        "/api/community/posts",
        json={"title": "Hello everyone", "body": "This is my first community post here.", "category": "not-a-real-category"},
        headers=student_headers,
    )
    assert r.status_code == 400


def test_create_post_invalid_country_tag(client, student_headers):
    r = client.post(
        "/api/community/posts",
        json={"title": "Hello everyone", "body": "This is my first community post here.", "category": "general", "country_tag": "Atlantis"},
        headers=student_headers,
    )
    assert r.status_code == 400


def test_create_post_title_too_short_rejected(client, student_headers):
    r = client.post(
        "/api/community/posts",
        json={"title": "ab", "body": "This is my first community post here.", "category": "general"},
        headers=student_headers,
    )
    assert r.status_code == 422


def test_list_posts(client, student_headers):
    _create_post(client, student_headers)
    r = client.get("/api/community/posts", headers=student_headers)
    assert r.status_code == 200
    body = r.json()
    assert body["total"] >= 1
    assert len(body["posts"]) >= 1
    assert "author_name" in body["posts"][0]


def test_list_posts_filter_by_category(client, student_headers):
    _create_post(client, student_headers, title="Housing tips for Poland", body="Where should I look for student housing?")
    r = client.get("/api/community/posts", params={"category": "visa"}, headers=student_headers)
    assert r.status_code == 200
    assert all(p["category"] == "visa" for p in r.json()["posts"])


def test_list_posts_search(client, student_headers):
    _create_post(client, student_headers, title="Unique searchable phrase xyz123", body="body text for search test here")
    r = client.get("/api/community/posts", params={"search": "xyz123"}, headers=student_headers)
    assert r.status_code == 200
    assert any("xyz123" in p["title"] for p in r.json()["posts"])


def test_get_post_detail(client, student_headers):
    post_id = _create_post(client, student_headers)
    r = client.get(f"/api/community/posts/{post_id}", headers=student_headers)
    assert r.status_code == 200
    body = r.json()
    assert body["id"] == post_id
    assert body["comments"] == []
    assert body["liked_by_me"] is False


def test_get_post_not_found(client, student_headers):
    r = client.get("/api/community/posts/999999", headers=student_headers)
    assert r.status_code == 404


def test_toggle_like(client, student_headers):
    post_id = _create_post(client, student_headers)
    r1 = client.post(f"/api/community/posts/{post_id}/like", headers=student_headers)
    assert r1.status_code == 200
    assert r1.json() == {"liked": True, "likes": 1}

    r2 = client.post(f"/api/community/posts/{post_id}/like", headers=student_headers)
    assert r2.status_code == 200
    assert r2.json() == {"liked": False, "likes": 0}


def test_add_comment(client, student_headers):
    post_id = _create_post(client, student_headers)
    r = client.post(f"/api/community/posts/{post_id}/comments", json={"body": "Great question!"}, headers=student_headers)
    assert r.status_code == 201
    assert r.json()["body"] == "Great question!"

    detail = client.get(f"/api/community/posts/{post_id}", headers=student_headers).json()
    assert len(detail["comments"]) == 1


def test_add_comment_post_not_found(client, student_headers):
    r = client.post("/api/community/posts/999999/comments", json={"body": "hi there"}, headers=student_headers)
    assert r.status_code == 404


def test_add_comment_too_short_rejected(client, student_headers):
    post_id = _create_post(client, student_headers)
    r = client.post(f"/api/community/posts/{post_id}/comments", json={"body": "a"}, headers=student_headers)
    assert r.status_code == 422


def test_delete_own_post(client, student_headers):
    post_id = _create_post(client, student_headers)
    r = client.delete(f"/api/community/posts/{post_id}", headers=student_headers)
    assert r.status_code == 204
    assert client.get(f"/api/community/posts/{post_id}", headers=student_headers).status_code == 404


def test_delete_post_wrong_owner_forbidden(client, db, student_headers):
    from tests.conftest import register_and_login

    bob = register_and_login(client, db, "bob_community@test.com")
    post_id = _create_post(client, bob)

    r = client.delete(f"/api/community/posts/{post_id}", headers=student_headers)
    assert r.status_code == 403


def test_admin_can_delete_any_post(client, db, admin_headers):
    from tests.conftest import register_and_login

    alice = register_and_login(client, db, "alice_community@test.com")
    post_id = _create_post(client, alice)

    r = client.delete(f"/api/community/posts/{post_id}", headers=admin_headers)
    assert r.status_code == 204


def test_delete_own_comment(client, student_headers):
    post_id = _create_post(client, student_headers)
    comment = client.post(f"/api/community/posts/{post_id}/comments", json={"body": "Deleting this soon"}, headers=student_headers).json()

    r = client.delete(f"/api/community/comments/{comment['id']}", headers=student_headers)
    assert r.status_code == 204


def test_delete_comment_wrong_owner_forbidden(client, db, student_headers):
    from tests.conftest import register_and_login

    bob = register_and_login(client, db, "bob_comment@test.com")
    post_id = _create_post(client, student_headers)
    comment = client.post(f"/api/community/posts/{post_id}/comments", json={"body": "Bob's comment here"}, headers=bob).json()

    r = client.delete(f"/api/community/comments/{comment['id']}", headers=student_headers)
    assert r.status_code == 403


def test_delete_comment_not_found(client, student_headers):
    r = client.delete("/api/community/comments/999999", headers=student_headers)
    assert r.status_code == 404
