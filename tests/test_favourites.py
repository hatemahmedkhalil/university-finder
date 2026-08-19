"""Tests for /favourites."""


def test_list_favourites_empty(client, student_headers):
    r = client.get("/favourites", headers=student_headers)
    assert r.status_code == 200
    assert r.json() == []


def test_add_favourite(client, student_headers, sample_universities):
    uni = sample_universities[0]
    r = client.post(f"/favourites/{uni.id}", headers=student_headers)
    assert r.status_code == 201
    assert r.json() == {"message": "Added to favourites"}

    listed = client.get("/favourites", headers=student_headers)
    assert len(listed.json()) == 1
    assert listed.json()[0]["id"] == uni.id


def test_add_favourite_requires_auth(client, sample_universities):
    r = client.post(f"/favourites/{sample_universities[0].id}")
    assert r.status_code == 401


def test_add_favourite_unknown_university(client, student_headers):
    r = client.post("/favourites/999999", headers=student_headers)
    assert r.status_code == 404


def test_add_favourite_duplicate(client, student_headers, sample_universities):
    uni = sample_universities[0]
    client.post(f"/favourites/{uni.id}", headers=student_headers)
    r = client.post(f"/favourites/{uni.id}", headers=student_headers)
    assert r.status_code == 201
    assert r.json() == {"message": "Already in favourites"}


def test_remove_favourite(client, student_headers, sample_universities):
    uni = sample_universities[0]
    client.post(f"/favourites/{uni.id}", headers=student_headers)
    r = client.delete(f"/favourites/{uni.id}", headers=student_headers)
    assert r.status_code == 200
    assert client.get("/favourites", headers=student_headers).json() == []


def test_remove_favourite_not_present(client, student_headers, sample_universities):
    r = client.delete(f"/favourites/{sample_universities[0].id}", headers=student_headers)
    assert r.status_code == 404


def test_favourites_isolated_between_users(client, db, sample_universities):
    from tests.conftest import register_and_login

    alice = register_and_login(client, db, "alice_fav@test.com")
    bob = register_and_login(client, db, "bob_fav@test.com")
    client.post(f"/favourites/{sample_universities[0].id}", headers=alice)

    r = client.get("/favourites", headers=bob)
    assert r.json() == []
