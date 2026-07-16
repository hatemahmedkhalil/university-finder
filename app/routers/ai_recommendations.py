import logging
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from groq import Groq
import json

logger = logging.getLogger("university_finder")

from app.config import settings
from app.core.limiter import limiter
from app.dependencies import get_db, get_current_user
from app.models.student_profile import StudentProfile
from app.models.university import University
from app.models.user import User
from app.models.user_language import UserLanguage

router = APIRouter(prefix="/ai-recommendations", tags=["AI Recommendations"])


class PlacementResultIn(BaseModel):
    language: str   # english | german | polish
    level: str      # A1 | A2 | B1 | B2 | C1 | C2
    score: int
    total: int


class AiRecommendationItem(BaseModel):
    university_id: int
    name: str
    country: str
    city: Optional[str] = None
    ranking: Optional[int] = None
    tuition_fee_eur: Optional[float] = None
    english_programs_available: bool = False
    website: Optional[str] = None
    match_reason: str       # AI explanation why this uni matches
    fit_score: int          # 1-100 from AI
    tips: str               # AI tips for this student applying here


class AiRecommendationsResponse(BaseModel):
    recommendations: list[AiRecommendationItem]
    summary: str            # AI overall advice paragraph
    language_advice: Optional[str] = None   # advice based on placement test


def _save_placement_result(db: Session, user_id: int, result: PlacementResultIn):
    """Persist placement test result into the student profile."""
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == user_id).first()
    if not profile:
        return
    current = profile.placement_results or {}
    current[result.language.lower()] = {
        "level": result.level.upper(),
        "score": result.score,
        "total": result.total,
    }
    profile.placement_results = current
    # Also update english_level in profile if it's an English test
    if result.language.lower() == "english":
        level_map = {"A1": "a1", "A2": "a2", "B1": "b1", "B2": "b2", "C1": "c1", "C2": "c2"}
        mapped = level_map.get(result.level.upper())
        if mapped:
            profile.english_level = mapped
    db.commit()


@router.post("", response_model=AiRecommendationsResponse)
@limiter.limit("10/minute")
def get_ai_recommendations(
    request: Request,
    placement_result: Optional[PlacementResultIn] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not settings.GROQ_API_KEY:
        raise HTTPException(status_code=503, detail="AI service not configured.")

    if current_user.plan == "free" and current_user.ai_rec_count >= 3:
        raise HTTPException(
            status_code=403,
            detail="Free plan limit reached: 3 AI recommendations total. Upgrade to Pro for unlimited recommendations.",
        )

    profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Please create your profile first.")

    # Save placement result if provided
    if placement_result:
        _save_placement_result(db, current_user.id, placement_result)
        db.refresh(profile)

    universities = db.query(University).all()
    if not universities:
        raise HTTPException(status_code=404, detail="No universities in the system yet.")

    # Build student context
    placement_ctx = ""
    all_results = profile.placement_results or {}
    if placement_result:
        all_results[placement_result.language.lower()] = {
            "level": placement_result.level.upper(),
            "score": placement_result.score,
            "total": placement_result.total,
        }
    if all_results:
        lines = []
        for lang, r in all_results.items():
            lines.append(f"  - {lang.capitalize()}: {r['level']} ({r['score']}/{r['total']})")
        placement_ctx = "Placement test results:\n" + "\n".join(lines)

    user_langs = db.query(UserLanguage).filter(UserLanguage.user_id == current_user.id).all()
    lang_ctx = ""
    if user_langs:
        lang_lines = [f"  - {ul.language.capitalize()}: {ul.level}" for ul in user_langs]
        lang_ctx = "Known languages:\n" + "\n".join(lang_lines)
    else:
        lang_ctx = f"Studying language: {profile.language}\nEnglish level (self-reported): {profile.english_level}"

    student_ctx = f"""STUDENT PROFILE:
- Nationality: {profile.nationality}
- Degree level: {profile.degree_level}
- GPA: {profile.gpa}/4.0
- Budget: €{profile.budget_eur}/year (tuition only)
- Preferred countries: {profile.preferred_countries or 'Any'}
- Field of study: {profile.field_of_study or 'Not specified'}
{lang_ctx}
{placement_ctx}"""

    # Build universities list
    uni_lines = []
    for u in universities:
        line = f"ID:{u.id} | {u.name} | {u.country} | City:{u.city or 'N/A'} | Tuition:€{u.tuition_fee_eur or 0}/yr | Ranking:#{u.ranking or 'N/A'} | EnglishPrograms:{'Yes' if u.english_programs_available else 'No'} | MinGPA:{u.min_gpa or 'N/A'} | Deadline:{u.application_deadline or 'N/A'} | Language:{u.language_requirements or 'N/A'}"
        uni_lines.append(line)
    unis_ctx = "\n".join(uni_lines)

    prompt = f"""You are a university admissions expert. A student needs your help finding the best universities for them.

{student_ctx}

AVAILABLE UNIVERSITIES:
{unis_ctx}

TASK: Pick the TOP 3 best-matching universities for this student. Consider:
1. Their GPA vs university minimum GPA requirements
2. Their budget vs tuition fees
3. Their English level (use placement test result if available, otherwise self-reported)
4. Their preferred countries
5. Their field of study
6. If their language level is low (A1/A2), prefer universities with strong language support or free tuition to offset extra language course costs

Return ONLY valid JSON in this exact format (no markdown, no explanation outside JSON):
{{
  "recommendations": [
    {{
      "university_id": <number>,
      "fit_score": <number 1-100>,
      "match_reason": "<2-3 sentences explaining why this university matches this specific student>",
      "tips": "<1-2 specific action tips for this student to improve their chances at this university>"
    }}
  ],
  "summary": "<1 paragraph of overall advice for this student based on their profile>",
  "language_advice": "<specific advice about their language level and what to do to improve chances — especially if placement test was taken>"
}}"""

    try:
        client = Groq(api_key=settings.GROQ_API_KEY)
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=1200,
            temperature=0.4,
        )
        raw = response.choices[0].message.content.strip()

        # Strip markdown code fences if present
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        raw = raw.strip()

        data = json.loads(raw)
    except json.JSONDecodeError:
        raise HTTPException(status_code=502, detail="AI returned invalid response. Please try again.")
    except Exception as e:
        logger.error("AI recommendation error for user %s: %s", current_user.id, e)
        raise HTTPException(status_code=502, detail="AI service is temporarily unavailable.")

    # Map AI picks back to university DB records
    uni_map = {u.id: u for u in universities}
    result_items = []
    for item in data.get("recommendations", []):
        uid = item.get("university_id")
        u = uni_map.get(uid)
        if not u:
            continue
        result_items.append(AiRecommendationItem(
            university_id=u.id,
            name=u.name,
            country=u.country,
            city=u.city,
            ranking=u.ranking,
            tuition_fee_eur=u.tuition_fee_eur,
            english_programs_available=bool(u.english_programs_available),
            website=u.website,
            match_reason=item.get("match_reason", ""),
            fit_score=item.get("fit_score", 80),
            tips=item.get("tips", ""),
        ))

    if current_user.plan == "free":
        current_user.ai_rec_count += 1
        db.commit()

    return AiRecommendationsResponse(
        recommendations=result_items,
        summary=data.get("summary", ""),
        language_advice=data.get("language_advice"),
    )


# ── Compare universities ─────────────────────────────────────────────────────

class CompareRequest(BaseModel):
    university_ids: list[int]           # 2-4 IDs
    language_level: Optional[str] = None  # e.g. "B2"


class UniCompareDetail(BaseModel):
    university_id: int
    name: str
    country: str
    city: Optional[str] = None
    ranking: Optional[int] = None
    tuition_fee_eur: Optional[float] = None
    english_programs_available: bool = False
    website: Optional[str] = None
    pros: list[str]
    cons: list[str]
    fit_score: int
    verdict: str


class CompareResponse(BaseModel):
    universities: list[UniCompareDetail]
    winner: str          # name of best match
    winner_reason: str
    overall_advice: str


@router.post("/compare", response_model=CompareResponse)
@limiter.limit("10/minute")
def compare_universities(
    request: Request,
    body: CompareRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not settings.GROQ_API_KEY:
        raise HTTPException(status_code=503, detail="AI service not configured.")
    if len(body.university_ids) < 2:
        raise HTTPException(status_code=400, detail="Select at least 2 universities to compare.")
    if len(body.university_ids) > 4:
        raise HTTPException(status_code=400, detail="Maximum 4 universities at a time.")

    profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Please create your profile first.")

    universities = db.query(University).filter(University.id.in_(body.university_ids)).all()
    if len(universities) < 2:
        raise HTTPException(status_code=404, detail="Could not find the selected universities.")

    # Student context
    lang_level = body.language_level or profile.english_level or "unknown"
    placement = profile.placement_results or {}
    user_langs = db.query(UserLanguage).filter(UserLanguage.user_id == current_user.id).all()
    if user_langs:
        lang_summary = ", ".join(f"{ul.language.capitalize()} ({ul.level})" for ul in user_langs)
    else:
        lang_summary = f"{profile.language.capitalize()} ({lang_level})"
    student_ctx = f"""STUDENT PROFILE:
- Nationality: {profile.nationality}
- Degree level: {profile.degree_level}
- GPA: {profile.gpa}/4.0
- Budget: €{profile.budget_eur}/year
- Preferred countries: {profile.preferred_countries or 'Any'}
- Field of study: {profile.field_of_study or 'Not specified'}
- Languages: {lang_summary}
- Placement results: {placement if placement else 'None taken yet'}"""

    uni_lines = []
    for u in universities:
        uni_lines.append(
            f"ID:{u.id} | {u.name} | {u.country} | City:{u.city or 'N/A'} | "
            f"Tuition:€{u.tuition_fee_eur or 0}/yr | Ranking:#{u.ranking or 'N/A'} | "
            f"EnglishPrograms:{'Yes' if u.english_programs_available else 'No'} | "
            f"MinGPA:{u.min_gpa or 'N/A'} | Deadline:{u.application_deadline or 'N/A'} | "
            f"Description:{(u.description or '')[:150]}"
        )

    prompt = f"""You are a university admissions expert. Compare these universities FOR THIS SPECIFIC STUDENT.

{student_ctx}

UNIVERSITIES TO COMPARE:
{chr(10).join(uni_lines)}

Give an honest comparison based on this student's GPA ({profile.gpa}), budget (€{profile.budget_eur}/yr), and language level ({lang_level}).

Return ONLY valid JSON (no markdown):
{{
  "universities": [
    {{
      "university_id": <number>,
      "fit_score": <number 1-100 for THIS student>,
      "pros": ["<pro 1 specific to this student>", "<pro 2>", "<pro 3>"],
      "cons": ["<con 1 specific to this student>", "<con 2>"],
      "verdict": "<1 sentence verdict for this student specifically>"
    }}
  ],
  "winner": "<name of best university for this student>",
  "winner_reason": "<2-3 sentences explaining why this one wins for this specific student>",
  "overall_advice": "<1 paragraph of advice for this student about making this decision>"
}}"""

    try:
        client = Groq(api_key=settings.GROQ_API_KEY)
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=1500,
            temperature=0.4,
        )
        raw = response.choices[0].message.content.strip()
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        data = json.loads(raw.strip())
    except json.JSONDecodeError:
        raise HTTPException(status_code=502, detail="AI returned invalid response. Please try again.")
    except Exception as e:
        logger.error("AI recommendation error for user %s: %s", current_user.id, e)
        raise HTTPException(status_code=502, detail="AI service is temporarily unavailable.")

    uni_map = {u.id: u for u in universities}
    result_items = []
    for item in data.get("universities", []):
        uid = item.get("university_id")
        u = uni_map.get(uid)
        if not u:
            continue
        result_items.append(UniCompareDetail(
            university_id=u.id,
            name=u.name,
            country=u.country,
            city=u.city,
            ranking=u.ranking,
            tuition_fee_eur=u.tuition_fee_eur,
            english_programs_available=bool(u.english_programs_available),
            website=u.website,
            pros=item.get("pros", []),
            cons=item.get("cons", []),
            fit_score=item.get("fit_score", 75),
            verdict=item.get("verdict", ""),
        ))

    return CompareResponse(
        universities=result_items,
        winner=data.get("winner", ""),
        winner_reason=data.get("winner_reason", ""),
        overall_advice=data.get("overall_advice", ""),
    )
