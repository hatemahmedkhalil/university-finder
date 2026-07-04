"""
Unit tests for the scoring engine + integration test for the API endpoint.
"""
import pytest

from app.models.university import University
from app.services.recommendation import RuleBasedRecommender, StudentCriteria

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

_uni_id_counter = 0

def make_uni(**kwargs) -> University:
    global _uni_id_counter
    _uni_id_counter += 1
    defaults = dict(
        name="Test Uni", country="Germany", city="Berlin",
        ranking=None, tuition_fee_eur=0, is_public=True,
        english_programs_available=False,
    )
    defaults.update(kwargs)
    uni = University(**defaults)
    # Set PK so Pydantic's UniversityOut (id: int) can validate without a DB flush
    uni.id = _uni_id_counter
    return uni


def make_criteria(**kwargs) -> StudentCriteria:
    defaults = dict(
        gpa=3.5,
        budget_eur=5000,
        english_level="c1",
        language="english",
        preferred_countries=["germany"],
    )
    defaults.update(kwargs)
    return StudentCriteria(**defaults)


recommender = RuleBasedRecommender()

# ---------------------------------------------------------------------------
# Country scoring
# ---------------------------------------------------------------------------

def test_country_match_gives_full_points():
    criteria = make_criteria(preferred_countries=["germany"])
    uni = make_uni(country="Germany")
    matches = recommender.recommend(criteria, [uni])
    assert matches[0].breakdown.country_match == 30.0


def test_country_mismatch_gives_zero():
    criteria = make_criteria(preferred_countries=["poland"])
    uni = make_uni(country="Germany")
    matches = recommender.recommend(criteria, [uni])
    assert matches[0].breakdown.country_match == 0.0


def test_no_preference_gives_half_points():
    criteria = make_criteria(preferred_countries=[])
    uni = make_uni(country="Germany")
    matches = recommender.recommend(criteria, [uni])
    assert matches[0].breakdown.country_match == 15.0


# ---------------------------------------------------------------------------
# Budget scoring
# ---------------------------------------------------------------------------

def test_free_tuition_gives_full_budget_points():
    criteria = make_criteria(budget_eur=5000)
    uni = make_uni(tuition_fee_eur=0)
    matches = recommender.recommend(criteria, [uni])
    assert matches[0].breakdown.budget_fit == 30.0


def test_tuition_within_budget_scores_high():
    criteria = make_criteria(budget_eur=5000)
    uni = make_uni(tuition_fee_eur=3000)
    matches = recommender.recommend(criteria, [uni])
    assert matches[0].breakdown.budget_fit >= 21.0


def test_tuition_over_budget_partial_score():
    criteria = make_criteria(budget_eur=5000)
    uni = make_uni(tuition_fee_eur=7000)
    matches = recommender.recommend(criteria, [uni])
    score = matches[0].breakdown.budget_fit
    assert 0 < score < 21.0


def test_tuition_over_2x_budget_excluded():
    criteria = make_criteria(budget_eur=5000)
    uni = make_uni(tuition_fee_eur=11000)
    matches = recommender.recommend(criteria, [uni])
    assert len(matches) == 0


# ---------------------------------------------------------------------------
# English scoring
# ---------------------------------------------------------------------------

def test_english_programs_and_qualified_student():
    criteria = make_criteria(english_level="c1")
    uni = make_uni(english_programs_available=True)
    matches = recommender.recommend(criteria, [uni])
    assert matches[0].breakdown.english_fit == 20.0


def test_english_programs_but_low_level():
    criteria = make_criteria(english_level="a2")
    uni = make_uni(english_programs_available=True)
    matches = recommender.recommend(criteria, [uni])
    assert matches[0].breakdown.english_fit < 20.0


def test_no_english_programs_qualified_student():
    criteria = make_criteria(english_level="b2")
    uni = make_uni(english_programs_available=False)
    matches = recommender.recommend(criteria, [uni])
    assert matches[0].breakdown.english_fit < 10.0


# ---------------------------------------------------------------------------
# GPA scoring
# ---------------------------------------------------------------------------

def test_gpa_above_threshold_top_100():
    criteria = make_criteria(gpa=3.8)
    uni = make_uni(ranking=50)
    matches = recommender.recommend(criteria, [uni])
    assert matches[0].breakdown.gpa_fit == 20.0


def test_gpa_below_threshold_top_100():
    criteria = make_criteria(gpa=3.2)
    uni = make_uni(ranking=50)
    matches = recommender.recommend(criteria, [uni])
    assert matches[0].breakdown.gpa_fit < 20.0


def test_unranked_gives_neutral_gpa_score():
    criteria = make_criteria(gpa=2.0)
    uni = make_uni(ranking=None)
    matches = recommender.recommend(criteria, [uni])
    assert matches[0].breakdown.gpa_fit == 10.0


# ---------------------------------------------------------------------------
# Sorting
# ---------------------------------------------------------------------------

def test_better_match_ranks_higher():
    criteria = make_criteria(preferred_countries=["germany"], budget_eur=5000)
    perfect = make_uni(name="Perfect Uni", country="Germany", tuition_fee_eur=0,
                       english_programs_available=True, ranking=200)
    bad = make_uni(name="Bad Uni", country="Netherlands", tuition_fee_eur=18000,
                   english_programs_available=False, ranking=50)
    matches = recommender.recommend(criteria, [bad, perfect])
    assert matches[0].university.name == "Perfect Uni"


# ---------------------------------------------------------------------------
# API integration test
# ---------------------------------------------------------------------------

PROFILE_PAYLOAD = {
    "nationality": "Egyptian",
    "degree_level": "master",
    "gpa": 3.6,
    "budget_eur": 5000,
    "english_level": "c1",
    "preferred_countries": "Germany,Poland",
    "field_of_study": "Computer Science",
}


def test_recommendations_endpoint(client, student_headers, sample_universities):
    # Create profile first
    client.post("/profiles", json=PROFILE_PAYLOAD, headers=student_headers)

    r = client.post("/recommendations?top_n=10", json={}, headers=student_headers)
    assert r.status_code == 200
    data = r.json()
    assert "results" in data
    assert "total" in data
    assert len(data["results"]) >= 1

    # First result should have score + breakdown + reasons
    first = data["results"][0]
    assert "score" in first
    assert "breakdown" in first
    assert "reasons" in first
    assert first["score"] >= 0
    assert first["score"] <= 100

    # Scores should be in descending order
    scores = [m["score"] for m in data["results"]]
    assert scores == sorted(scores, reverse=True)


def test_recommendations_without_profile(client, student_headers):
    r = client.post("/recommendations", json={}, headers=student_headers)
    assert r.status_code == 404


def test_recommendations_with_override(client, student_headers, sample_universities):
    client.post("/profiles", json=PROFILE_PAYLOAD, headers=student_headers)
    # Override preferred country and budget
    r = client.post(
        "/recommendations?top_n=5",
        json={"preferred_countries": "Netherlands", "budget_eur": 30000},
        headers=student_headers,
    )
    assert r.status_code == 200
    results = r.json()["results"]
    # Netherlands uni should appear
    countries = [m["university"]["country"] for m in results]
    assert "Netherlands" in countries
