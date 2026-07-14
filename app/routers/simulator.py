"""Test Simulator router — TOEFL iBT, Cambridge B2 First, extensible."""

import json
import logging
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from groq import Groq
from pydantic import BaseModel
from sqlalchemy.orm import Session, joinedload

from app.config import settings
from app.dependencies import get_current_user, get_db, require_admin
from app.models.simulator import (
    ExamPassage,
    ExamQuestion,
    SimulatorAttempt,
    SimulatorSectionResult,
)
from app.models.user import User

logger = logging.getLogger("university_finder")
router = APIRouter(prefix="/simulators", tags=["Simulators"])

# ─────────────────────────────────────────────────────────────────────────────
# Exam metadata (static config, not in DB)
# ─────────────────────────────────────────────────────────────────────────────

EXAM_META = {
    "toefl": {
        "name": "TOEFL iBT",
        "description": "Test of English as a Foreign Language — Internet-Based Test. Accepted by 12,000+ universities worldwide.",
        "score_range": "0–120",
        "sections": [
            {"id": "reading",   "label": "Reading",   "duration": 35, "type": "mcq_passage"},
            {"id": "listening", "label": "Listening", "duration": 36, "type": "listening_mcq"},
            {"id": "speaking",  "label": "Speaking",  "duration": 17, "type": "speaking"},
            {"id": "writing",   "label": "Writing",   "duration": 50, "type": "writing"},
        ],
        "logo_color": "#1565c0",
    },
    "cambridge": {
        "name": "Cambridge B2 First",
        "description": "Cambridge English: B2 First (FCE). Internationally recognised qualification at CEFR B2 level.",
        "score_range": "100–190 (Grade A/B/C)",
        "sections": [
            {"id": "reading",   "label": "Reading & Use of English", "duration": 75, "type": "mcq_passage"},
            {"id": "writing",   "label": "Writing",                   "duration": 80, "type": "writing"},
            {"id": "listening", "label": "Listening",                 "duration": 40, "type": "listening_mcq"},
            {"id": "speaking",  "label": "Speaking",                  "duration": 14, "type": "speaking"},
        ],
        "logo_color": "#2e7d32",
    },
}


# ─────────────────────────────────────────────────────────────────────────────
# Scoring helpers
# ─────────────────────────────────────────────────────────────────────────────

def _toefl_scale_reading(raw: float, total: int) -> float:
    """Raw correct → 0–30 scaled score."""
    if total == 0:
        return 0.0
    return round((raw / total) * 30, 1)


def _toefl_scale_listening(raw: float, total: int) -> float:
    return round((raw / total) * 30, 1) if total else 0.0


def _cambridge_scale(raw: float, total: int) -> float:
    """Raw → 100–190 Cambridge scaled score."""
    if total == 0:
        return 100.0
    pct = raw / total
    return round(100 + pct * 90, 0)


def _cambridge_grade(score: float) -> str:
    if score >= 180:
        return "A"
    if score >= 173:
        return "B"
    if score >= 160:
        return "C"
    return "U"


def _score_mcq(answers: dict, questions: list[ExamQuestion]) -> tuple[float, int]:
    """Return (raw_score, total_questions) for MCQ sections."""
    total = 0
    correct = 0.0
    for q in questions:
        if q.question_type != "mcq" or not q.correct_answer:
            continue
        total += 1
        student_answer = answers.get(str(q.id), "").strip().upper()
        if student_answer == q.correct_answer.strip().upper():
            correct += q.points
    return correct, total


# ─────────────────────────────────────────────────────────────────────────────
# AI scoring helpers
# ─────────────────────────────────────────────────────────────────────────────

_WRITING_PROMPT = """You are an expert {exam_type} writing examiner. Evaluate this student response objectively.

TASK PROMPT:
{task_prompt}

STUDENT RESPONSE:
{response}

Score this response using the official {exam_type} writing rubric:
{rubric}

Return ONLY valid JSON in this exact format:
{{
  "score": <number 0-{max_score}>,
  "task_achievement": <number 0-{max_score}>,
  "coherence": <number 0-{max_score}>,
  "lexical_resource": <number 0-{max_score}>,
  "grammatical_range": <number 0-{max_score}>,
  "word_count": <actual word count>,
  "strengths": ["specific strength 1", "specific strength 2"],
  "improvements": ["specific area 1", "specific area 2"],
  "feedback": "2-3 sentence detailed examiner comment"
}}"""

_SPEAKING_PROMPT = """You are an expert {exam_type} speaking examiner. Evaluate this student response.

TASK PROMPT:
{task_prompt}

STUDENT RESPONSE:
{response}

Score using the official {exam_type} speaking rubric:
{rubric}

Return ONLY valid JSON:
{{
  "score": <number 0-{max_score}>,
  "fluency": <number 0-{max_score}>,
  "vocabulary": <number 0-{max_score}>,
  "grammar": <number 0-{max_score}>,
  "pronunciation_clarity": <number 0-{max_score}>,
  "task_completion": <number 0-{max_score}>,
  "strengths": ["strength 1", "strength 2"],
  "improvements": ["area 1", "area 2"],
  "feedback": "2-3 sentence examiner comment"
}}"""

_TOEFL_WRITING_RUBRIC = "Task 1 (Integrated): Score 1-5 on relevance to reading/lecture, completeness, accuracy, language quality. Task 2 (Academic Discussion): Score 1-5 on relevant contribution, elaboration, vocabulary range, grammatical accuracy."
_CAMBRIDGE_WRITING_RUBRIC = "Score 1-5 on content/task achievement, communicative achievement (register/purpose), organisation, and language (vocabulary + grammar)."
_TOEFL_SPEAKING_RUBRIC = "Score 0-4 on Delivery (pace, pronunciation, naturalness), Language Use (grammar, vocabulary, sentence variety), Topic Development (relevance, completeness, coherence)."
_CAMBRIDGE_SPEAKING_RUBRIC = "Score 0-5 on Grammar and Vocabulary, Discourse Management, Pronunciation, Interactive Communication."

_REPORT_PROMPT = """You are a {exam_type} examiner generating a final score report for a student.

Exam: {exam_name}
Overall Score: {overall_score} / {max_score} (Band: {band})

Section Scores:
{section_summary}

Generate a personalised, encouraging score report as JSON:
{{
  "summary": "2-3 sentence overview of the student's performance",
  "cefr_level": "estimated CEFR level (A2/B1/B2/C1/C2)",
  "strengths": ["global strength 1", "global strength 2", "global strength 3"],
  "weaknesses": ["area to improve 1", "area to improve 2"],
  "recommendations": [
    "Specific study recommendation 1",
    "Specific study recommendation 2",
    "Specific study recommendation 3"
  ],
  "next_steps": "A concrete, encouraging action plan for the next 2-4 weeks"
}}"""


def _call_groq(prompt: str) -> Optional[dict]:
    if not settings.GROQ_API_KEY:
        return None
    try:
        client = Groq(api_key=settings.GROQ_API_KEY)
        resp = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=1000,
            temperature=0.3,
        )
        text = resp.choices[0].message.content.strip()
        # extract JSON from response
        start = text.find("{")
        end = text.rfind("}") + 1
        if start >= 0 and end > start:
            return json.loads(text[start:end])
    except Exception as e:
        logger.error("Groq scoring error: %s", e)
    return None


def _ai_score_writing(exam_type: str, task_prompt: str, response: str) -> dict:
    rubric = _TOEFL_WRITING_RUBRIC if exam_type == "toefl" else _CAMBRIDGE_WRITING_RUBRIC
    exam_name = "TOEFL iBT" if exam_type == "toefl" else "Cambridge B2 First"
    prompt = _WRITING_PROMPT.format(
        exam_type=exam_name,
        task_prompt=task_prompt,
        response=response,
        rubric=rubric,
        max_score=5,
    )
    result = _call_groq(prompt)
    if not result:
        word_count = len(response.split())
        base = min(3, max(1, word_count // 80))
        return {
            "score": base, "task_achievement": base, "coherence": base,
            "lexical_resource": base, "grammatical_range": base,
            "word_count": word_count,
            "strengths": ["Response submitted"],
            "improvements": ["AI scoring unavailable — manual review needed"],
            "feedback": "Your response has been submitted for review.",
        }
    return result


def _ai_score_speaking(exam_type: str, task_prompt: str, response: str) -> dict:
    rubric = _TOEFL_SPEAKING_RUBRIC if exam_type == "toefl" else _CAMBRIDGE_SPEAKING_RUBRIC
    exam_name = "TOEFL iBT" if exam_type == "toefl" else "Cambridge B2 First"
    prompt = _SPEAKING_PROMPT.format(
        exam_type=exam_name,
        task_prompt=task_prompt,
        response=response,
        rubric=rubric,
        max_score=4 if exam_type == "toefl" else 5,
    )
    result = _call_groq(prompt)
    if not result:
        word_count = len(response.split())
        base = min(3, max(1, word_count // 30))
        return {
            "score": base, "fluency": base, "vocabulary": base, "grammar": base,
            "pronunciation_clarity": base, "task_completion": base,
            "strengths": ["Response submitted"],
            "improvements": ["AI scoring unavailable — manual review needed"],
            "feedback": "Your response has been submitted for review.",
        }
    return result


# ─────────────────────────────────────────────────────────────────────────────
# Public student endpoints
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/exams")
def list_exams(_: User = Depends(get_current_user)):
    return list(EXAM_META.values())


@router.get("/exams/{exam_type}/content")
def get_exam_content(
    exam_type: str,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """Return all passages + questions for taking an exam."""
    if exam_type not in EXAM_META:
        raise HTTPException(404, "Unknown exam type")

    passages = (
        db.query(ExamPassage)
        .filter(ExamPassage.exam_type == exam_type, ExamPassage.is_active == True)
        .options(joinedload(ExamPassage.questions))
        .order_by(ExamPassage.section, ExamPassage.order_index)
        .all()
    )

    standalone_questions = (
        db.query(ExamQuestion)
        .filter(
            ExamQuestion.exam_type == exam_type,
            ExamQuestion.passage_id == None,
            ExamQuestion.is_active == True,
        )
        .order_by(ExamQuestion.section, ExamQuestion.order_index)
        .all()
    )

    def _passage_out(p: ExamPassage) -> dict:
        return {
            "id": p.id,
            "section": p.section,
            "title": p.title,
            "content": p.content,
            "order_index": p.order_index,
            "questions": [_question_out(q) for q in p.questions if q.is_active],
        }

    def _question_out(q: ExamQuestion) -> dict:
        opts = None
        if q.options_json:
            try:
                opts = json.loads(q.options_json)
            except Exception:
                pass
        return {
            "id": q.id,
            "section": q.section,
            "subsection": q.subsection,
            "question_type": q.question_type,
            "question_text": q.question_text,
            "options": opts,
            "points": q.points,
            "order_index": q.order_index,
            "passage_id": q.passage_id,
        }

    result: dict = {"exam_type": exam_type, "meta": EXAM_META[exam_type], "sections": {}}
    for section_cfg in EXAM_META[exam_type]["sections"]:
        sid = section_cfg["id"]
        result["sections"][sid] = {
            "config": section_cfg,
            "passages": [_passage_out(p) for p in passages if p.section == sid],
            "questions": [_question_out(q) for q in standalone_questions if q.section == sid],
        }

    return result


# ─────────────────────────────────────────────────────────────────────────────
# Attempt management
# ─────────────────────────────────────────────────────────────────────────────

class StartAttemptIn(BaseModel):
    exam_type: str


@router.post("/attempts", status_code=201)
def start_attempt(
    body: StartAttemptIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if body.exam_type not in EXAM_META and body.exam_type != "ielts":
        raise HTTPException(400, "Invalid exam_type")
    attempt = SimulatorAttempt(user_id=current_user.id, exam_type=body.exam_type)
    db.add(attempt)
    db.commit()
    db.refresh(attempt)
    return {"id": attempt.id, "exam_type": attempt.exam_type, "status": attempt.status}


@router.get("/attempts")
def list_attempts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    attempts = (
        db.query(SimulatorAttempt)
        .filter(SimulatorAttempt.user_id == current_user.id)
        .options(joinedload(SimulatorAttempt.section_results))
        .order_by(SimulatorAttempt.started_at.desc())
        .limit(50)
        .all()
    )

    def _attempt_out(a: SimulatorAttempt) -> dict:
        breakdown = None
        if a.score_breakdown:
            try:
                breakdown = json.loads(a.score_breakdown)
            except Exception:
                pass
        return {
            "id": a.id,
            "exam_type": a.exam_type,
            "status": a.status,
            "started_at": a.started_at.isoformat() if a.started_at else None,
            "completed_at": a.completed_at.isoformat() if a.completed_at else None,
            "overall_score": a.overall_score,
            "score_band": a.score_band,
            "score_breakdown": breakdown,
            "sections_completed": len(a.section_results),
        }

    return [_attempt_out(a) for a in attempts]


@router.get("/attempts/{attempt_id}")
def get_attempt(
    attempt_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    attempt = (
        db.query(SimulatorAttempt)
        .filter(
            SimulatorAttempt.id == attempt_id,
            SimulatorAttempt.user_id == current_user.id,
        )
        .options(joinedload(SimulatorAttempt.section_results))
        .first()
    )
    if not attempt:
        raise HTTPException(404, "Attempt not found")

    report = None
    if attempt.score_report:
        try:
            report = json.loads(attempt.score_report)
        except Exception:
            pass
    breakdown = None
    if attempt.score_breakdown:
        try:
            breakdown = json.loads(attempt.score_breakdown)
        except Exception:
            pass

    def _sr_out(sr: SimulatorSectionResult) -> dict:
        fb = None
        if sr.feedback:
            try:
                fb = json.loads(sr.feedback)
            except Exception:
                pass
        return {
            "id": sr.id,
            "section_name": sr.section_name,
            "raw_score": sr.raw_score,
            "scaled_score": sr.scaled_score,
            "band": sr.band,
            "feedback": fb,
            "time_spent": sr.time_spent,
        }

    return {
        "id": attempt.id,
        "exam_type": attempt.exam_type,
        "status": attempt.status,
        "started_at": attempt.started_at.isoformat() if attempt.started_at else None,
        "completed_at": attempt.completed_at.isoformat() if attempt.completed_at else None,
        "overall_score": attempt.overall_score,
        "score_band": attempt.score_band,
        "score_breakdown": breakdown,
        "score_report": report,
        "section_results": [_sr_out(sr) for sr in attempt.section_results],
    }


# ─────────────────────────────────────────────────────────────────────────────
# Section submission
# ─────────────────────────────────────────────────────────────────────────────

class SubmitSectionIn(BaseModel):
    answers: dict          # {question_id: answer_text}
    time_spent: Optional[int] = None  # seconds


@router.post("/attempts/{attempt_id}/sections/{section_name}")
def submit_section(
    attempt_id: int,
    section_name: str,
    body: SubmitSectionIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    attempt = db.query(SimulatorAttempt).filter(
        SimulatorAttempt.id == attempt_id,
        SimulatorAttempt.user_id == current_user.id,
        SimulatorAttempt.status == "in_progress",
    ).first()
    if not attempt:
        raise HTTPException(404, "Active attempt not found")

    exam_type = attempt.exam_type
    raw_score = None
    scaled_score = None
    feedback_json = None

    if section_name in ("reading", "listening"):
        # Auto-score MCQ
        question_ids = [int(k) for k in body.answers.keys() if k.isdigit()]
        questions = (
            db.query(ExamQuestion)
            .filter(
                ExamQuestion.id.in_(question_ids),
                ExamQuestion.exam_type == exam_type,
                ExamQuestion.section == section_name,
            )
            .all()
        ) if question_ids else []

        raw_score, total = _score_mcq(body.answers, questions)

        if exam_type == "toefl":
            scaled_score = (
                _toefl_scale_reading(raw_score, total)
                if section_name == "reading"
                else _toefl_scale_listening(raw_score, total)
            )
        else:
            scaled_score = _cambridge_scale(raw_score, total)

    elif section_name == "writing":
        # AI score writing tasks
        tasks = body.answers  # {task_id: text}
        task_scores = []
        task_feedbacks = {}
        writing_questions = db.query(ExamQuestion).filter(
            ExamQuestion.exam_type == exam_type,
            ExamQuestion.section == "writing",
            ExamQuestion.is_active == True,
        ).order_by(ExamQuestion.order_index).all()

        for q in writing_questions:
            resp = tasks.get(str(q.id), "").strip()
            if resp:
                fb = _ai_score_writing(exam_type, q.question_text, resp)
                task_feedbacks[str(q.id)] = fb
                task_scores.append(fb.get("score", 0))

        if task_scores:
            avg = sum(task_scores) / len(task_scores)
            raw_score = avg
            max_score = 5.0
            if exam_type == "toefl":
                scaled_score = round(avg / max_score * 30, 1)
            else:
                scaled_score = round(100 + (avg / max_score) * 90, 0)
        feedback_json = json.dumps(task_feedbacks)

    elif section_name == "speaking":
        speaking_questions = db.query(ExamQuestion).filter(
            ExamQuestion.exam_type == exam_type,
            ExamQuestion.section == "speaking",
            ExamQuestion.is_active == True,
        ).order_by(ExamQuestion.order_index).all()

        task_scores = []
        task_feedbacks = {}
        for q in speaking_questions:
            resp = body.answers.get(str(q.id), "").strip()
            if resp:
                fb = _ai_score_speaking(exam_type, q.question_text, resp)
                task_feedbacks[str(q.id)] = fb
                task_scores.append(fb.get("score", 0))

        if task_scores:
            avg = sum(task_scores) / len(task_scores)
            raw_score = avg
            max_score = 4.0 if exam_type == "toefl" else 5.0
            if exam_type == "toefl":
                scaled_score = round(avg / max_score * 30, 1)
            else:
                scaled_score = round(100 + (avg / max_score) * 90, 0)
        feedback_json = json.dumps(task_feedbacks)

    # Upsert section result
    existing = db.query(SimulatorSectionResult).filter(
        SimulatorSectionResult.attempt_id == attempt_id,
        SimulatorSectionResult.section_name == section_name,
    ).first()

    if existing:
        existing.answers = json.dumps(body.answers)
        existing.raw_score = raw_score
        existing.scaled_score = scaled_score
        existing.feedback = feedback_json
        existing.time_spent = body.time_spent
        existing.submitted_at = datetime.utcnow()
    else:
        sr = SimulatorSectionResult(
            attempt_id=attempt_id,
            section_name=section_name,
            answers=json.dumps(body.answers),
            raw_score=raw_score,
            scaled_score=scaled_score,
            feedback=feedback_json,
            time_spent=body.time_spent,
        )
        db.add(sr)

    db.commit()
    return {"ok": True, "raw_score": raw_score, "scaled_score": scaled_score}


# ─────────────────────────────────────────────────────────────────────────────
# Complete attempt — calculate final score + generate AI report
# ─────────────────────────────────────────────────────────────────────────────

@router.post("/attempts/{attempt_id}/complete")
def complete_attempt(
    attempt_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    attempt = (
        db.query(SimulatorAttempt)
        .filter(
            SimulatorAttempt.id == attempt_id,
            SimulatorAttempt.user_id == current_user.id,
        )
        .options(joinedload(SimulatorAttempt.section_results))
        .first()
    )
    if not attempt:
        raise HTTPException(404, "Attempt not found")

    attempt.status = "completed"
    attempt.completed_at = datetime.utcnow()

    section_map = {sr.section_name: sr for sr in attempt.section_results}
    exam_type = attempt.exam_type
    breakdown: dict = {}
    total_score = 0.0
    max_total = 120.0 if exam_type == "toefl" else 190.0

    if exam_type == "toefl":
        section_order = ["reading", "listening", "speaking", "writing"]
        for section in section_order:
            sr = section_map.get(section)
            score = sr.scaled_score if sr and sr.scaled_score is not None else 0.0
            breakdown[section] = score
            total_score += score
        overall = round(min(total_score, 120), 0)
        attempt.overall_score = overall
        attempt.score_band = str(int(overall))

    elif exam_type == "cambridge":
        section_order = ["reading", "listening", "writing", "speaking"]
        scores = []
        for section in section_order:
            sr = section_map.get(section)
            score = sr.scaled_score if sr and sr.scaled_score is not None else 100.0
            breakdown[section] = score
            scores.append(score)
        overall = round(sum(scores) / len(scores), 0) if scores else 100.0
        attempt.overall_score = overall
        attempt.score_band = _cambridge_grade(overall)

    attempt.score_breakdown = json.dumps(breakdown)

    # Build section summary for AI report
    section_lines = []
    for sec, score in breakdown.items():
        section_lines.append(f"  {sec.capitalize()}: {score}")

    # Generate AI report
    meta = EXAM_META.get(exam_type, {})
    report_prompt = _REPORT_PROMPT.format(
        exam_type=meta.get("name", exam_type),
        exam_name=meta.get("name", exam_type),
        overall_score=attempt.overall_score,
        max_score=int(max_total),
        band=attempt.score_band,
        section_summary="\n".join(section_lines),
    )
    report = _call_groq(report_prompt)
    if not report:
        report = {
            "summary": f"You completed the {meta.get('name', exam_type)} simulation with an overall score of {attempt.overall_score}.",
            "cefr_level": "B2",
            "strengths": ["Completed all sections", "Attempted all questions"],
            "weaknesses": ["Review section feedback for details"],
            "recommendations": [
                "Practice reading daily with authentic texts",
                "Listen to English/academic podcasts regularly",
                "Write practice essays and get feedback",
            ],
            "next_steps": "Focus on your lowest-scoring section and dedicate 30 minutes per day to targeted practice.",
        }
    attempt.score_report = json.dumps(report)
    db.commit()

    return {
        "id": attempt.id,
        "overall_score": attempt.overall_score,
        "score_band": attempt.score_band,
        "score_breakdown": breakdown,
        "score_report": report,
    }


# ─────────────────────────────────────────────────────────────────────────────
# Admin: CRUD for passages and questions
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/admin/passages")
def admin_list_passages(
    exam_type: Optional[str] = Query(None),
    skip: int = Query(0),
    limit: int = Query(50),
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    q = db.query(ExamPassage)
    if exam_type:
        q = q.filter(ExamPassage.exam_type == exam_type)
    total = q.count()
    items = q.order_by(ExamPassage.exam_type, ExamPassage.section, ExamPassage.order_index).offset(skip).limit(limit).all()
    return {
        "items": [{"id": p.id, "exam_type": p.exam_type, "section": p.section, "title": p.title, "difficulty": p.difficulty, "is_active": p.is_active, "order_index": p.order_index} for p in items],
        "total": total,
    }


class PassageIn(BaseModel):
    exam_type: str
    section: str
    title: Optional[str] = None
    content: str
    difficulty: str = "B2"
    order_index: int = 0


@router.post("/admin/passages", status_code=201)
def admin_create_passage(body: PassageIn, db: Session = Depends(get_db), _=Depends(require_admin)):
    p = ExamPassage(**body.model_dump())
    db.add(p)
    db.commit()
    db.refresh(p)
    return {"id": p.id}


@router.patch("/admin/passages/{passage_id}")
def admin_update_passage(passage_id: int, body: PassageIn, db: Session = Depends(get_db), _=Depends(require_admin)):
    p = db.get(ExamPassage, passage_id)
    if not p:
        raise HTTPException(404, "Not found")
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(p, k, v)
    db.commit()
    return {"id": p.id}


@router.delete("/admin/passages/{passage_id}", status_code=204)
def admin_delete_passage(passage_id: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    p = db.get(ExamPassage, passage_id)
    if p:
        db.delete(p)
        db.commit()


@router.get("/admin/questions")
def admin_list_questions(
    exam_type: Optional[str] = Query(None),
    section: Optional[str] = Query(None),
    skip: int = Query(0),
    limit: int = Query(50),
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    q = db.query(ExamQuestion)
    if exam_type:
        q = q.filter(ExamQuestion.exam_type == exam_type)
    if section:
        q = q.filter(ExamQuestion.section == section)
    total = q.count()
    items = q.order_by(ExamQuestion.exam_type, ExamQuestion.section, ExamQuestion.order_index).offset(skip).limit(limit).all()
    return {
        "items": [
            {
                "id": qi.id, "exam_type": qi.exam_type, "section": qi.section,
                "subsection": qi.subsection, "question_type": qi.question_type,
                "passage_id": qi.passage_id, "question_text": qi.question_text[:120],
                "correct_answer": qi.correct_answer, "points": qi.points,
                "order_index": qi.order_index, "is_active": qi.is_active,
            }
            for qi in items
        ],
        "total": total,
    }


class QuestionIn(BaseModel):
    exam_type: str
    section: str
    subsection: Optional[str] = None
    question_type: str = "mcq"
    passage_id: Optional[int] = None
    question_text: str
    options_json: Optional[str] = None
    correct_answer: Optional[str] = None
    explanation: Optional[str] = None
    points: float = 1.0
    order_index: int = 0


@router.post("/admin/questions", status_code=201)
def admin_create_question(body: QuestionIn, db: Session = Depends(get_db), _=Depends(require_admin)):
    q = ExamQuestion(**body.model_dump())
    db.add(q)
    db.commit()
    db.refresh(q)
    return {"id": q.id}


@router.patch("/admin/questions/{question_id}")
def admin_update_question(question_id: int, body: QuestionIn, db: Session = Depends(get_db), _=Depends(require_admin)):
    q = db.get(ExamQuestion, question_id)
    if not q:
        raise HTTPException(404, "Not found")
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(q, k, v)
    db.commit()
    return {"id": q.id}


@router.delete("/admin/questions/{question_id}", status_code=204)
def admin_delete_question(question_id: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    q = db.get(ExamQuestion, question_id)
    if q:
        db.delete(q)
        db.commit()


# ─────────────────────────────────────────────────────────────────────────────
# Seed initial exam content (idempotent)
# ─────────────────────────────────────────────────────────────────────────────

@router.post("/admin/seed", status_code=201)
def seed_exam_content(db: Session = Depends(get_db), _=Depends(require_admin)):
    """Populate DB with initial original-content TOEFL & Cambridge questions. Idempotent."""
    already = db.query(ExamPassage).filter(ExamPassage.exam_type == "toefl").count()
    if already > 0:
        return {"ok": True, "seeded": False, "message": "Content already seeded"}

    _seed_toefl(db)
    _seed_cambridge(db)
    db.commit()
    return {"ok": True, "seeded": True, "message": "Exam content seeded successfully"}


def _seed_toefl(db: Session):
    # ── Reading Passage 1 ───────────────────────────────────────────────────
    p1 = ExamPassage(
        exam_type="toefl", section="reading", order_index=1, difficulty="B2",
        title="Coral Reef Ecosystems",
        content="""Coral reefs are among the most biologically diverse ecosystems on Earth, supporting approximately 25 percent of all marine species despite covering less than one percent of the ocean floor. These structures are built by tiny marine invertebrates called coral polyps, which secrete calcium carbonate to form their hard exoskeletons. Over centuries, billions of these skeletal remains accumulate, creating the massive limestone formations we recognise as coral reefs.

The relationship between coral polyps and microscopic algae called zooxanthellae is fundamental to reef formation. These algae reside within the tissues of polyps and perform photosynthesis, providing up to 90 percent of the coral's energy requirements. In exchange, the algae receive shelter and access to the coral's metabolic waste products. This mutualistic relationship largely determines where reefs can exist: since zooxanthellae require sunlight, reefs develop mainly in clear, shallow, tropical waters.

Rising ocean temperatures caused by climate change disrupt this relationship. When water temperatures rise even slightly above normal seasonal ranges, stressed coral expels its zooxanthellae — a phenomenon called coral bleaching. Without these algae, the coral loses its primary energy source and its characteristic colour. Scientists estimate that over 50 percent of the world's coral reefs have been lost since the 1950s.

Ocean acidification presents another challenge. As atmospheric carbon dioxide concentrations increase, more CO₂ dissolves in seawater, forming carbonic acid. This reduces the availability of carbonate ions that corals need to build their calcium carbonate skeletons. Research projects that at CO₂ levels predicted for 2100, coral calcification rates could decline by up to 40 percent.

Human activities compound these pressures. Agricultural runoff introduces excess nutrients into coastal waters, stimulating algal overgrowth that smothers coral. Sediment from coastal construction clouds the water, depriving zooxanthellae of sunlight. Overfishing removes herbivorous fish that otherwise keep algae in check. Destructive practices such as blast fishing kill coral organisms directly.

Despite these threats, conservation efforts show promise. Researchers have identified heat-tolerant "super corals" with genetic adaptations that allow survival during bleaching events. Underwater nurseries cultivate these resilient varieties for transplantation onto degraded reefs. Marine protected areas that restrict fishing and human access have demonstrated measurable recovery of reef ecosystems in multiple regions.""",
    )
    db.add(p1)
    db.flush()
    for q_data in [
        (1, "According to paragraph 1, coral reefs support approximately what fraction of all marine species?",
         '["A) 1%", "B) 10%", "C) 25%", "D) 50%"]', "C",
         "Paragraph 1 states 'approximately 25 percent of all marine species'."),
        (2, "The word 'secrete' in paragraph 1 is closest in meaning to:",
         '["A) absorb", "B) produce and release", "C) collect", "D) dissolve"]', "B",
         "'Secrete' means to produce and release a substance."),
        (3, "According to paragraph 2, zooxanthellae primarily benefit coral polyps by:",
         '["A) protecting them from predators", "B) cleaning their skeletons", "C) providing most of their energy through photosynthesis", "D) filtering harmful chemicals"]', "C",
         "Paragraph 2: zooxanthellae 'providing up to 90 percent of the coral's energy requirements'."),
        (4, "Why are coral reefs mainly found in clear, shallow tropical waters?",
         '["A) These areas are protected from storms", "B) Zooxanthellae require sunlight for photosynthesis", "C) Limestone forms best in warm salty water", "D) Polyps cannot survive deeper currents"]', "B",
         "Paragraph 2 states the relationship 'largely determines where reefs can exist' because zooxanthellae need sunlight."),
        (5, "The term 'coral bleaching' in paragraph 3 refers to:",
         '["A) a chemical treatment used by researchers", "B) a stress response in which coral expels its zooxanthellae", "C) the natural aging of coral colour", "D) an algal disease that whitens reefs"]', "B",
         "Paragraph 3 defines it as stressed coral expelling its zooxanthellae."),
        (6, "According to paragraph 4, how does ocean acidification harm corals?",
         '["A) It raises water temperatures", "B) It reduces carbonate ions needed to build skeletons", "C) It kills zooxanthellae directly", "D) It attracts coral predators"]', "B",
         "Paragraph 4: acidification 'reduces the availability of carbonate ions that corals need'."),
        (7, "Which of the following is NOT mentioned as a human threat to coral reefs?",
         '["A) Agricultural runoff", "B) Noise pollution", "C) Overfishing", "D) Blast fishing"]', "B",
         "Noise pollution is not mentioned in the passage."),
        (8, "The author's main purpose in paragraph 5 is to:",
         '["A) argue that fishing should be banned entirely", "B) describe multiple human activities that harm reefs beyond climate change", "C) explain how technology can reverse reef damage", "D) quantify the economic cost of reef destruction"]', "B",
         "Paragraph 5 lists several direct human activities that damage reefs."),
        (9, "Based on the passage, 'super corals' are significant because they:",
         '["A) grow faster than other coral species", "B) possess genetic heat tolerance", "C) do not require zooxanthellae", "D) are immune to ocean acidification"]', "B",
         "Paragraph 6 identifies super corals as having 'genetic adaptations that allow survival during bleaching events'."),
        (10, "The passage suggests that conservation efforts have been:",
         '["A) largely unsuccessful", "B) limited to CO₂ reduction alone", "C) promising in some respects despite ongoing threats", "D) only effective in marine protected areas"]', "C",
         "Paragraph 6 presents both nursery cultivation and marine protected areas as showing promise."),
    ]:
        idx, text, opts, ans, expl = q_data
        db.add(ExamQuestion(
            exam_type="toefl", section="reading", passage_id=p1.id,
            question_type="mcq", question_text=text,
            options_json=opts, correct_answer=ans, explanation=expl,
            order_index=idx,
        ))

    # ── Reading Passage 2 ───────────────────────────────────────────────────
    p2 = ExamPassage(
        exam_type="toefl", section="reading", order_index=2, difficulty="B2",
        title="The Psychology of Decision-Making",
        content="""For much of the twentieth century, economists assumed that people make rational decisions by carefully weighing costs and benefits to maximise self-interest. This framework, known as rational choice theory, provided elegant mathematical predictions for markets, elections, and social behaviour. Beginning in the 1970s, however, psychologists Daniel Kahneman and Amos Tversky began systematically documenting ways in which human judgement consistently deviates from these predictions.

Kahneman and Tversky identified mental shortcuts called heuristics that humans use to make judgements under uncertainty. While these shortcuts often produce reasonable conclusions quickly, they also generate systematic errors called cognitive biases. The availability heuristic, for example, leads people to judge the likelihood of events based on how easily examples come to mind. After dramatic plane crashes receive media coverage, people consistently overestimate air travel danger while underestimating more statistically common risks such as automobile accidents.

The researchers also found that people evaluate outcomes relative to a reference point rather than in absolute terms. Central to their prospect theory, this insight explains several puzzling behaviours. Losses feel roughly twice as powerful as equivalent gains — a phenomenon called loss aversion. People will therefore work harder to avoid losing one hundred dollars than to gain an equal sum, even though the monetary value is identical in both cases.

Framing effects illustrate another departure from rational decision theory. Identical information presented differently produces substantially different choices. In a widely cited medical study, participants were significantly more willing to accept a surgical procedure described as having a "90 percent survival rate" than one described as having a "10 percent mortality rate" — the same statistical fact, reframed.

The anchoring bias reveals that people rely heavily on the first piece of information they encounter. In a classic experiment, subjects spun a wheel that stopped on either 10 or 65, then estimated the percentage of African nations in the United Nations. Those who saw 65 gave markedly higher estimates than those who saw 10, despite the wheel spin being logically irrelevant.

These findings carry profound practical implications. In public health, policies that make healthy choices the default option — such as automatic enrolment in pension plans — leverage human inertia to improve outcomes. Retailers exploit anchoring by showing inflated original prices alongside sale prices. Understanding cognitive biases has become essential across law, medicine, economics, and political science.""",
    )
    db.add(p2)
    db.flush()
    for q_data in [
        (1, "What does rational choice theory assume about human decision-making?",
         '["A) People base decisions primarily on emotions", "B) People weigh costs and benefits to maximise self-interest", "C) People follow expert advice on major decisions", "D) People make irrational choices most of the time"]', "B",
         "Paragraph 1: rational choice theory assumes 'carefully weighing costs and benefits to maximise self-interest'."),
        (2, "The word 'deviates' in paragraph 1 is closest in meaning to:",
         '["A) improves upon", "B) approaches", "C) departs from", "D) confirms"]', "C",
         "'Deviate' means to depart or differ from an expected course."),
        (3, "According to the passage, the availability heuristic leads people to:",
         '["A) overvalue written information over spoken", "B) judge event likelihood based on how easily examples come to mind", "C) underestimate all risks equally", "D) make better decisions when thinking quickly"]', "B",
         "Paragraph 2 defines the availability heuristic explicitly."),
        (4, "Why is losing $100 psychologically different from gaining $100, according to prospect theory?",
         '["A) Losses occur more often than gains in daily life", "B) Tax treatment of losses differs from that of gains", "C) Losses feel approximately twice as powerful as equivalent gains", "D) People have less experience managing gains than losses"]', "C",
         "Paragraph 3: 'Losses feel roughly twice as powerful as equivalent gains — loss aversion'."),
        (5, "The 'framing effects' described in paragraph 4 suggest that:",
         '["A) Doctors should use technical language with patients", "B) Identical information presented differently can significantly alter choices", "C) Statistical information is unreliable for medical decisions", "D) People prefer survival rates to mortality rates for rational reasons"]', "B",
         "Paragraph 4 demonstrates that the same statistical fact, framed differently, changes decisions."),
        (6, "In the anchoring experiment, what did the wheel spin number affect?",
         '["A) The subjects\' prior knowledge of African nations", "B) The emotional state of the participants", "C) Subsequent numerical estimates despite being logically irrelevant", "D) The accuracy of the participants\' geographic knowledge"]', "C",
         "Paragraph 5: an irrelevant number disproportionately influenced subsequent judgements."),
        (7, "According to paragraph 5, which group gave higher estimates?",
         '["A) Those who saw the number 10", "B) Both groups gave the same estimates", "C) Those who saw the number 65", "D) Results were distributed randomly"]', "C",
         "Paragraph 5: 'Those who saw 65 gave markedly higher estimates'."),
        (8, "The word 'leverage' in paragraph 6 is closest in meaning to:",
         '["A) restrict", "B) measure", "C) identify", "D) use to advantage"]', "D",
         "'Leverage' in this context means to use something to an advantage."),
        (9, "Which field is NOT mentioned as one where cognitive bias research has become important?",
         '["A) Law", "B) Medicine", "C) Engineering", "D) Political science"]', "C",
         "Engineering is not listed in paragraph 6's enumeration of fields."),
        (10, "The primary purpose of this passage is to:",
         '["A) Criticise rational choice theory as entirely wrong", "B) Argue that intuition is more reliable than analysis", "C) Describe research revealing systematic patterns in human judgement errors", "D) Explain why psychology is more valuable than economics"]', "C",
         "The passage presents Kahneman and Tversky's research documenting systematic cognitive biases."),
    ]:
        idx, text, opts, ans, expl = q_data
        db.add(ExamQuestion(
            exam_type="toefl", section="reading", passage_id=p2.id,
            question_type="mcq", question_text=text,
            options_json=opts, correct_answer=ans, explanation=expl,
            order_index=idx,
        ))

    # ── Listening Transcript 1 ──────────────────────────────────────────────
    l1 = ExamPassage(
        exam_type="toefl", section="listening", order_index=1, difficulty="B2",
        title="Lecture: The Bystander Effect",
        content="""[Professor speaking]
Good morning, everyone. Today we're going to talk about a psychological phenomenon with real-world consequences — the bystander effect.

In 1964, a young woman named Kitty Genovese was attacked outside her apartment building in New York City. Dozens of her neighbours reportedly witnessed the attack but did not call the police. This tragic event prompted psychologists John Darley and Bibb Latané to investigate why people fail to help in emergencies when others are present.

Their research revealed two key mechanisms. The first is diffusion of responsibility. When multiple people witness an emergency, each individual assumes that someone else will take action, so personal responsibility is diluted. In a group of ten, each person feels only one-tenth responsible. The second mechanism is pluralistic ignorance. People look to others around them to interpret ambiguous situations. If everyone else appears calm, individuals conclude the situation is not an emergency, even when it is.

Darley and Latané's classic experiment placed participants in a room, supposedly for a study, and then introduced the sound of someone having a seizure in an adjacent room. When participants were alone, 85 percent sought help within one minute. When there were four bystanders in the room, only 31 percent sought help, and response time was significantly slower.

There are important practical implications. In emergency situations, the most effective strategy to overcome the bystander effect is to single out one individual specifically. Instead of shouting "Someone call 911," you should point at one person and say "You in the red jacket — call 911 now." Assigning responsibility to a specific individual eliminates diffusion and triggers action.

Modern research has also challenged some assumptions about the bystander effect. Studies reviewing CCTV footage of real-world incidents found that bystanders actually intervened in roughly 90 percent of observed conflicts — much higher than the original lab studies suggested. Context matters considerably: urban versus rural settings, cultural backgrounds, and perceived danger all influence bystander behaviour.""",
    )
    db.add(l1)
    db.flush()
    for q_data in [
        (1, "What event prompted research into the bystander effect?",
         '["A) A subway accident in Chicago", "B) The attack on Kitty Genovese in 1964", "C) A laboratory accident involving students", "D) A large-scale natural disaster"]', "B", None),
        (2, "According to the lecture, what is 'diffusion of responsibility'?",
         '["A) A legal principle that reduces individual liability", "B) The tendency for each bystander to assume someone else will help", "C) The confusion that results from multiple people giving orders", "D) A mechanism that increases individual responsibility in crowds"]', "B", None),
        (3, "In Darley and Latané's experiment, what percentage of lone participants sought help?",
         '["A) 31%", "B) 50%", "C) 85%", "D) 90%"]', "C", None),
        (4, "Why does the professor recommend pointing at a specific person in an emergency?",
         '["A) To create panic, which motivates action", "B) Because that person is most likely trained in first aid", "C) To eliminate diffusion of responsibility by assigning it to one individual", "D) Because bystanders only respond to direct eye contact"]', "C", None),
        (5, "How does modern research differ from original bystander effect studies?",
         '["A) It confirms that people almost never help strangers", "B) It finds bystanders intervened in about 90% of real-world incidents observed on CCTV", "C) It shows the effect is stronger in rural areas than urban ones", "D) It eliminates the role of pluralistic ignorance entirely"]', "B", None),
    ]:
        idx, text, opts, ans, _ = q_data
        db.add(ExamQuestion(
            exam_type="toefl", section="listening", passage_id=l1.id,
            question_type="mcq", question_text=text,
            options_json=opts, correct_answer=ans,
            order_index=idx,
        ))

    # ── Listening Transcript 2 ──────────────────────────────────────────────
    l2 = ExamPassage(
        exam_type="toefl", section="listening", order_index=2, difficulty="B2",
        title="Conversation: Research Paper Deadline",
        content="""[Student and Academic Advisor speaking]

Student: Hi, Professor Chen. Do you have a minute? I'm a bit worried about the research paper deadline next Friday.

Advisor: Of course, come in. What's going on?

Student: Well, I've been doing the background reading, but I'm having trouble narrowing my topic. My original idea was to write about social media and mental health, but now I think the scope is too broad.

Advisor: You're right to identify that early. A paper on "social media and mental health" could be a whole book. What specific aspect interests you most?

Student: I think I'm most interested in how Instagram specifically affects body image in teenagers. There's a lot of recent research on that.

Advisor: That's a much more manageable scope. And you're right — there's solid empirical research to draw from, including the 2021 internal Facebook documents and independent academic studies. Do you have access to the university library databases?

Student: Yes, I have my student login. Should I be using PsycINFO or PubMed for this topic?

Advisor: Both, actually. PsycINFO is better for psychology perspectives — self-esteem, comparison behaviour, depression correlates. PubMed will give you medical and neuroscience angles. I'd also suggest looking at the Journal of Adolescent Health specifically.

Student: Great. One more thing — I was planning to include a section on TikTok as well for comparison. Would that work?

Advisor: It's tempting, but I'd caution against it for a 12-page paper. You'd be spreading yourself too thin. Nail the Instagram angle thoroughly and mention TikTok only as a brief note for future research.

Student: That makes sense. Should I send you my outline before I start writing?

Advisor: Absolutely. Send it by Wednesday and I'll give you feedback within 24 hours so you still have time to adjust before the deadline.""",
    )
    db.add(l2)
    db.flush()
    for q_data in [
        (1, "Why does the student visit the advisor?",
         '["A) To request an extension on the research paper deadline", "B) To get help narrowing a research topic that feels too broad", "C) To ask for access to the university library databases", "D) To discuss a poor grade on a previous paper"]', "B", None),
        (2, "What topic does the student ultimately decide to focus on?",
         '["A) Social media and general wellbeing", "B) TikTok effect on academic performance", "C) Instagram effect on body image in teenagers", "D) Facebook internal research on user psychology"]', "C", None),
        (3, "Which database does the advisor recommend for psychology perspectives?",
         '["A) PubMed", "B) JSTOR", "C) Google Scholar", "D) PsycINFO"]', "D", None),
        (4, "Why does the advisor discourage adding a TikTok section?",
         '["A) There is no research on TikTok and body image", "B) The paper would become too long", "C) It would spread the argument too thin for a 12-page paper", "D) The advisor is unfamiliar with TikTok research"]', "C", None),
        (5, "What does the advisor ask the student to do before writing the paper?",
         '["A) Submit a first draft for review", "B) Attend a library research workshop", "C) Email the outline by Wednesday for feedback", "D) Read the 2021 Facebook documents first"]', "C", None),
    ]:
        idx, text, opts, ans, _ = q_data
        db.add(ExamQuestion(
            exam_type="toefl", section="listening", passage_id=l2.id,
            question_type="mcq", question_text=text,
            options_json=opts, correct_answer=ans,
            order_index=idx,
        ))

    # ── Writing Tasks ───────────────────────────────────────────────────────
    writing_prompts = [
        (1, "task1",
         """INTEGRATED WRITING TASK — 20 minutes, 150–225 words

READ THE FOLLOWING PASSAGE (3 minutes):
Remote work arrangements offer significant advantages. Studies show remote workers report higher job satisfaction from flexible schedules and eliminating commute time. Companies benefit from reduced office costs and access to talent beyond geographic limits. Several productivity studies show remote workers complete measurable tasks at rates comparable to or exceeding in-office peers.

LISTENING — The professor's lecture challenges the reading:
"The reading presents benefits of remote work, but evidence tells a more complex story. Productivity metrics focused on measurable individual tasks do show gains, but creative collaboration suffers. A study of software engineering teams found that remote teams produced 15–20% fewer breakthrough innovations than in-person teams over two years. The cost savings described only benefit large companies with significant real estate. Small businesses often pay more in software, security, and coordination costs than they save on rent. Finally, the 'wider talent pool' argument ignores that remote management requires significant upskilling investment — many managers report it takes 40% longer to onboard remote employees effectively."

TASK: Summarise the points made in the lecture and explain how they challenge the claims in the reading passage."""),
        (2, "task2",
         """ACADEMIC DISCUSSION TASK — 10 minutes, minimum 100 words

Your professor is leading an academic discussion. Read the exchanges and then contribute your own response.

Professor Martinez: "Digital literacy — the ability to navigate, evaluate, and use digital technologies effectively — is now considered by many educators as important as traditional literacy. Do you agree that schools should treat digital literacy as a core competency equal to reading and writing? Why or why not?"

Student A (Priya): "Absolutely. Every profession today demands digital skills. A student who can write beautifully but cannot navigate databases, evaluate online sources, or collaborate on digital platforms will struggle in any modern career. Schools must reflect reality."

Student B (James): "I see the point, but traditional literacy remains the foundation. Critical reading, structured argument, and clear writing are what enable students to evaluate digital content at all. Without those skills first, digital literacy is just navigation, not real understanding."

TASK: Write a response contributing meaningfully to this academic discussion. State your opinion, support it with reasoning, and engage with what your classmates have said."""),
    ]
    for idx, subsec, text in writing_prompts:
        db.add(ExamQuestion(
            exam_type="toefl", section="writing", subsection=subsec,
            question_type="essay", question_text=text,
            order_index=idx,
        ))

    # ── Speaking Tasks ──────────────────────────────────────────────────────
    speaking_prompts = [
        (1, "task1",
         "INDEPENDENT SPEAKING — Preparation: 15 seconds | Response: 45 seconds\n\nDescribe a skill you have learned that has been particularly valuable in your life. Explain what the skill is, how you learned it, and why it has been important to you."),
        (2, "task2",
         "INTEGRATED SPEAKING — Preparation: 30 seconds | Response: 60 seconds\n\nThe university has announced that the library will reduce its open hours from 24/7 to 8am–10pm on weekdays and 10am–6pm on weekends, citing energy costs. The student quoted in the announcement says this is a positive change because it encourages better sleep habits. Summarise the announcement and the student's opinion, and explain whether you agree or disagree with the change."),
        (3, "task3",
         "INTEGRATED SPEAKING — Preparation: 30 seconds | Response: 60 seconds\n\nYou have read a short passage about 'cognitive load theory' — the idea that working memory has a limited capacity, and that effective teaching should not overload it with irrelevant information. The professor then gave examples of how splitting visual attention between diagrams and separate captions increases cognitive load, while integrated labels reduce it. Summarise what the reading says and explain how the professor's examples illustrate the concept."),
        (4, "task4",
         "LECTURE SUMMARY — Preparation: 20 seconds | Response: 60 seconds\n\nThe lecture you heard discussed the bystander effect. Using key points and examples from the lecture, explain what the bystander effect is, what causes it, and how it can be overcome."),
    ]
    for idx, subsec, text in speaking_prompts:
        db.add(ExamQuestion(
            exam_type="toefl", section="speaking", subsection=subsec,
            question_type="short_answer", question_text=text,
            order_index=idx,
        ))


def _seed_cambridge(db: Session):
    # ── Reading Passage ─────────────────────────────────────────────────────
    cp1 = ExamPassage(
        exam_type="cambridge", section="reading", order_index=1, difficulty="B2",
        title="The Science of Memory Consolidation",
        content="""Memory is often thought of as a single faculty, but neuroscientists now recognise that it comprises several distinct systems, each with different properties and biological substrates. Declarative memory — the conscious recollection of facts and events — depends critically on a brain structure called the hippocampus. Procedural memory — the kind involved in riding a bicycle or playing an instrument — relies more on the basal ganglia and cerebellum and operates largely outside conscious awareness.

The process by which newly acquired information becomes stable and long-lasting is called memory consolidation. This occurs in two phases. Synaptic consolidation happens within hours of learning: the synaptic connections between neurons that were active during the experience are chemically strengthened through the production of new proteins. This process is vulnerable — anything that disrupts protein synthesis during this window, including certain drugs and high stress, can prevent a memory from forming.

Sleep plays an essential role in the second phase: systems consolidation. During slow-wave sleep, the hippocampus replays the day's experiences to the neocortex, gradually transferring information for long-term storage. During REM sleep, emotional associations are processed and integrated. Students who sleep after studying retain information significantly better than those who remain awake — a finding with practical implications for revision strategies.

Research on memory reconsolidation has overturned the long-held assumption that memories, once consolidated, are fixed. Each time a memory is retrieved, it briefly becomes unstable and must be reconsolidated. During this window, the memory can be modified or even weakened. Therapists are exploring this mechanism as a potential treatment for post-traumatic stress disorder: by retrieving a traumatic memory and pairing it with a new, less distressing context, it may be possible to alter the emotional charge attached to the original memory.

The practical implications extend to education. Spaced repetition — reviewing material at increasing intervals over time — exploits the reconsolidation window to strengthen memories each time they are retrieved. Interleaving different subjects during study sessions, rather than blocking all material on one topic together, has been shown to improve long-term retention, even though students often perceive it as harder and less effective in the moment.""",
    )
    db.add(cp1)
    db.flush()
    for q_data in [
        (1, "According to paragraph 1, which brain structure is most closely associated with declarative memory?",
         '["A) The cerebellum", "B) The basal ganglia", "C) The hippocampus", "D) The neocortex"]', "C",
         "Paragraph 1: 'Declarative memory...depends critically on a brain structure called the hippocampus.'"),
        (2, "The word 'substrates' in paragraph 1 is closest in meaning to:",
         '["A) limitations", "B) underlying physical bases", "C) functional outputs", "D) conscious processes"]', "B",
         "'Substrates' in neuroscience refers to the biological structures that support a process."),
        (3, "What makes synaptic consolidation vulnerable, according to paragraph 2?",
         '["A) Lack of sleep the night before learning", "B) Excessive repetition of the same material", "C) Anything that disrupts protein synthesis during the consolidation window", "D) High levels of emotional arousal during learning"]', "C",
         "Paragraph 2: 'anything that disrupts protein synthesis during this window...can prevent a memory from forming.'"),
        (4, "What role does slow-wave sleep play in memory, according to paragraph 3?",
         '["A) It directly creates new synaptic connections", "B) It processes emotional associations", "C) The hippocampus replays experiences to transfer information to the neocortex", "D) It erases irrelevant memories from the day"]', "C",
         "Paragraph 3 describes the hippocampus replaying experiences to the neocortex during slow-wave sleep."),
        (5, "Which of the following best describes the concept of memory reconsolidation?",
         '["A) Memories stored in the hippocampus are permanently fixed after formation", "B) Each retrieval briefly destabilises a memory, allowing it to be modified", "C) Traumatic memories cannot be altered without medical intervention", "D) The neocortex overwrites hippocampal memories during sleep"]', "B",
         "Paragraph 4: 'Each time a memory is retrieved, it briefly becomes unstable and must be reconsolidated.'"),
        (6, "According to paragraph 5, why do students who interleave subjects often perceive it as less effective?",
         '["A) Because interleaving produces lower scores on immediate tests", "B) Because the technique has not been validated by research", "C) Because it feels harder in the moment, even though long-term retention improves", "D) Because students learn better when they feel confident"]', "C",
         "Paragraph 5: 'students often perceive it as harder and less effective in the moment' despite improved long-term retention."),
    ]:
        idx, text, opts, ans, expl = q_data
        db.add(ExamQuestion(
            exam_type="cambridge", section="reading", passage_id=cp1.id,
            question_type="mcq", question_text=text,
            options_json=opts, correct_answer=ans, explanation=expl,
            order_index=idx,
        ))

    # ── Reading Use of English — Part 1 (multiple choice cloze) ────────────
    cloze_passage = ExamPassage(
        exam_type="cambridge", section="reading", order_index=2, difficulty="B2",
        title="Use of English: Multiple-Choice Cloze",
        content="""The following passage has eight gaps. Choose the best word (A, B, C, or D) for each gap.

Urban farming — the practice of growing food within city (1) ___ — has gained considerable (2) ___ in recent years. As cities expand and populations grow, planners are increasingly (3) ___ rooftop gardens, vertical farms, and community allotments as viable ways to improve food (4) ___. Beyond simply producing vegetables, urban farms offer social (5) ___ by bringing neighbours together around shared goals. They also have measurable environmental (6) ___, reducing food transport distances and improving air quality. Critics, however, (7) ___ that the land area available in cities is far too limited to make a significant (8) ___ to overall food supply.""",
    )
    db.add(cloze_passage)
    db.flush()
    for q_data in [
        (1, "Gap (1): Choose the correct word to complete 'within city ___ '",
         '["A) borders", "B) limits", "C) boundaries", "D) edges"]', "B",
         "'City limits' is a set phrase meaning the administrative boundary of a city."),
        (2, "Gap (2): Choose the correct word: 'gained considerable ___ '",
         '["A) momentum", "B) pace", "C) speed", "D) rate"]', "A",
         "'Gain momentum' is a standard collocation meaning to become more popular or powerful."),
        (3, "Gap (3): Choose the correct word: 'planners are increasingly ___ rooftop gardens'",
         '["A) regarding", "B) considering", "C) taking", "D) viewing"]', "B",
         "'Considering' collocates naturally with planners evaluating options."),
        (4, "Gap (4): Choose the correct word: 'improve food ___ '",
         '["A) protection", "B) confidence", "C) security", "D) safety"]', "C",
         "'Food security' is the standard term for reliable access to sufficient food."),
        (5, "Gap (5): Choose the correct word: 'offer social ___ '",
         '["A) effects", "B) profits", "C) benefits", "D) advances"]', "C",
         "'Social benefits' is the natural collocation."),
        (6, "Gap (6): Choose the correct word: 'measurable environmental ___ '",
         '["A) advantages", "B) profits", "C) gains", "D) benefits"]', "D",
         "'Environmental benefits' is the standard phrase here."),
        (7, "Gap (7): Choose the correct word: 'Critics, however, ___ that'",
         '["A) argue", "B) discuss", "C) tell", "D) speak"]', "A",
         "'Critics argue' is the standard construction for presenting a counterargument."),
        (8, "Gap (8): Choose the correct word: 'make a significant ___ to overall food supply'",
         '["A) addition", "B) contribution", "C) impact", "D) difference"]', "B",
         "'Make a contribution to' is the correct collocation."),
    ]:
        idx, text, opts, ans, expl = q_data
        db.add(ExamQuestion(
            exam_type="cambridge", section="reading", passage_id=cloze_passage.id,
            question_type="mcq", question_text=text,
            options_json=opts, correct_answer=ans, explanation=expl,
            order_index=idx + 6,  # after the reading passage questions
        ))

    # ── Cambridge Writing ───────────────────────────────────────────────────
    cambridge_writing = [
        (1, "part1",
         """PART 1 — COMPULSORY — 140–190 words — 40 minutes

You must answer this question. Write your answer in an appropriate style.

Your class has been discussing technology in education. Your teacher has asked you to write an essay giving your opinion on the following statement:

"Schools should ban the use of smartphones in class entirely."

Write about:
• the benefits of smartphones as learning tools
• the distractions they can cause
• ...and your own idea

Write your ESSAY."""),
        (2, "part2",
         """PART 2 — Choose ONE task — 140–190 words — 40 minutes

You have seen this notice in an international student magazine:

REVIEWS WANTED — A PLACE THAT INSPIRES YOU

Have you been somewhere that inspired you creatively, academically, or personally? Tell us about the place, what makes it special, and why you would recommend it to others. The best reviews will be published in our next issue.

Write your REVIEW."""),
    ]
    for idx, subsec, text in cambridge_writing:
        db.add(ExamQuestion(
            exam_type="cambridge", section="writing", subsection=subsec,
            question_type="essay", question_text=text,
            order_index=idx,
        ))

    # ── Cambridge Listening ─────────────────────────────────────────────────
    cl1 = ExamPassage(
        exam_type="cambridge", section="listening", order_index=1, difficulty="B2",
        title="Part 1: Short Extracts",
        content="""Extract 1 — You hear two friends discussing a film they have both seen.
Man: What did you think of the ending? I found it a bit abrupt.
Woman: I actually liked that it didn't explain everything. Real life rarely wraps up neatly. What bothered me more was the pacing in the second act — it dragged for almost twenty minutes.
Man: I didn't notice that. I was so caught up in the lead performance.
Woman: She was extraordinary. That's what kept me engaged even through the slow parts.

Extract 2 — You hear a radio presenter introducing a guest.
Presenter: My guest today has spent the last fifteen years researching how cities can be redesigned to reduce loneliness. She argues that architecture itself can either isolate or connect people — that doorsteps, benches, and even the width of pavements send powerful social signals. Welcome to the programme.

Extract 3 — You hear a student leaving a voicemail for a classmate.
Student: Hi, it's Fatima. I just wanted to check in about the presentation on Thursday. I've finished the slides for sections one and three, but I'm still struggling with the data visualisations for section two. Do you think we could meet tomorrow morning to go over them? Let me know if that works — otherwise we could do it online.""",
    )
    db.add(cl1)
    db.flush()
    for q_data in [
        (1, "Extract 1 — What aspect of the film does the woman criticise?",
         '["A) The ending was too ambiguous", "B) The lead actress was unconvincing", "C) The second act was too slow", "D) The plot was overly complicated"]', "C", None),
        (2, "Extract 1 — What kept the woman engaged throughout the film?",
         '["A) The cinematography", "B) The lead performance", "C) The original story", "D) The soundtrack"]', "B", None),
        (3, "Extract 2 — What is the main focus of the guest's research?",
         '["A) How population growth affects city planning", "B) How urban design can reduce social isolation", "C) How architecture affects property values", "D) How public transport connects communities"]', "B", None),
        (4, "Extract 3 — Why is Fatima calling her classmate?",
         '["A) To say she cannot complete her part of the presentation", "B) To ask for help with the data visualisations for section two", "C) To change the date of the presentation", "D) To share her finished slides for all three sections"]', "B", None),
        (5, "Extract 3 — What does Fatima suggest if a morning meeting is not possible?",
         '["A) Postponing the presentation", "B) Emailing the slides instead", "C) Meeting online", "D) Working through the weekend"]', "C", None),
    ]:
        idx, text, opts, ans, _ = q_data
        db.add(ExamQuestion(
            exam_type="cambridge", section="listening", passage_id=cl1.id,
            question_type="mcq", question_text=text,
            options_json=opts, correct_answer=ans,
            order_index=idx,
        ))

    # ── Cambridge Listening Part 2 ──────────────────────────────────────────
    cl2 = ExamPassage(
        exam_type="cambridge", section="listening", order_index=2, difficulty="B2",
        title="Part 4: Interview",
        content="""[Interview with a marine biologist]

Interviewer: Dr Okonkwo, you've spent over a decade researching deep-sea ecosystems. What first attracted you to this field?

Dr Okonkwo: Honestly, it was a documentary I watched at age twelve about hydrothermal vents — these chimneys of superheated water on the ocean floor that support entire ecosystems without sunlight. It seemed impossible that life could thrive under such extreme pressure and heat. I had to know more.

Interviewer: What has surprised you most in your research?

Dr Okonkwo: The biodiversity. We consistently find species new to science on every major expedition. The deep sea covers over 60 percent of the Earth's surface, yet we've mapped less than 25 percent of it. There are almost certainly organisms down there that use biochemical processes we haven't even conceptualised yet.

Interviewer: There's growing interest in deep-sea mining. What's your view?

Dr Okonkwo: It concerns me greatly. The ecosystems at those depths have evolved over millions of years and operate on very slow timescales. A creature at two thousand metres might live for two hundred years. If you disrupt that environment, recovery could take centuries or might not happen at all. We shouldn't be extracting minerals before we even understand what we're destroying.

Interviewer: What do you hope to achieve with your current project?

Dr Okonkwo: We're mapping a previously unexplored trench in the Indian Ocean — roughly 7,000 metres deep. The goal is a complete biodiversity inventory before any commercial interests move in. Knowledge has to come before exploitation.""",
    )
    db.add(cl2)
    db.flush()
    for q_data in [
        (1, "What first inspired Dr Okonkwo to study deep-sea ecosystems?",
         '["A) A university lecture on extreme environments", "B) A childhood documentary about hydrothermal vents", "C) A book about undiscovered species", "D) A conversation with a mentor in marine biology"]', "B", None),
        (2, "What surprises Dr Okonkwo most about the deep sea?",
         '["A) The extreme water pressure", "B) The absence of photosynthesis", "C) The high level of biodiversity", "D) The temperature variations"]', "C", None),
        (3, "According to Dr Okonkwo, what percentage of the deep sea has been mapped?",
         '["A) Less than 10%", "B) About 25%", "C) More than 50%", "D) About 60%"]', "B", None),
        (4, "Why is Dr Okonkwo concerned about deep-sea mining?",
         '["A) It produces chemicals toxic to surface fish", "B) It could trigger earthquakes", "C) The slow timescales of these ecosystems make recovery from disruption very slow or impossible", "D) The technology required is too expensive to operate safely"]', "C", None),
        (5, "What is the goal of Dr Okonkwo's current project?",
         '["A) To extract rare minerals before commercial companies do", "B) To map a trench and create a biodiversity inventory before commercial exploitation", "C) To prove deep-sea mining can be done sustainably", "D) To train a new generation of deep-sea researchers"]', "B", None),
    ]:
        idx, text, opts, ans, _ = q_data
        db.add(ExamQuestion(
            exam_type="cambridge", section="listening", passage_id=cl2.id,
            question_type="mcq", question_text=text,
            options_json=opts, correct_answer=ans,
            order_index=idx,
        ))

    # ── Cambridge Speaking ──────────────────────────────────────────────────
    cam_speaking = [
        (1, "part1",
         "PART 1 — Interview (2 minutes) — Preparation: 30 seconds\n\nThe examiner will ask you general questions about yourself and your interests. Speak naturally and in full sentences.\n\nQuestions to address:\n1. What do you enjoy doing in your free time, and why?\n2. How important is learning foreign languages in today's world?\n3. Describe a place in your city or country that you find particularly interesting."),
        (2, "part2",
         "PART 2 — Individual long turn (2 minutes) — Preparation: 1 minute\n\nSpeak for 1–2 minutes about the following topic. Use your preparation time to organise your ideas.\n\nDescribe an occasion when you had to solve a difficult problem.\n\nYou should say:\n• what the problem was\n• why it was difficult\n• how you solved it\n• and explain what you learned from the experience."),
        (3, "part3_4",
         "PART 3 & 4 — Discussion (4 minutes)\n\nDiscuss the following question. Give reasons and examples to support your ideas.\n\n'In modern society, people spend too much time working and not enough time on personal relationships and leisure activities.'\n\nDo you agree? What measures could individuals and employers take to achieve a better work-life balance?"),
    ]
    for idx, subsec, text in cam_speaking:
        db.add(ExamQuestion(
            exam_type="cambridge", section="speaking", subsection=subsec,
            question_type="short_answer", question_text=text,
            order_index=idx,
        ))
