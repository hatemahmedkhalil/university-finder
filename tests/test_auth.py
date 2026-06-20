def test_register_success(client):
    r = client.post("/auth/register", json={"email": "new@test.com", "password": "Pass1234!"})
    assert r.status_code == 201
    data = r.json()
    assert data["email"] == "new@test.com"
    assert data["role"] == "student"
    assert "hashed_password" not in data


def test_register_duplicate_email(client):
    payload = {"email": "dup@test.com", "password": "Pass1234!"}
    client.post("/auth/register", json=payload)
    r = client.post("/auth/register", json=payload)
    assert r.status_code == 409


def test_login_success(client):
    client.post("/auth/register", json={"email": "login@test.com", "password": "Pass1234!"})
    r = client.post("/auth/login", json={"email": "login@test.com", "password": "Pass1234!"})
    assert r.status_code == 200
    data = r.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"


def test_login_wrong_password(client):
    client.post("/auth/register", json={"email": "wrong@test.com", "password": "Pass1234!"})
    r = client.post("/auth/login", json={"email": "wrong@test.com", "password": "wrongpass"})
    assert r.status_code == 401


def test_login_unknown_email(client):
    r = client.post("/auth/login", json={"email": "nobody@test.com", "password": "Pass1234!"})
    assert r.status_code == 401


def test_refresh_token(client):
    client.post("/auth/register", json={"email": "refresh@test.com", "password": "Pass1234!"})
    login_r = client.post("/auth/login", json={"email": "refresh@test.com", "password": "Pass1234!"})
    refresh_token = login_r.json()["refresh_token"]

    r = client.post("/auth/refresh", json={"refresh_token": refresh_token})
    assert r.status_code == 200
    assert "access_token" in r.json()


def test_refresh_with_access_token_rejected(client):
    client.post("/auth/register", json={"email": "rfail@test.com", "password": "Pass1234!"})
    login_r = client.post("/auth/login", json={"email": "rfail@test.com", "password": "Pass1234!"})
    access_token = login_r.json()["access_token"]

    r = client.post("/auth/refresh", json={"refresh_token": access_token})
    assert r.status_code == 401


def test_protected_route_without_token(client):
    r = client.get("/profiles/me")
    assert r.status_code in (401, 403)  # HTTPBearer returns 403 on older Starlette, 401 on newer
