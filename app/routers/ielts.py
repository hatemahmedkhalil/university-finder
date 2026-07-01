"""IELTS Simulator router.

Access:
  - Students        : read published tests
  - Admin           : full CRUD
  - English instructor : full CRUD (same as admin for this resource)
"""

from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session, selectinload

from app.dependencies import get_db, get_current_user, require_admin
from app.models.ielts import IeltsQuestion, IeltsSection, IeltsTest
from app.models.instructor import Instructor
from app.models.user import User

router = APIRouter(prefix="/ielts", tags=["IELTS Simulator"])


# ── Access helpers ────────────────────────────────────────────────────────────

def _require_ielts_manager(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> User:
    """Allows admins OR English instructors to manage IELTS content."""
    if current_user.role == "admin":
        return current_user
    instr = db.query(Instructor).filter(
        Instructor.user_id == current_user.id,
        Instructor.language == "english",
    ).first()
    if not instr:
        raise HTTPException(status_code=403, detail="Only admins or English instructors can manage IELTS content")
    return current_user


# ── Schemas ───────────────────────────────────────────────────────────────────

class QuestionOut(BaseModel):
    id: int
    section_id: int
    question_text: str
    question_type: str
    options_json: Optional[str] = None
    correct_answer: Optional[str] = None
    marks: int
    order_index: int
    model_config = {"from_attributes": True}


class QuestionIn(BaseModel):
    question_text: str = Field(min_length=1, max_length=2000)
    question_type: str = "multiple_choice"
    options_json: Optional[str] = None
    correct_answer: Optional[str] = None
    marks: int = Field(default=1, ge=1, le=10)
    order_index: int = 0


class SectionOut(BaseModel):
    id: int
    test_id: int
    name: str
    instructions: Optional[str] = None
    order_index: int
    question_count: int = 0
    model_config = {"from_attributes": True}


class SectionDetail(SectionOut):
    questions: list[QuestionOut] = []


class SectionIn(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    instructions: Optional[str] = Field(default=None, max_length=2000)
    order_index: int = 0


class SectionCreateIn(SectionIn):
    test_id: int


class QuestionCreateIn(QuestionIn):
    section_id: int


class IeltsTestOut(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    duration_minutes: int
    is_published: bool
    created_at: datetime
    section_count: int = 0
    total_questions: int = 0
    model_config = {"from_attributes": True}


class IeltsTestDetail(IeltsTestOut):
    sections: list[SectionDetail] = []


class IeltsTestIn(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    description: Optional[str] = Field(default=None, max_length=2000)
    duration_minutes: int = Field(default=170, ge=1, le=600)
    is_published: bool = False


# ── Helpers ───────────────────────────────────────────────────────────────────

def _build_test_out(test: IeltsTest) -> IeltsTestOut:
    out = IeltsTestOut.model_validate(test)
    out.section_count = len(test.sections)
    out.total_questions = sum(len(s.questions) for s in test.sections)
    return out


def _build_test_detail(test: IeltsTest) -> IeltsTestDetail:
    out = IeltsTestDetail.model_validate(test)
    out.section_count = len(test.sections)
    out.total_questions = sum(len(s.questions) for s in test.sections)
    out.sections = []
    for sec in test.sections:
        sec_out = SectionDetail.model_validate(sec)
        sec_out.question_count = len(sec.questions)
        sec_out.questions = [QuestionOut.model_validate(q) for q in sec.questions]
        out.sections.append(sec_out)
    return out


def _load_test(db: Session, test_id: int) -> IeltsTest:
    test = db.query(IeltsTest).options(
        selectinload(IeltsTest.sections).selectinload(IeltsSection.questions)
    ).filter(IeltsTest.id == test_id).first()
    if not test:
        raise HTTPException(status_code=404, detail="IELTS test not found")
    return test


# ── Student endpoints (read only) ─────────────────────────────────────────────

@router.get("", response_model=list[IeltsTestOut])
def list_tests(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    tests = db.query(IeltsTest).options(
        selectinload(IeltsTest.sections).selectinload(IeltsSection.questions)
    ).filter(IeltsTest.is_published == True).order_by(IeltsTest.id).all()
    return [_build_test_out(t) for t in tests]


# ── Admin / English Instructor: test CRUD ────────────────────────────────────

@router.get("/manage", response_model=list[IeltsTestOut])
def manage_list_all(
    db: Session = Depends(get_db),
    _: User = Depends(_require_ielts_manager),
):
    tests = db.query(IeltsTest).options(
        selectinload(IeltsTest.sections).selectinload(IeltsSection.questions)
    ).order_by(IeltsTest.id).all()
    return [_build_test_out(t) for t in tests]


@router.post("/manage", response_model=IeltsTestOut, status_code=201)
def create_test(
    body: IeltsTestIn,
    db: Session = Depends(get_db),
    _: User = Depends(_require_ielts_manager),
):
    test = IeltsTest(**body.model_dump())
    db.add(test)
    db.commit()
    db.refresh(test)
    return _build_test_out(test)


@router.patch("/manage/{test_id}", response_model=IeltsTestOut)
def update_test(
    test_id: int,
    body: IeltsTestIn,
    db: Session = Depends(get_db),
    _: User = Depends(_require_ielts_manager),
):
    test = _load_test(db, test_id)
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(test, k, v)
    db.commit()
    return _build_test_detail(_load_test(db, test_id))


@router.delete("/manage/{test_id}", status_code=204)
def delete_test(
    test_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(_require_ielts_manager),
):
    test = db.query(IeltsTest).filter(IeltsTest.id == test_id).first()
    if not test:
        raise HTTPException(status_code=404, detail="IELTS test not found")
    db.delete(test)
    db.commit()


# ── Admin / English Instructor: section CRUD ─────────────────────────────────

@router.get("/manage/sections", response_model=list[SectionOut])
def manage_list_sections(
    db: Session = Depends(get_db),
    _: User = Depends(_require_ielts_manager),
):
    secs = db.query(IeltsSection).order_by(IeltsSection.test_id, IeltsSection.order_index).all()
    out = []
    for sec in secs:
        s = SectionOut.model_validate(sec)
        s.question_count = len(sec.questions)
        out.append(s)
    return out


@router.get("/manage/sections/{section_id}", response_model=SectionOut)
def manage_get_section(
    section_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(_require_ielts_manager),
):
    sec = db.query(IeltsSection).filter(IeltsSection.id == section_id).first()
    if not sec:
        raise HTTPException(status_code=404, detail="Section not found")
    out = SectionOut.model_validate(sec)
    out.question_count = len(sec.questions)
    return out


@router.post("/manage/sections", response_model=SectionOut, status_code=201)
def create_section(
    body: SectionCreateIn,
    db: Session = Depends(get_db),
    _: User = Depends(_require_ielts_manager),
):
    test = db.query(IeltsTest).filter(IeltsTest.id == body.test_id).first()
    if not test:
        raise HTTPException(status_code=404, detail="IELTS test not found")
    data = body.model_dump()
    test_id = data.pop("test_id")
    sec = IeltsSection(test_id=test_id, **data)
    db.add(sec)
    db.commit()
    db.refresh(sec)
    out = SectionOut.model_validate(sec)
    out.question_count = 0
    return out


@router.post("/manage/{test_id}/sections", response_model=SectionOut, status_code=201)
def add_section(
    test_id: int,
    body: SectionIn,
    db: Session = Depends(get_db),
    _: User = Depends(_require_ielts_manager),
):
    test = db.query(IeltsTest).filter(IeltsTest.id == test_id).first()
    if not test:
        raise HTTPException(status_code=404, detail="IELTS test not found")
    sec = IeltsSection(test_id=test_id, **body.model_dump())
    db.add(sec)
    db.commit()
    db.refresh(sec)
    out = SectionOut.model_validate(sec)
    out.question_count = 0
    return out


@router.patch("/manage/sections/{section_id}", response_model=SectionOut)
def update_section(
    section_id: int,
    body: SectionIn,
    db: Session = Depends(get_db),
    _: User = Depends(_require_ielts_manager),
):
    sec = db.query(IeltsSection).filter(IeltsSection.id == section_id).first()
    if not sec:
        raise HTTPException(status_code=404, detail="Section not found")
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(sec, k, v)
    db.commit()
    db.refresh(sec)
    out = SectionOut.model_validate(sec)
    out.question_count = len(sec.questions)
    return out


@router.delete("/manage/sections/{section_id}", status_code=204)
def delete_section(
    section_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(_require_ielts_manager),
):
    sec = db.query(IeltsSection).filter(IeltsSection.id == section_id).first()
    if not sec:
        raise HTTPException(status_code=404, detail="Section not found")
    db.delete(sec)
    db.commit()


# ── Admin / English Instructor: question CRUD ─────────────────────────────────

@router.get("/manage/questions", response_model=list[QuestionOut])
def manage_list_questions(
    db: Session = Depends(get_db),
    _: User = Depends(_require_ielts_manager),
):
    return [QuestionOut.model_validate(q) for q in db.query(IeltsQuestion).order_by(IeltsQuestion.section_id, IeltsQuestion.order_index).all()]


@router.get("/manage/questions/{question_id}", response_model=QuestionOut)
def manage_get_question(
    question_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(_require_ielts_manager),
):
    q = db.query(IeltsQuestion).filter(IeltsQuestion.id == question_id).first()
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")
    return QuestionOut.model_validate(q)


@router.post("/manage/questions", response_model=QuestionOut, status_code=201)
def create_question_standalone(
    body: QuestionCreateIn,
    db: Session = Depends(get_db),
    _: User = Depends(_require_ielts_manager),
):
    sec = db.query(IeltsSection).filter(IeltsSection.id == body.section_id).first()
    if not sec:
        raise HTTPException(status_code=404, detail="Section not found")
    data = body.model_dump()
    section_id = data.pop("section_id")
    q = IeltsQuestion(section_id=section_id, **data)
    db.add(q)
    db.commit()
    db.refresh(q)
    return QuestionOut.model_validate(q)


@router.post("/manage/sections/{section_id}/questions", response_model=QuestionOut, status_code=201)
def add_question(
    section_id: int,
    body: QuestionIn,
    db: Session = Depends(get_db),
    _: User = Depends(_require_ielts_manager),
):
    sec = db.query(IeltsSection).filter(IeltsSection.id == section_id).first()
    if not sec:
        raise HTTPException(status_code=404, detail="Section not found")
    q = IeltsQuestion(section_id=section_id, **body.model_dump())
    db.add(q)
    db.commit()
    db.refresh(q)
    return QuestionOut.model_validate(q)


@router.patch("/manage/questions/{question_id}", response_model=QuestionOut)
def update_question(
    question_id: int,
    body: QuestionIn,
    db: Session = Depends(get_db),
    _: User = Depends(_require_ielts_manager),
):
    q = db.query(IeltsQuestion).filter(IeltsQuestion.id == question_id).first()
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(q, k, v)
    db.commit()
    db.refresh(q)
    return QuestionOut.model_validate(q)


@router.delete("/manage/questions/{question_id}", status_code=204)
def delete_question(
    question_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(_require_ielts_manager),
):
    q = db.query(IeltsQuestion).filter(IeltsQuestion.id == question_id).first()
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")
    db.delete(q)
    db.commit()


# ── Parameterized GET routes LAST — must come after all literal sub-routes ────
# FastAPI matches in registration order; placing /{test_id} before /manage or
# /manage/{test_id} before /manage/sections would swallow those literal paths.

@router.get("/manage/{test_id}", response_model=IeltsTestDetail)
def manage_get_test(
    test_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(_require_ielts_manager),
):
    return _build_test_detail(_load_test(db, test_id))


@router.get("/{test_id}", response_model=IeltsTestDetail)
def get_test(
    test_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    test = _load_test(db, test_id)
    if not test.is_published:
        raise HTTPException(status_code=404, detail="IELTS test not found")
    return _build_test_detail(test)
