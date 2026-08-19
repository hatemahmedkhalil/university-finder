"""Tests for /api/cost-of-living — public, read-only city cost data."""
import sqlalchemy as sa


def _seed(db):
    db.execute(sa.text("""
        INSERT INTO city_cost_of_living
            (city, country, rent_single_eur, rent_shared_eur, food_eur, transport_eur, utilities_eur, total_min_eur, total_max_eur, notes)
        VALUES ('Munich', 'Germany', 700, 450, 300, 60, 150, 900, 1300, 'Expensive but high quality of life')
    """))
    db.commit()


def test_get_all_cities_empty(client):
    r = client.get("/api/cost-of-living")
    assert r.status_code == 200
    assert r.json() == []


def test_get_all_cities(client, db):
    _seed(db)
    r = client.get("/api/cost-of-living")
    assert r.status_code == 200
    body = r.json()
    assert len(body) == 1
    assert body[0]["city"] == "Munich"


def test_get_city_found(client, db):
    _seed(db)
    r = client.get("/api/cost-of-living/Germany/Munich")
    assert r.status_code == 200
    assert r.json()["country"] == "Germany"


def test_get_city_case_insensitive(client, db):
    _seed(db)
    r = client.get("/api/cost-of-living/germany/MUNICH")
    assert r.status_code == 200


def test_get_city_not_found(client):
    r = client.get("/api/cost-of-living/Germany/Atlantis")
    assert r.status_code == 404


def test_no_auth_required(client, db):
    """Public endpoint — no Authorization header needed."""
    _seed(db)
    r = client.get("/api/cost-of-living")
    assert r.status_code == 200
