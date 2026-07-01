import logging
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request
from groq import Groq
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.config import settings
from app.core.limiter import limiter
from app.dependencies import get_current_user, get_db
from app.models.motivation_letter import MotivationLetter
from app.models.student_profile import StudentProfile
from app.models.university import University
from app.models.user import User

logger = logging.getLogger("university_finder")

router = APIRouter(prefix="/motivation-letters", tags=["Motivation Letters"])


class LetterOut(BaseModel):
    id: int
    university_id: Optional[int] = None
    university_name: Optional[str] = None
    program: Optional[str] = None
    content: str
    created_at: datetime
    updated_at: datetime
    model_config = {"from_attributes": True}


class LetterCreate(BaseModel):
    university_id: Optional[int] = None
    university_name: Optional[str] = Field(None, max_length=300)
    program: Optional[str] = Field(None, max_length=200)
    content: str = Field(..., min_length=10)


class LetterUpdate(BaseModel):
    content: str = Field(..., min_length=10)
    program: Optional[str] = Field(None, max_length=200)


class GenerateRequest(BaseModel):
    university_id: Optional[int] = None
    university_name: Optional[str] = Field(None, max_length=300)
    program: Optional[str] = Field(None, max_length=200)
    extra_notes: Optional[str] = Field(None, max_length=1000)


@router.get("", response_model=list[LetterOut])
def list_letters(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return (
        db.query(MotivationLetter)
        .filter(MotivationLetter.user_id == current_user.id)
        .order_by(MotivationLetter.updated_at.desc())
        .all()
    )


@router.post("", response_model=LetterOut, status_code=201)
def save_letter(body: LetterCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    letter = MotivationLetter(user_id=current_user.id, **body.model_dump())
    db.add(letter)
    db.commit()
    db.refresh(letter)
    return letter


@router.patch("/{letter_id}", response_model=LetterOut)
def update_letter(letter_id: int, body: LetterUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    letter = db.query(MotivationLetter).filter(MotivationLetter.id == letter_id, MotivationLetter.user_id == current_user.id).first()
    if not letter:
        raise HTTPException(status_code=404, detail="Letter not found")
    letter.content = body.content
    if body.program is not None:
        letter.program = body.program
    db.commit()
    db.refresh(letter)
    return letter


@router.delete("/{letter_id}", status_code=204)
def delete_letter(letter_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    letter = db.query(MotivationLetter).filter(MotivationLetter.id == letter_id, MotivationLetter.user_id == current_user.id).first()
    if not letter:
        raise HTTPException(status_code=404, detail="Letter not found")
    db.delete(letter)
    db.commit()


@router.post("/generate")
@limiter.limit("5/minute")
def generate_letter(
    request: Request,
    body: GenerateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not settings.GROQ_API_KEY:
        raise HTTPException(status_code=503, detail="AI service not configured")

    profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    uni_info = ""
    if body.university_id:
        uni = db.query(University).filter(University.id == body.university_id).first()
        if uni:
            uni_info = f"{uni.name}, located in {uni.city}, {uni.country}."
            if uni.programs:
                uni_info += f" Available programs include: {uni.programs[:300]}."
            if uni.admission_requirements:
                uni_info += f" Admission requirements: {uni.admission_requirements[:300]}."
    elif body.university_name:
        uni_info = body.university_name

    profile_info = "No profile provided."
    if profile:
        parts = []
        if profile.nationality:
            parts.append(f"Nationality: {profile.nationality}")
        if profile.gpa:
            parts.append(f"GPA: {profile.gpa}/4.0")
        if profile.field_of_study:
            parts.append(f"Field of study: {profile.field_of_study}")
        if profile.degree_level:
            parts.append(f"Degree level: {profile.degree_level}")
        if profile.english_level:
            level = profile.english_level.value if hasattr(profile.english_level, 'value') else str(profile.english_level)
            parts.append(f"English level: {level.upper()}")
        if profile.placement_results:
            for lang, res in profile.placement_results.items():
                parts.append(f"{lang.capitalize()} placement: {res.get('level', '')}")
        profile_info = "; ".join(parts) if parts else "No profile details available."

    target_program = body.program or "the available program"
    extra = f"\nAdditional context from student: {body.extra_notes}" if body.extra_notes else ""

    prompt = f"""You are an expert academic writing assistant. Write a professional, compelling motivation letter for a university application.

Student profile: {profile_info}
Target university: {uni_info or "Not specified"}
Target program: {target_program}{extra}

Write a motivation letter of approximately 400-500 words. Structure it with:
1. Opening paragraph — strong hook and clear statement of intent
2. Academic background — GPA, relevant coursework, achievements
3. Why this university specifically — show genuine research
4. Career goals and how this program fits
5. Closing — confident call to action

Write in formal English. Do NOT use generic phrases like "I have always been passionate about". Be specific and genuine. Return only the letter text, no headers or meta-commentary."""

    try:
        client = Groq(api_key=settings.GROQ_API_KEY)
        resp = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=800,
            temperature=0.7,
        )
        content = resp.choices[0].message.content.strip()
        return {"content": content}
    except Exception as e:
        logger.error("Groq motivation letter error: %s", e)
        raise HTTPException(status_code=502, detail="AI generation failed")
