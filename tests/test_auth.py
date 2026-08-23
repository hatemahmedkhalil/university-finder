def test_register_success(client):
    r = client.post("/auth/register", json={"email": "new@test.com", "password": "Pass1234!"})
    assert r.status_code == 201
    data = r.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"


def test_register_duplicate_email(client):
    payload = {"email": "dup@test.com", "password": "Pass1234!"}
    client.post("/auth/register", json=payload)
    r = client.post("/auth/register", json=payload)
    assert r.status_code == 409


# ---------------------------------------------------------------------------
# Welcome Tour / onboarding persistence — the frontend's "new user sees the
# tour, returning user doesn't" behavior relies entirely on this flag being
# correctly persisted and returned.
# ---------------------------------------------------------------------------

def _register_headers(client, email):
    r = client.post("/auth/register", json={"email": email, "password": "Pass1234!"})
    token = r.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_new_user_has_not_completed_onboarding(client):
    headers = _register_headers(client, "onboard1@test.com")
    r = client.get("/auth/me", headers=headers)
    assert r.status_code == 200
    assert r.json()["has_completed_onboarding"] is False


def test_complete_onboarding_persists(client):
    headers = _register_headers(client, "onboard2@test.com")
    r = client.post("/auth/onboarding/complete", headers=headers)
    assert r.status_code == 200
    assert r.json()["has_completed_onboarding"] is True

    # Persisted, not just in the response — a fresh /auth/me confirms it
    # (this is what a returning user's session-restore checks).
    r2 = client.get("/auth/me", headers=headers)
    assert r2.json()["has_completed_onboarding"] is True


def test_reset_onboarding_persists(client):
    headers = _register_headers(client, "onboard3@test.com")
    client.post("/auth/onboarding/complete", headers=headers)
    r = client.post("/auth/onboarding/reset", headers=headers)
    assert r.status_code == 200
    assert r.json()["has_completed_onboarding"] is False

    r2 = client.get("/auth/me", headers=headers)
    assert r2.json()["has_completed_onboarding"] is False


def test_onboarding_endpoints_require_auth(client):
    assert client.post("/auth/onboarding/complete").status_code == 401
    assert client.post("/auth/onboarding/reset").status_code == 401


def _verify(db, email):
    from app.models.user import User

    user = db.query(User).filter(User.email == email).first()
    user.is_verified = True
    db.commit()


def test_login_unverified_email_rejected(client):
    """Registering does not auto-verify a non-admin user; login must be blocked until they do."""
    client.post("/auth/register", json={"email": "unverified@test.com", "password": "Pass1234!"})
    r = client.post("/auth/login", json={"email": "unverified@test.com", "password": "Pass1234!"})
    assert r.status_code == 403


def test_login_success(client, db):
    client.post("/auth/register", json={"email": "login@test.com", "password": "Pass1234!"})
    _verify(db, "login@test.com")
    r = client.post("/auth/login", json={"email": "login@test.com", "password": "Pass1234!"})
    assert r.status_code == 200
    data = r.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"


def test_login_wrong_password(client, db):
    client.post("/auth/register", json={"email": "wrong@test.com", "password": "Pass1234!"})
    _verify(db, "wrong@test.com")
    r = client.post("/auth/login", json={"email": "wrong@test.com", "password": "wrongpass"})
    assert r.status_code == 401


def test_login_unknown_email(client):
    r = client.post("/auth/login", json={"email": "nobody@test.com", "password": "Pass1234!"})
    assert r.status_code == 401


def test_refresh_token(client, db):
    client.post("/auth/register", json={"email": "refresh@test.com", "password": "Pass1234!"})
    _verify(db, "refresh@test.com")
    login_r = client.post("/auth/login", json={"email": "refresh@test.com", "password": "Pass1234!"})
    refresh_token = login_r.json()["refresh_token"]

    r = client.post("/auth/refresh", json={"refresh_token": refresh_token})
    assert r.status_code == 200
    assert "access_token" in r.json()


def test_refresh_with_access_token_rejected(client, db):
    client.post("/auth/register", json={"email": "rfail@test.com", "password": "Pass1234!"})
    _verify(db, "rfail@test.com")
    login_r = client.post("/auth/login", json={"email": "rfail@test.com", "password": "Pass1234!"})
    access_token = login_r.json()["access_token"]

    r = client.post("/auth/refresh", json={"refresh_token": access_token})
    assert r.status_code == 401


def test_protected_route_without_token(client):
    r = client.get("/profiles/me")
    assert r.status_code in (401, 403)  # HTTPBearer returns 403 on older Starlette, 401 on newer
