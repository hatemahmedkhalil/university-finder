"""
Tests for /ai-chat. GROQ_API_KEY is loaded from the real .env, so /message,
/letter-feedback, and /admin/run-daily-insights make live Groq calls.
"""
from tests.conftest import requires_groq

from app.models.ai_chat_message import AiChatMessage


def test_get_my_plan(client, student_headers):
    r = client.get("/ai-chat/me", headers=student_headers)
    assert r.status_code == 200
    assert r.json()["plan"] == "free"


def test_get_my_plan_requires_auth(client):
    r = client.get("/ai-chat/me")
    assert r.status_code == 401


# ── sessions / history ─────────────────────────────────────────────────────

def test_get_sessions_empty(client, student_headers):
    r = client.get("/ai-chat/sessions", headers=student_headers)
    assert r.status_code == 200
    assert r.json() == []


def test_get_sessions_returns_real_data(client, db, student_headers):
    """Regression test: _build query previously NameError'd on an undefined
    `sa` name and was silently swallowed, so this endpoint always returned []."""
    from app.core.security import decode_token

    user_id = int(decode_token(student_headers["Authorization"].split(" ")[1], "access")[0])
    db.add(AiChatMessage(user_id=user_id, session_id="s1", role="user", content="Hello there"))
    db.add(AiChatMessage(user_id=user_id, session_id="s1", role="assistant", content="Hi!"))
    db.commit()

    r = client.get("/ai-chat/sessions", headers=student_headers)
    assert r.status_code == 200
    sessions = r.json()
    assert len(sessions) == 1
    assert sessions[0]["session_id"] == "s1"
    assert sessions[0]["title"].startswith("Hello there")


def test_get_history_without_session_id_returns_empty(client, student_headers):
    r = client.get("/ai-chat/history", headers=student_headers)
    assert r.status_code == 200
    assert r.json() == []


def test_get_history_with_session_id(client, db, student_headers):
    from app.core.security import decode_token

    user_id = int(decode_token(student_headers["Authorization"].split(" ")[1], "access")[0])
    db.add(AiChatMessage(user_id=user_id, session_id="s2", role="user", content="Question?"))
    db.commit()

    r = client.get("/ai-chat/history", params={"session_id": "s2"}, headers=student_headers)
    assert r.status_code == 200
    body = r.json()
    assert len(body) == 1
    assert body[0]["content"] == "Question?"


def test_history_isolated_between_users(client, db, sample_universities):
    from tests.conftest import register_and_login
    from app.core.security import decode_token

    alice = register_and_login(client, db, "alice_chat@test.com")
    bob = register_and_login(client, db, "bob_chat@test.com")
    alice_id = int(decode_token(alice["Authorization"].split(" ")[1], "access")[0])

    db.add(AiChatMessage(user_id=alice_id, session_id="shared", role="user", content="Alice's message"))
    db.commit()

    r = client.get("/ai-chat/history", params={"session_id": "shared"}, headers=bob)
    assert r.json() == []


def test_context_summary_defaults(client, student_headers):
    r = client.get("/ai-chat/context-summary", headers=student_headers)
    assert r.status_code == 200
    body = r.json()
    assert body["has_profile"] is False
    assert body["pipeline_count"] == 0
    assert body["favourites_count"] == 0


def test_clear_history(client, db, student_headers):
    from app.core.security import decode_token

    user_id = int(decode_token(student_headers["Authorization"].split(" ")[1], "access")[0])
    db.add(AiChatMessage(user_id=user_id, session_id="s3", role="user", content="Hi"))
    db.commit()

    r = client.delete("/ai-chat/history", headers=student_headers)
    assert r.status_code == 200

    r2 = client.get("/ai-chat/history", params={"session_id": "s3"}, headers=student_headers)
    assert r2.json() == []


# ── execute-action ──────────────────────────────────────────────────────────

def test_execute_action_add_calendar(client, student_headers):
    r = client.post(
        "/ai-chat/execute-action",
        json={"type": "add_calendar", "data": {"title": "Application deadline", "event_date": "2026-12-01"}},
        headers=student_headers,
    )
    assert r.status_code == 200
    assert r.json()["ok"] is True


def test_execute_action_add_calendar_missing_fields(client, student_headers):
    r = client.post(
        "/ai-chat/execute-action",
        json={"type": "add_calendar", "data": {"title": "No date"}},
        headers=student_headers,
    )
    assert r.status_code == 400


def test_execute_action_add_calendar_bad_date(client, student_headers):
    r = client.post(
        "/ai-chat/execute-action",
        json={"type": "add_calendar", "data": {"title": "X", "event_date": "not-a-date"}},
        headers=student_headers,
    )
    assert r.status_code == 400


def test_execute_action_add_calendar_duplicate(client, student_headers):
    payload = {"type": "add_calendar", "data": {"title": "Deadline", "event_date": "2026-12-01"}}
    client.post("/ai-chat/execute-action", json=payload, headers=student_headers)
    r = client.post("/ai-chat/execute-action", json=payload, headers=student_headers)
    assert r.status_code == 200
    assert r.json().get("already_existed") is True


def test_execute_action_add_pipeline(client, student_headers, sample_universities):
    uni = sample_universities[0]
    r = client.post(
        "/ai-chat/execute-action",
        json={"type": "add_pipeline", "data": {"university_name": uni.name}},
        headers=student_headers,
    )
    assert r.status_code == 200
    assert r.json()["ok"] is True


def test_execute_action_add_pipeline_unknown_university(client, student_headers):
    r = client.post(
        "/ai-chat/execute-action",
        json={"type": "add_pipeline", "data": {"university_name": "Not A Real University"}},
        headers=student_headers,
    )
    assert r.status_code == 404


def test_execute_action_add_pipeline_duplicate(client, student_headers, sample_universities):
    payload = {"type": "add_pipeline", "data": {"university_name": sample_universities[0].name}}
    client.post("/ai-chat/execute-action", json=payload, headers=student_headers)
    r = client.post("/ai-chat/execute-action", json=payload, headers=student_headers)
    assert r.status_code == 200
    assert r.json().get("already_existed") is True


def test_execute_action_add_pipeline_creates_valid_status_entry(client, db, student_headers, sample_universities):
    """Regression test: the AI Chat add_pipeline action used to INSERT a raw
    row with status='pending', which is not in VALID_STATUSES and made the
    entry silently disappear from every Pipeline Kanban column. It must now
    go through the same creation path as POST /pipeline and always produce
    one of the five real statuses."""
    from app.models.pipeline import PipelineEntry, VALID_STATUSES

    uni = sample_universities[0]
    r = client.post(
        "/ai-chat/execute-action",
        json={"type": "add_pipeline", "data": {"university_name": uni.name}},
        headers=student_headers,
    )
    assert r.status_code == 200

    entry = db.query(PipelineEntry).filter(PipelineEntry.university_id == uni.id).first()
    assert entry is not None
    assert entry.status in VALID_STATUSES
    assert entry.status == "shortlisted"
    # Also confirms it went through the real creation path, not a bare INSERT —
    # checklist is always populated (falls back to the generic 5-item list).
    assert entry.checklist is not None


def test_execute_action_add_favorite(client, student_headers, sample_universities):
    r = client.post(
        "/ai-chat/execute-action",
        json={"type": "add_favorite", "data": {"university_name": sample_universities[0].name}},
        headers=student_headers,
    )
    assert r.status_code == 200
    assert r.json()["ok"] is True


def test_execute_action_remove_pipeline(client, student_headers, sample_universities):
    uni_name = sample_universities[0].name
    client.post("/ai-chat/execute-action", json={"type": "add_pipeline", "data": {"university_name": uni_name}}, headers=student_headers)

    r = client.post("/ai-chat/execute-action", json={"type": "remove_pipeline", "data": {"university_name": uni_name}}, headers=student_headers)
    assert r.status_code == 200
    assert r.json()["ok"] is True


def test_execute_action_remove_pipeline_not_present(client, student_headers, sample_universities):
    r = client.post(
        "/ai-chat/execute-action",
        json={"type": "remove_pipeline", "data": {"university_name": sample_universities[0].name}},
        headers=student_headers,
    )
    assert r.status_code == 200
    assert r.json().get("already_existed") is True


def test_execute_action_remove_favorite(client, student_headers, sample_universities):
    uni_name = sample_universities[0].name
    client.post("/ai-chat/execute-action", json={"type": "add_favorite", "data": {"university_name": uni_name}}, headers=student_headers)

    r = client.post("/ai-chat/execute-action", json={"type": "remove_favorite", "data": {"university_name": uni_name}}, headers=student_headers)
    assert r.status_code == 200
    assert r.json()["ok"] is True


def test_execute_action_unknown_type(client, student_headers):
    r = client.post("/ai-chat/execute-action", json={"type": "delete_account", "data": {}}, headers=student_headers)
    assert r.status_code == 400


def test_execute_action_requires_auth(client):
    r = client.post("/ai-chat/execute-action", json={"type": "add_calendar", "data": {}})
    assert r.status_code == 401


# ── admin ────────────────────────────────────────────────────────────────────

def test_set_user_plan_requires_admin(client, student_headers):
    r = client.patch("/ai-chat/admin/users/1/plan", json={"plan": "premium"}, headers=student_headers)
    assert r.status_code == 403


def test_set_user_plan_success(client, db, admin_headers):
    from tests.conftest import register_and_login
    from app.core.security import decode_token

    target = register_and_login(client, db, "planupgrade@test.com")
    target_id = int(decode_token(target["Authorization"].split(" ")[1], "access")[0])

    r = client.patch(f"/ai-chat/admin/users/{target_id}/plan", json={"plan": "premium"}, headers=admin_headers)
    assert r.status_code == 200
    assert r.json()["plan"] == "premium"


def test_set_user_plan_invalid_value(client, admin_headers):
    r = client.patch("/ai-chat/admin/users/1/plan", json={"plan": "gold"}, headers=admin_headers)
    assert r.status_code == 400


def test_set_user_plan_unknown_user(client, admin_headers):
    r = client.patch("/ai-chat/admin/users/999999/plan", json={"plan": "premium"}, headers=admin_headers)
    assert r.status_code == 404


# ── message (live Groq call) ────────────────────────────────────────────────

@requires_groq
def test_send_message_creates_history(client, student_headers, sample_universities):
    r = client.post("/ai-chat/message", json={"message": "Hi, who are you?", "session_id": "live-1"}, headers=student_headers)
    assert r.status_code == 200
    body = r.json()
    assert body["role"] == "assistant"
    assert body["content"]
    assert body["session_id"] == "live-1"

    hist = client.get("/ai-chat/history", params={"session_id": "live-1"}, headers=student_headers)
    assert hist.status_code == 200
    roles = [m["role"] for m in hist.json()]
    assert roles == ["user", "assistant"]


def test_send_message_creates_history_mocked(client, student_headers, sample_universities, mock_ai_client):
    """Deterministic counterpart of test_send_message_creates_history — same
    route, same assertions, but app.services.ai_client is mocked instead of
    calling the live Groq API, so this always runs in CI regardless of Groq
    availability (see tests/conftest.py::mock_ai_client)."""
    r = client.post("/ai-chat/message", json={"message": "Hi, who are you?", "session_id": "mocked-1"}, headers=student_headers)
    assert r.status_code == 200
    body = r.json()
    assert body["role"] == "assistant"
    assert body["content"]
    assert body["session_id"] == "mocked-1"

    hist = client.get("/ai-chat/history", params={"session_id": "mocked-1"}, headers=student_headers)
    assert hist.status_code == 200
    roles = [m["role"] for m in hist.json()]
    assert roles == ["user", "assistant"]


def test_send_message_requires_auth(client):
    r = client.post("/ai-chat/message", json={"message": "hello"})
    assert r.status_code == 401


def test_send_message_rejects_empty(client, student_headers):
    r = client.post("/ai-chat/message", json={"message": ""}, headers=student_headers)
    assert r.status_code == 422
