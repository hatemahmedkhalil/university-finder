import json
import logging
from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from app.services.ai_client import chat_completion, ai_configured
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional

from app.config import settings
from app.core.limiter import limiter
from app.dependencies import get_current_user, get_db, require_admin
from app.models.scholarship import Scholarship, ScholarshipType
from app.models.student_profile import StudentProfile
from app.models.user import User
from app.schemas.common import PaginatedResponse
from app.schemas.scholarship import ScholarshipCreate, ScholarshipOut, ScholarshipUpdate

logger = logging.getLogger("university_finder")

router = APIRouter(prefix="/scholarships", tags=["Scholarships"])


@router.get("", response_model=PaginatedResponse[ScholarshipOut])
def list_scholarships(
    university_id: int | None = Query(default=None),
    scholarship_type: ScholarshipType | None = Query(default=None),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    q = db.query(Scholarship)
    if university_id is not None:
        q = q.filter(Scholarship.university_id == university_id)
    if scholarship_type is not None:
        q = q.filter(Scholarship.scholarship_type == scholarship_type)
    total = q.count()
    items = q.offset(skip).limit(limit).all()
    return PaginatedResponse(items=items, total=total, skip=skip, limit=limit)


@router.get("/{scholarship_id}", response_model=ScholarshipOut)
def get_scholarship(
    scholarship_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    scholarship = db.get(Scholarship, scholarship_id)
    if not scholarship:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Scholarship not found")
    return scholarship


@router.post("", response_model=ScholarshipOut, status_code=status.HTTP_201_CREATED)
def create_scholarship(
    payload: ScholarshipCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    scholarship = Scholarship(**payload.model_dump())
    db.add(scholarship)
    db.commit()
    db.refresh(scholarship)
    return scholarship


@router.patch("/{scholarship_id}", response_model=ScholarshipOut)
def update_scholarship(
    scholarship_id: int,
    payload: ScholarshipUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    scholarship = db.get(Scholarship, scholarship_id)
    if not scholarship:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Scholarship not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(scholarship, field, value)
    db.commit()
    db.refresh(scholarship)
    return scholarship


class ScholarshipMatch(BaseModel):
    scholarship_id: int
    name: str
    provider: str
    amount_eur: Optional[int]
    scholarship_type: str
    deadline: Optional[str]
    link: Optional[str]
    match_score: int        # 1-100
    match_reason: str       # why this student qualifies
    eligibility_met: bool   # AI verdict: does student clearly qualify?


class ScholarshipMatchResponse(BaseModel):
    matches: list[ScholarshipMatch]
    summary: str


@router.post("/match", response_model=ScholarshipMatchResponse)
@limiter.limit("5/minute")
def match_scholarships(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not ai_configured():
        raise HTTPException(status_code=503, detail="AI service not configured.")

    profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Please complete your profile first.")

    scholarships = db.query(Scholarship).all()
    if not scholarships:
        raise HTTPException(status_code=404, detail="No scholarships available.")

    sch_lines = []
    for s in scholarships:
        sch_lines.append(
            f"ID:{s.id} | {s.name} | Provider:{s.provider} | Type:{s.scholarship_type} "
            f"| Amount:€{s.amount_eur or 'varies'} | Deadline:{s.deadline or 'rolling'} "
            f"| Eligibility:{s.eligibility or 'see website'}"
        )

    student_ctx = f"""STUDENT PROFILE:
- Nationality: {profile.nationality}
- Degree level seeking: {profile.degree_level}
- GPA: {profile.gpa}/4.0
- Budget: €{profile.budget_eur}/year
- Preferred countries: {profile.preferred_countries or 'Any'}
- Field of study: {profile.field_of_study or 'Not specified'}
- English level: {profile.english_level or 'Not specified'}"""

    prompt = f"""You are a scholarship advisor. A student needs help finding scholarships they qualify for.

{student_ctx}

AVAILABLE SCHOLARSHIPS:
{chr(10).join(sch_lines)}

TASK: Analyze each scholarship and identify which ones this student is realistically eligible for.
Consider their nationality, GPA, degree level, and target countries.

Return ONLY valid JSON (no markdown):
{{
  "matches": [
    {{
      "scholarship_id": <number>,
      "match_score": <number 1-100, how well this student fits>,
      "match_reason": "<1-2 sentences: why this student qualifies or partially qualifies>",
      "eligibility_met": <true if student clearly qualifies, false if uncertain or unlikely>
    }}
  ],
  "summary": "<1 paragraph of overall scholarship strategy advice for this student>"
}}

Include ALL scholarships but rank them by match_score. Put the best matches first."""

    try:
        raw = chat_completion(
            messages=[{"role": "user", "content": prompt}],
            max_tokens=2000,
            temperature=0.3,
        )
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        data = json.loads(raw.strip())
    except json.JSONDecodeError:
        raise HTTPException(status_code=502, detail="AI returned invalid response. Please try again.")
    except Exception as e:
        logger.error("Scholarship match error for user %s: %s", current_user.id, e)
        raise HTTPException(status_code=502, detail="AI service temporarily unavailable.")

    sch_map = {s.id: s for s in scholarships}
    result = []
    for item in data.get("matches", []):
        sid = item.get("scholarship_id")
        s = sch_map.get(sid)
        if not s:
            continue
        result.append(ScholarshipMatch(
            scholarship_id=s.id,
            name=s.name,
            provider=s.provider,
            amount_eur=s.amount_eur,
            scholarship_type=s.scholarship_type,
            deadline=s.deadline,
            link=s.link,
            match_score=item.get("match_score", 50),
            match_reason=item.get("match_reason", ""),
            eligibility_met=item.get("eligibility_met", False),
        ))

    return ScholarshipMatchResponse(matches=result, summary=data.get("summary", ""))


@router.delete("/{scholarship_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_scholarship(
    scholarship_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    scholarship = db.get(Scholarship, scholarship_id)
    if not scholarship:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Scholarship not found")
    db.delete(scholarship)
    db.commit()
