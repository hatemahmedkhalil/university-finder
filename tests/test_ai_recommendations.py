"""Tests for /ai-recommendations. The success paths make real Groq calls
(GROQ_API_KEY loaded from the real .env) and are marked @requires_groq so
CI can skip them without a configured secret."""
from tests.conftest import requires_groq


def _make_profile(client, headers, **overrides):
    payload = {
        "nationality": "Egyptian", "degree_level": "bachelor", "gpa": 3.5,
        "budget_eur": 8000, "english_level": "b2", "language": "german",
        "preferred_countries": "Germany,Poland", "field_of_study": "Computer Science",
    }
    payload.update(overrides)
    return client.post("/profiles", json=payload, headers=headers)


def test_get_recommendations_requires_profile(client, student_headers, sample_universities):
    r = client.post("/ai-recommendations", headers=student_headers)
    assert r.status_code == 404


def test_get_recommendations_requires_auth(client):
    r = client.post("/ai-recommendations")
    assert r.status_code == 401


def test_get_recommendations_no_universities(client, student_headers):
    _make_profile(client, student_headers)
    r = client.post("/ai-recommendations", headers=student_headers)
    assert r.status_code == 404
    assert "No universities" in r.json()["detail"]


@requires_groq
def test_get_recommendations(client, student_headers, sample_universities):
    _make_profile(client, student_headers)
    r = client.post("/ai-recommendations", headers=student_headers)
    assert r.status_code == 200
    body = r.json()
    assert len(body["recommendations"]) > 0
    assert body["summary"]


def _mock_recommendations_json(sample_universities):
    import json as _json
    return _json.dumps({
        "recommendations": [
            {"university_id": sample_universities[0].id, "fit_score": 88,
             "match_reason": "Strong GPA and budget match.", "tips": "Prepare your language certificate early."},
        ],
        "summary": "This university is a strong match based on your profile.",
        "language_advice": "Your B2 level should be sufficient; consider a certificate to strengthen your file.",
    })


def test_get_recommendations_mocked(client, student_headers, sample_universities, mock_ai_client):
    """Deterministic counterpart of test_get_recommendations — mocks
    app.services.ai_client so this always runs in CI regardless of Groq
    availability."""
    mock_ai_client.set(_mock_recommendations_json(sample_universities))
    _make_profile(client, student_headers)
    r = client.post("/ai-recommendations", headers=student_headers)
    assert r.status_code == 200
    body = r.json()
    assert len(body["recommendations"]) > 0
    assert body["summary"]


@requires_groq
def test_get_recommendations_with_placement_result(client, db, student_headers, sample_universities):
    _make_profile(client, student_headers)
    r = client.post(
        "/ai-recommendations",
        json={"language": "english", "level": "b2", "score": 40, "total": 50},
        headers=student_headers,
    )
    assert r.status_code == 200

    # placement result should be persisted onto the profile
    from app.models.student_profile import StudentProfile
    from app.core.security import decode_token

    uid = int(decode_token(student_headers["Authorization"].split(" ")[1], "access")[0])
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == uid).first()
    assert profile.placement_results.get("english", {}).get("level") == "B2"


def test_get_recommendations_with_placement_result_mocked(client, db, student_headers, sample_universities, mock_ai_client):
    """Deterministic counterpart — mocks app.services.ai_client."""
    mock_ai_client.set(_mock_recommendations_json(sample_universities))
    _make_profile(client, student_headers)
    r = client.post(
        "/ai-recommendations",
        json={"language": "english", "level": "b2", "score": 40, "total": 50},
        headers=student_headers,
    )
    assert r.status_code == 200

    from app.models.student_profile import StudentProfile
    from app.core.security import decode_token

    uid = int(decode_token(student_headers["Authorization"].split(" ")[1], "access")[0])
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == uid).first()
    assert profile.placement_results.get("english", {}).get("level") == "B2"


def test_free_plan_limit(client, db, student_headers, sample_universities):
    """Free plan is capped at 3 AI recommendation calls total."""
    from app.models.user import User
    from app.core.security import decode_token

    _make_profile(client, student_headers)
    uid = int(decode_token(student_headers["Authorization"].split(" ")[1], "access")[0])
    user = db.query(User).filter(User.id == uid).first()
    user.ai_rec_count = 3
    db.commit()

    r = client.post("/ai-recommendations", headers=student_headers)
    assert r.status_code == 403
    assert "Free plan limit" in r.json()["detail"]


# ── Compare ──────────────────────────────────────────────────────────────────

def test_compare_requires_at_least_two(client, student_headers, sample_universities):
    _make_profile(client, student_headers)
    r = client.post("/ai-recommendations/compare", json={"university_ids": [sample_universities[0].id]}, headers=student_headers)
    assert r.status_code == 400


def test_compare_max_four(client, student_headers, sample_universities):
    _make_profile(client, student_headers)
    ids = [sample_universities[0].id] * 5
    r = client.post("/ai-recommendations/compare", json={"university_ids": ids}, headers=student_headers)
    assert r.status_code == 400


def test_compare_requires_profile(client, student_headers, sample_universities):
    ids = [sample_universities[0].id, sample_universities[1].id]
    r = client.post("/ai-recommendations/compare", json={"university_ids": ids}, headers=student_headers)
    assert r.status_code == 404


def test_compare_unknown_universities(client, student_headers):
    _make_profile(client, student_headers)
    r = client.post("/ai-recommendations/compare", json={"university_ids": [999998, 999999]}, headers=student_headers)
    assert r.status_code == 404


def test_compare_requires_auth(client, sample_universities):
    ids = [sample_universities[0].id, sample_universities[1].id]
    r = client.post("/ai-recommendations/compare", json={"university_ids": ids})
    assert r.status_code == 401


@requires_groq
def test_compare_universities(client, student_headers, sample_universities):
    _make_profile(client, student_headers)
    ids = [sample_universities[0].id, sample_universities[1].id]
    r = client.post("/ai-recommendations/compare", json={"university_ids": ids}, headers=student_headers)
    assert r.status_code == 200
    body = r.json()
    assert len(body["universities"]) > 0
    assert body["winner"]


def test_compare_universities_mocked(client, student_headers, sample_universities, mock_ai_client):
    """Deterministic counterpart of test_compare_universities — mocks
    app.services.ai_client so this always runs in CI regardless of Groq
    availability."""
    import json as _json

    uni0, uni1 = sample_universities[0], sample_universities[1]
    mock_ai_client.set(_json.dumps({
        "universities": [
            {"university_id": uni0.id, "fit_score": 85, "pros": ["Low tuition"], "cons": ["Competitive"], "verdict": "A strong choice."},
            {"university_id": uni1.id, "fit_score": 70, "pros": ["Good ranking"], "cons": ["Higher tuition"], "verdict": "A solid backup."},
        ],
        "winner": uni0.name,
        "winner_reason": "Better fit for this student's budget and profile.",
        "overall_advice": "Focus your application effort on the top match.",
    }))
    _make_profile(client, student_headers)
    ids = [uni0.id, uni1.id]
    r = client.post("/ai-recommendations/compare", json={"university_ids": ids}, headers=student_headers)
    assert r.status_code == 200
    body = r.json()
    assert len(body["universities"]) > 0
    assert body["winner"]
