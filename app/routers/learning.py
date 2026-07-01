from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, selectinload
from pydantic import BaseModel
from datetime import datetime
from typing import Optional

from app.dependencies import get_db, get_current_user, require_admin
from app.models.learning import Course, Lesson, PlacementTest, PlacementTestQuestion
from app.models.user import User

router = APIRouter(prefix="/learning", tags=["Learning"])


# ── Schemas ──────────────────────────────────────────────────────────────────

class QuestionOut(BaseModel):
    id: int
    question_text: str
    options_json: Optional[str] = None
    correct_answer: Optional[str] = None
    level: Optional[str] = None
    order_index: int
    model_config = {"from_attributes": True}

class QuestionIn(BaseModel):
    question_text: str
    options_json: Optional[str] = None
    correct_answer: Optional[str] = None
    level: Optional[str] = None
    order_index: int = 0

class PlacementTestOut(BaseModel):
    id: int
    title: str
    language: str
    description: Optional[str] = None
    is_published: bool
    created_at: datetime
    question_count: int = 0
    model_config = {"from_attributes": True}

class PlacementTestDetail(PlacementTestOut):
    questions: list[QuestionOut] = []

class PlacementTestIn(BaseModel):
    title: str
    language: str
    description: Optional[str] = None
    is_published: bool = False

class LessonOut(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    content_type: Optional[str] = None
    content_url: Optional[str] = None
    content_text: Optional[str] = None
    duration_minutes: Optional[int] = None
    order_index: int
    is_published: bool
    model_config = {"from_attributes": True}

class LessonIn(BaseModel):
    title: str
    description: Optional[str] = None
    content_type: Optional[str] = None
    content_url: Optional[str] = None
    content_text: Optional[str] = None
    duration_minutes: Optional[int] = None
    order_index: int = 0
    is_published: bool = False

class CourseOut(BaseModel):
    id: int
    title: str
    language: str
    level: Optional[str] = None
    description: Optional[str] = None
    thumbnail_url: Optional[str] = None
    is_published: bool
    created_at: datetime
    lesson_count: int = 0
    model_config = {"from_attributes": True}

class CourseDetail(CourseOut):
    lessons: list[LessonOut] = []

class CourseIn(BaseModel):
    title: str
    language: str
    level: Optional[str] = None
    description: Optional[str] = None
    thumbnail_url: Optional[str] = None
    is_published: bool = False


# ── Placement Tests (public read) ────────────────────────────────────────────

@router.get("/placement-tests", response_model=list[PlacementTestOut])
def list_placement_tests(
    language: Optional[str] = Query(default=None),
    db: Session = Depends(get_db),
):
    q = db.query(PlacementTest)
    if language:
        q = q.filter(PlacementTest.language == language.lower())
    tests = q.order_by(PlacementTest.language, PlacementTest.id).all()
    result = []
    for t in tests:
        out = PlacementTestOut.model_validate(t)
        out.question_count = len(t.questions)
        result.append(out)
    return result


@router.get("/placement-tests/{test_id}", response_model=PlacementTestDetail)
def get_placement_test(test_id: int, db: Session = Depends(get_db)):
    test = db.query(PlacementTest).options(
        selectinload(PlacementTest.questions)
    ).filter(PlacementTest.id == test_id).first()
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")
    out = PlacementTestDetail.model_validate(test)
    out.question_count = len(test.questions)
    out.questions = [QuestionOut.model_validate(q) for q in test.questions]
    return out


# ── Placement Tests (admin write) ────────────────────────────────────────────

@router.post("/placement-tests", response_model=PlacementTestOut)
def create_placement_test(
    body: PlacementTestIn,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    test = PlacementTest(**body.model_dump())
    db.add(test)
    db.commit()
    db.refresh(test)
    out = PlacementTestOut.model_validate(test)
    out.question_count = 0
    return out


@router.patch("/placement-tests/{test_id}", response_model=PlacementTestOut)
def update_placement_test(
    test_id: int,
    body: PlacementTestIn,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    test = db.query(PlacementTest).filter(PlacementTest.id == test_id).first()
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(test, k, v)
    db.commit()
    db.refresh(test)
    out = PlacementTestOut.model_validate(test)
    out.question_count = len(test.questions)
    return out


@router.delete("/placement-tests/{test_id}")
def delete_placement_test(
    test_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    test = db.query(PlacementTest).filter(PlacementTest.id == test_id).first()
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")
    db.delete(test)
    db.commit()
    return {"id": test_id}


# ── Questions (admin write) ──────────────────────────────────────────────────

@router.post("/placement-tests/{test_id}/questions", response_model=QuestionOut)
def add_question(
    test_id: int,
    body: QuestionIn,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    test = db.query(PlacementTest).filter(PlacementTest.id == test_id).first()
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")
    q = PlacementTestQuestion(test_id=test_id, **body.model_dump())
    db.add(q)
    db.commit()
    db.refresh(q)
    return QuestionOut.model_validate(q)


@router.delete("/placement-tests/questions/{question_id}")
def delete_question(
    question_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    q = db.query(PlacementTestQuestion).filter(PlacementTestQuestion.id == question_id).first()
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")
    db.delete(q)
    db.commit()
    return {"id": question_id}


# ── Courses (public read) ────────────────────────────────────────────────────

@router.get("/courses", response_model=list[CourseOut])
def list_courses(
    language: Optional[str] = Query(default=None),
    level: Optional[str] = Query(default=None),
    db: Session = Depends(get_db),
):
    q = db.query(Course)
    if language:
        q = q.filter(Course.language == language.lower())
    if level:
        q = q.filter(Course.level == level.upper())
    courses = q.order_by(Course.language, Course.level, Course.id).all()
    result = []
    for c in courses:
        out = CourseOut.model_validate(c)
        out.lesson_count = len(c.lessons)
        result.append(out)
    return result


@router.get("/courses/{course_id}", response_model=CourseDetail)
def get_course(course_id: int, db: Session = Depends(get_db)):
    course = db.query(Course).options(
        selectinload(Course.lessons)
    ).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    out = CourseDetail.model_validate(course)
    out.lesson_count = len(course.lessons)
    out.lessons = [LessonOut.model_validate(l) for l in course.lessons]
    return out


# ── Courses (admin write) ────────────────────────────────────────────────────

@router.post("/courses", response_model=CourseOut)
def create_course(
    body: CourseIn,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    course = Course(**body.model_dump())
    db.add(course)
    db.commit()
    db.refresh(course)
    out = CourseOut.model_validate(course)
    out.lesson_count = 0
    return out


@router.patch("/courses/{course_id}", response_model=CourseOut)
def update_course(
    course_id: int,
    body: CourseIn,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(course, k, v)
    db.commit()
    db.refresh(course)
    out = CourseOut.model_validate(course)
    out.lesson_count = len(course.lessons)
    return out


@router.delete("/courses/{course_id}")
def delete_course(
    course_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    db.delete(course)
    db.commit()
    return {"id": course_id}


# ── Lessons (admin write) ────────────────────────────────────────────────────

@router.post("/courses/{course_id}/lessons", response_model=LessonOut)
def add_lesson(
    course_id: int,
    body: LessonIn,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    lesson = Lesson(course_id=course_id, **body.model_dump())
    db.add(lesson)
    db.commit()
    db.refresh(lesson)
    return LessonOut.model_validate(lesson)


@router.delete("/courses/lessons/{lesson_id}")
def delete_lesson(
    lesson_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    db.delete(lesson)
    db.commit()
    return {"id": lesson_id}
