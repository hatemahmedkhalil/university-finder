import json
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.dependencies import get_db, get_current_user, require_admin
from app.models.subscription_plan import SubscriptionPlan
from app.models.user import User

router = APIRouter(prefix="/subscription-plans", tags=["Subscription Plans"])


class PlanOut(BaseModel):
    id: int
    name: str
    price: Optional[float] = None
    description: Optional[str] = None
    features: list[str] = []
    is_active: bool
    is_featured: bool
    created_at: datetime
    updated_at: datetime
    model_config = {"from_attributes": True}

    @classmethod
    def from_orm_plan(cls, plan: SubscriptionPlan) -> "PlanOut":
        features = []
        if plan.features:
            try:
                features = json.loads(plan.features)
            except Exception:
                features = [plan.features]
        return cls(
            id=plan.id,
            name=plan.name,
            price=plan.price,
            description=plan.description,
            features=features,
            is_active=plan.is_active,
            is_featured=plan.is_featured,
            created_at=plan.created_at,
            updated_at=plan.updated_at,
        )


class PlanCreate(BaseModel):
    name: str
    price: Optional[float] = None
    description: Optional[str] = None
    features: list[str] = []
    is_active: bool = True
    is_featured: bool = False


class PlanUpdate(BaseModel):
    name: Optional[str] = None
    price: Optional[float] = None
    description: Optional[str] = None
    features: Optional[list[str]] = None
    is_active: Optional[bool] = None
    is_featured: Optional[bool] = None


# ── Public ────────────────────────────────────────────────────────────────────

@router.get("", response_model=list[PlanOut])
def list_plans(db: Session = Depends(get_db)):
    plans = (
        db.query(SubscriptionPlan)
        .filter(SubscriptionPlan.is_active == True)
        .order_by(SubscriptionPlan.id.asc())
        .all()
    )
    return [PlanOut.from_orm_plan(p) for p in plans]


@router.get("/{plan_id}", response_model=PlanOut)
def get_plan(plan_id: int, db: Session = Depends(get_db)):
    plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    return PlanOut.from_orm_plan(plan)


# ── Admin CRUD ────────────────────────────────────────────────────────────────

@router.post("", response_model=PlanOut, status_code=201)
def create_plan(
    body: PlanCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    plan = SubscriptionPlan(
        name=body.name,
        price=body.price,
        description=body.description,
        features=json.dumps(body.features),
        is_active=body.is_active,
        is_featured=body.is_featured,
    )
    db.add(plan)
    db.commit()
    db.refresh(plan)
    return PlanOut.from_orm_plan(plan)


@router.patch("/{plan_id}", response_model=PlanOut)
def update_plan(
    plan_id: int,
    body: PlanUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    for field, value in body.model_dump(exclude_unset=True).items():
        if field == "features":
            setattr(plan, field, json.dumps(value))
        else:
            setattr(plan, field, value)
    plan.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(plan)
    return PlanOut.from_orm_plan(plan)


@router.delete("/{plan_id}", status_code=204)
def delete_plan(
    plan_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    db.delete(plan)
    db.commit()
