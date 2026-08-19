from fastapi import APIRouter, HTTPException
from app.database import SessionLocal
import sqlalchemy as sa

router = APIRouter(prefix="/api/cost-of-living", tags=["cost-of-living"])


@router.get("")
def get_all_cities():
    db = SessionLocal()
    try:
        rows = db.execute(sa.text(
            "SELECT city, country, rent_single_eur, rent_shared_eur, food_eur, "
            "transport_eur, utilities_eur, total_min_eur, total_max_eur, notes "
            "FROM city_cost_of_living ORDER BY country, city"
        )).fetchall()
        return [dict(r._mapping) for r in rows]
    finally:
        db.close()


@router.get("/{country}/{city}")
def get_city(country: str, city: str):
    db = SessionLocal()
    try:
        row = db.execute(sa.text(
            "SELECT city, country, rent_single_eur, rent_shared_eur, food_eur, "
            "transport_eur, utilities_eur, total_min_eur, total_max_eur, notes "
            "FROM city_cost_of_living WHERE LOWER(city) = LOWER(:city) AND LOWER(country) = LOWER(:country)"
        ), {"city": city, "country": country}).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="City not found")
        return dict(row._mapping)
    finally:
        db.close()
