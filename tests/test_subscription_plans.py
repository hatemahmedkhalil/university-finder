"""Tests for /subscription-plans."""


def test_list_plans_empty(client):
    r = client.get("/subscription-plans")
    assert r.status_code == 200
    assert r.json() == []


def test_create_plan_requires_admin(client, student_headers):
    r = client.post("/subscription-plans", json={"name": "Pro"}, headers=student_headers)
    assert r.status_code == 403


def test_create_plan(client, admin_headers):
    r = client.post(
        "/subscription-plans",
        json={"name": "Pro", "price": 9.99, "features": ["Unlimited AI chat", "Priority support"]},
        headers=admin_headers,
    )
    assert r.status_code == 201
    body = r.json()
    assert body["name"] == "Pro"
    assert body["features"] == ["Unlimited AI chat", "Priority support"]


def test_list_plans_only_active(client, admin_headers):
    client.post("/subscription-plans", json={"name": "Active Plan", "is_active": True}, headers=admin_headers)
    client.post("/subscription-plans", json={"name": "Inactive Plan", "is_active": False}, headers=admin_headers)

    r = client.get("/subscription-plans")
    names = {p["name"] for p in r.json()}
    assert "Active Plan" in names
    assert "Inactive Plan" not in names


def test_get_plan(client, admin_headers):
    created = client.post("/subscription-plans", json={"name": "Pro"}, headers=admin_headers).json()
    r = client.get(f"/subscription-plans/{created['id']}")
    assert r.status_code == 200
    assert r.json()["name"] == "Pro"


def test_get_plan_not_found(client):
    r = client.get("/subscription-plans/999999")
    assert r.status_code == 404


def test_update_plan(client, admin_headers):
    created = client.post("/subscription-plans", json={"name": "Pro", "price": 9.99}, headers=admin_headers).json()
    r = client.patch(f"/subscription-plans/{created['id']}", json={"price": 14.99}, headers=admin_headers)
    assert r.status_code == 200
    assert r.json()["price"] == 14.99
    assert r.json()["name"] == "Pro"  # unchanged fields preserved


def test_update_plan_requires_admin(client, admin_headers, student_headers):
    created = client.post("/subscription-plans", json={"name": "Pro"}, headers=admin_headers).json()
    r = client.patch(f"/subscription-plans/{created['id']}", json={"price": 1}, headers=student_headers)
    assert r.status_code == 403


def test_delete_plan(client, admin_headers):
    created = client.post("/subscription-plans", json={"name": "Temp"}, headers=admin_headers).json()
    r = client.delete(f"/subscription-plans/{created['id']}", headers=admin_headers)
    assert r.status_code == 204
    assert client.get(f"/subscription-plans/{created['id']}").status_code == 404


def test_delete_plan_not_found(client, admin_headers):
    r = client.delete("/subscription-plans/999999", headers=admin_headers)
    assert r.status_code == 404
