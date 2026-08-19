"""Tests for /application-guides. generate_guide (real HTTP + Groq) is not
covered here — it makes live network fetches to arbitrary university
websites, which isn't safe to run unmocked in a test suite."""


def test_get_guide_no_guide_yet(client, student_headers, sample_universities):
    uni = sample_universities[0]
    r = client.get(f"/application-guides/{uni.id}", headers=student_headers)
    assert r.status_code == 200
    body = r.json()
    assert body["has_guide"] is False
    assert body["guide"] is None


def test_get_guide_unknown_university(client, student_headers):
    r = client.get("/application-guides/999999", headers=student_headers)
    assert r.status_code == 404


def test_get_guide_requires_auth(client, sample_universities):
    r = client.get(f"/application-guides/{sample_universities[0].id}")
    assert r.status_code == 401


def test_update_guide_requires_admin(client, student_headers, sample_universities):
    uni = sample_universities[0]
    r = client.patch(
        f"/application-guides/admin/{uni.id}",
        json={"guide": [{"step": 1, "title": "Apply", "description": "Fill the form"}]},
        headers=student_headers,
    )
    assert r.status_code == 403


def test_update_guide(client, admin_headers, student_headers, sample_universities):
    uni = sample_universities[0]
    r = client.patch(
        f"/application-guides/admin/{uni.id}",
        json={"guide": [
            {"step": 1, "title": "Create account", "description": "Sign up on the portal", "action_type": "account"},
            {"step": 2, "title": "Upload documents", "description": "Upload your transcript", "action_type": "document"},
        ]},
        headers=admin_headers,
    )
    assert r.status_code == 200
    assert r.json()["steps_saved"] == 2

    fetched = client.get(f"/application-guides/{uni.id}", headers=student_headers)
    assert fetched.json()["has_guide"] is True
    assert len(fetched.json()["guide"]) == 2


def test_update_guide_unknown_university(client, admin_headers):
    r = client.patch(
        "/application-guides/admin/999999",
        json={"guide": [{"step": 1, "title": "x", "description": "y"}]},
        headers=admin_headers,
    )
    assert r.status_code == 404


def test_update_guide_empty_list_rejected(client, admin_headers, sample_universities):
    r = client.patch(f"/application-guides/admin/{sample_universities[0].id}", json={"guide": []}, headers=admin_headers)
    assert r.status_code == 422


def test_delete_guide(client, admin_headers, student_headers, sample_universities):
    uni = sample_universities[0]
    client.patch(
        f"/application-guides/admin/{uni.id}",
        json={"guide": [{"step": 1, "title": "x", "description": "y"}]},
        headers=admin_headers,
    )
    r = client.delete(f"/application-guides/admin/{uni.id}", headers=admin_headers)
    assert r.status_code == 204

    fetched = client.get(f"/application-guides/{uni.id}", headers=student_headers)
    assert fetched.json()["has_guide"] is False


def test_delete_guide_requires_admin(client, student_headers, sample_universities):
    r = client.delete(f"/application-guides/admin/{sample_universities[0].id}", headers=student_headers)
    assert r.status_code == 403
