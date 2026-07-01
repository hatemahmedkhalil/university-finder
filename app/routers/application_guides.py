import json
import logging
import re
from datetime import datetime
from typing import Optional

import httpx
from fastapi import APIRouter, Depends, HTTPException, Request
from groq import Groq
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.config import settings
from app.core.limiter import limiter
from app.dependencies import get_current_user, get_db, require_admin
from app.models.university import University
from app.models.user import User

logger = logging.getLogger("university_finder")

router = APIRouter(prefix="/application-guides", tags=["Application Guides"])

FETCH_TIMEOUT = 15  # seconds
FETCH_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "en-US,en;q=0.9",
}


class GuideStep(BaseModel):
    step: int
    title: str
    description: str
    action_type: str = "info"   # info | portal | document | payment | email | account
    url: Optional[str] = None


class GuideOut(BaseModel):
    university_id: int
    university_name: str
    guide: Optional[list[GuideStep]] = None
    guide_generated_at: Optional[datetime] = None
    has_guide: bool


class GuideUpdate(BaseModel):
    guide: list[GuideStep] = Field(..., min_length=1, max_length=20)


def _strip_html(html: str) -> str:
    """Very basic HTML → plain text for AI context."""
    text = re.sub(r"<style[^>]*>.*?</style>", " ", html, flags=re.DOTALL | re.IGNORECASE)
    text = re.sub(r"<script[^>]*>.*?</script>", " ", text, flags=re.DOTALL | re.IGNORECASE)
    text = re.sub(r"<[^>]+>", " ", text)
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def _fetch_website_text(url: str) -> str:
    """Fetch university website and return plain text (max 6000 chars)."""
    try:
        with httpx.Client(timeout=FETCH_TIMEOUT, follow_redirects=True, headers=FETCH_HEADERS) as client:
            resp = client.get(url)
            resp.raise_for_status()
            text = _strip_html(resp.text)
            return text[:6000]
    except Exception as e:
        logger.warning("Failed to fetch university website %s: %s", url, e)
        return ""


def _find_application_page(base_url: str) -> str:
    """Try common application page paths to get richer content."""
    suffixes = [
        "/admissions", "/apply", "/application", "/how-to-apply",
        "/international/apply", "/international/admissions",
        "/en/admissions", "/en/apply",
    ]
    for suffix in suffixes:
        candidate = base_url.rstrip("/") + suffix
        try:
            with httpx.Client(timeout=8, follow_redirects=True, headers=FETCH_HEADERS) as client:
                resp = client.get(candidate)
                if resp.status_code == 200:
                    return _strip_html(resp.text)[:5000]
        except Exception:
            continue
    return ""


def _generate_guide_with_ai(uni: University, website_text: str, app_page_text: str) -> list[dict]:
    """Call Groq to generate structured application guide."""
    if not settings.GROQ_API_KEY:
        raise HTTPException(status_code=503, detail="AI service not configured")

    site_context = ""
    if website_text:
        site_context = f"\n\nMain website content:\n{website_text}"
    if app_page_text:
        site_context += f"\n\nApplication page content:\n{app_page_text}"
    if not site_context:
        site_context = "\n\nNo website content could be fetched. Use knowledge about this university type."

    method_hint = ""
    if uni.application_method == "uni_assist":
        method_hint = "This university uses uni-assist (https://www.uni-assist.de) for international applications."
    elif uni.application_method == "irk":
        method_hint = "This university uses the IRK portal for applications."
    elif uni.application_method == "own_portal":
        method_hint = f"This university has its own application portal. Portal URL: {uni.application_portal_url or 'check website'}."

    prompt = f"""You are an expert university admissions consultant. Analyze the application process for this university and generate a clear step-by-step guide for international (Arabic-speaking) students.

University: {uni.name}
Location: {uni.city}, {uni.country}
Website: {uni.website or 'N/A'}
Application method: {uni.application_method or 'unknown'}
{method_hint}
Admission requirements: {(uni.admission_requirements or '')[:400]}
Required documents: {(uni.required_documents or '')[:300]}
Application deadline: {uni.application_deadline or 'check website'}
{site_context}

Generate a realistic step-by-step application guide. Each step must be specific and actionable — not generic advice.

IMPORTANT rules:
- If using uni-assist: include account creation, APS certificate for Egyptian/Jordanian students, document upload, payment ~75€
- If using IRK: include IRK portal account, program selection, document upload
- If own portal: include account creation, online form, document upload
- Always include: document preparation, language certificate, motivation letter, submission confirmation
- Steps should be in logical order (preparation → account → upload → submit → wait)
- Maximum 8 steps, minimum 5 steps

Respond ONLY with a JSON array — no markdown, no explanation:
[
  {{
    "step": 1,
    "title": "Step title (short, max 6 words)",
    "description": "Detailed description of exactly what the student needs to do. Be specific about what documents, which website, what to fill in.",
    "action_type": "document|account|portal|payment|email|info",
    "url": "https://... (optional, include if a specific URL is needed)"
  }}
]"""

    try:
        client = Groq(api_key=settings.GROQ_API_KEY)
        resp = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=1200,
            temperature=0.4,
        )
        raw = resp.choices[0].message.content.strip()
        raw = re.sub(r"^```(?:json)?\s*", "", raw)
        raw = re.sub(r"\s*```$", "", raw)
        parsed = json.loads(raw)
        if not isinstance(parsed, list):
            raise ValueError("Expected a JSON array")
        # Validate and clamp
        steps = []
        for i, item in enumerate(parsed[:10]):
            steps.append({
                "step": item.get("step", i + 1),
                "title": str(item.get("title", ""))[:100],
                "description": str(item.get("description", ""))[:600],
                "action_type": item.get("action_type", "info"),
                "url": item.get("url") or None,
            })
        return steps
    except Exception as e:
        logger.error("Guide AI generation error for uni %s: %s", uni.id, e)
        raise HTTPException(status_code=502, detail="AI guide generation failed")


# ── Student endpoint ──────────────────────────────────────────────────────────

@router.get("/{university_id}", response_model=GuideOut)
def get_guide(
    university_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    uni = db.query(University).filter(University.id == university_id).first()
    if not uni:
        raise HTTPException(status_code=404, detail="University not found")

    guide_data = None
    if uni.application_guide:
        try:
            guide_data = json.loads(uni.application_guide)
        except Exception:
            guide_data = None

    return {
        "university_id": uni.id,
        "university_name": uni.name,
        "guide": guide_data,
        "guide_generated_at": uni.guide_generated_at,
        "has_guide": guide_data is not None,
    }


# ── Admin endpoints ───────────────────────────────────────────────────────────

@router.post("/admin/{university_id}/generate", dependencies=[Depends(require_admin)])
@limiter.limit("10/minute")
def generate_guide(
    request: Request,
    university_id: int,
    db: Session = Depends(get_db),
):
    uni = db.query(University).filter(University.id == university_id).first()
    if not uni:
        raise HTTPException(status_code=404, detail="University not found")

    if not uni.website:
        raise HTTPException(status_code=422, detail="University has no website URL configured")

    logger.info("Generating application guide for university %s (%s)", uni.id, uni.name)

    # Fetch website content (main page + application page)
    main_text = _fetch_website_text(uni.website)
    app_text = _find_application_page(uni.website)

    steps = _generate_guide_with_ai(uni, main_text, app_text)

    uni.application_guide = json.dumps(steps)
    uni.guide_generated_at = datetime.utcnow()
    db.commit()
    db.refresh(uni)

    logger.info("Guide generated for university %s — %d steps", uni.id, len(steps))
    return {
        "university_id": uni.id,
        "university_name": uni.name,
        "guide": steps,
        "guide_generated_at": uni.guide_generated_at,
        "has_guide": True,
    }


@router.patch("/admin/{university_id}", dependencies=[Depends(require_admin)])
def update_guide(
    university_id: int,
    body: GuideUpdate,
    db: Session = Depends(get_db),
):
    uni = db.query(University).filter(University.id == university_id).first()
    if not uni:
        raise HTTPException(status_code=404, detail="University not found")

    steps = [s.model_dump() for s in body.guide]
    uni.application_guide = json.dumps(steps)
    uni.guide_generated_at = datetime.utcnow()
    db.commit()

    return {"university_id": uni.id, "steps_saved": len(steps)}


@router.delete("/admin/{university_id}", dependencies=[Depends(require_admin)], status_code=204)
def delete_guide(
    university_id: int,
    db: Session = Depends(get_db),
):
    uni = db.query(University).filter(University.id == university_id).first()
    if not uni:
        raise HTTPException(status_code=404, detail="University not found")
    uni.application_guide = None
    uni.guide_generated_at = None
    db.commit()
