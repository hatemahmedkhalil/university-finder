import shutil
import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime, timezone
from typing import Optional

from app.dependencies import get_db, get_current_user, require_admin
from app.models.application import Application
from app.models.application_document import ApplicationDocument
from app.models.university import University
from app.models.user import User

DOCS_DIR = Path(__file__).resolve().parent.parent.parent / "uploads" / "documents"
DOCS_DIR.mkdir(parents=True, exist_ok=True)

MAX_FILE_SIZE = 20 * 1024 * 1024  # 20 MB
ALLOWED_DOC_TYPES = {
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "image/jpeg",
    "image/png",
    "image/webp",
}
ALLOWED_DOC_EXTENSIONS = {".pdf", ".doc", ".docx", ".jpg", ".jpeg", ".png", ".webp"}

router = APIRouter(prefix="/applications", tags=["Applications"])

VALID_STATUSES = {"under_review", "waiting_college", "accepted", "rejected"}


class UniversitySnap(BaseModel):
    id: int
    name: str
    city: str
    country: str
    logo_url: Optional[str] = None
    website: Optional[str] = None
    model_config = {"from_attributes": True}


class ApplicationOut(BaseModel):
    id: int
    user_id: int
    university_id: int
    status: str
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    university: UniversitySnap
    model_config = {"from_attributes": True}


class ApplicationCreate(BaseModel):
    university_id: int
    status: str = "under_review"
    notes: Optional[str] = None


class AdminApplicationCreate(BaseModel):
    user_id: int
    university_id: int
    status: str = "interested"
    notes: Optional[str] = None


class ApplicationUpdate(BaseModel):
    status: Optional[str] = None
    notes: Optional[str] = None


@router.get("/admin/all", response_model=list[ApplicationOut], tags=["Admin"])
def admin_list_all_applications(
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    return db.query(Application).order_by(Application.updated_at.desc()).all()


@router.get("/admin/{app_id}", response_model=ApplicationOut, tags=["Admin"])
def admin_get_application(
    app_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    app = db.query(Application).filter(Application.id == app_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    return app


@router.post("/admin", response_model=ApplicationOut, tags=["Admin"])
def admin_create_application(
    body: AdminApplicationCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    if body.status not in VALID_STATUSES:
        raise HTTPException(status_code=400, detail=f"Invalid status")

    uni = db.query(University).filter(University.id == body.university_id).first()
    if not uni:
        raise HTTPException(status_code=404, detail="University not found")

    existing = db.query(Application).filter(
        Application.user_id == body.user_id,
        Application.university_id == body.university_id,
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail="Application already exists for this user/university")

    app = Application(**body.model_dump())
    db.add(app)
    db.commit()
    db.refresh(app)
    return app


@router.patch("/admin/{app_id}", response_model=ApplicationOut, tags=["Admin"])
def admin_update_application(
    app_id: int,
    body: ApplicationUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    app = db.query(Application).filter(Application.id == app_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    if body.status and body.status not in VALID_STATUSES:
        raise HTTPException(status_code=400, detail="Invalid status")
    if body.status is not None:
        app.status = body.status
    if body.notes is not None:
        app.notes = body.notes
    app.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(app)
    return app


@router.delete("/admin/{app_id}", tags=["Admin"])
def admin_delete_application(
    app_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    app = db.query(Application).filter(Application.id == app_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    db.delete(app)
    db.commit()
    return {"id": app_id}


@router.get("/admin/{app_id}/documents", tags=["Admin"])
def admin_list_documents(
    app_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    docs = db.query(ApplicationDocument).filter(
        ApplicationDocument.application_id == app_id
    ).order_by(ApplicationDocument.uploaded_at.asc()).all()
    return [_to_doc_out(d) for d in docs]


class DocApprovalUpdate(BaseModel):
    is_approved: bool


@router.patch("/admin/{app_id}/documents/{doc_id}", tags=["Admin"])
def admin_update_document(
    app_id: int,
    doc_id: int,
    body: DocApprovalUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    doc = db.query(ApplicationDocument).filter(
        ApplicationDocument.id == doc_id,
        ApplicationDocument.application_id == app_id,
    ).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    doc.is_approved = body.is_approved
    db.commit()
    db.refresh(doc)
    return _to_doc_out(doc)


@router.get("", response_model=list[ApplicationOut])
def list_applications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(Application)
        .filter(Application.user_id == current_user.id)
        .order_by(Application.updated_at.desc())
        .all()
    )


@router.post("", response_model=ApplicationOut)
def create_application(
    body: ApplicationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if body.status not in VALID_STATUSES:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {', '.join(VALID_STATUSES)}")

    uni = db.query(University).filter(University.id == body.university_id).first()
    if not uni:
        raise HTTPException(status_code=404, detail="University not found")

    existing = db.query(Application).filter(
        Application.user_id == current_user.id,
        Application.university_id == body.university_id,
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail="Application already exists for this university")

    app = Application(user_id=current_user.id, **body.model_dump())
    db.add(app)
    db.commit()
    db.refresh(app)
    return app


@router.patch("/{app_id}", response_model=ApplicationOut)
def update_application(
    app_id: int,
    body: ApplicationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    app = db.query(Application).filter(
        Application.id == app_id,
        Application.user_id == current_user.id,
    ).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    if body.status and body.status not in VALID_STATUSES:
        raise HTTPException(status_code=400, detail=f"Invalid status")

    if body.status is not None:
        app.status = body.status
    if body.notes is not None:
        app.notes = body.notes
    app.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(app)
    return app


@router.delete("/{app_id}")
def delete_application(
    app_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    app = db.query(Application).filter(
        Application.id == app_id,
        Application.user_id == current_user.id,
    ).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    db.delete(app)
    db.commit()
    return {"id": app_id}


@router.get("/university/{university_id}", response_model=Optional[ApplicationOut])
def get_application_for_university(
    university_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return db.query(Application).filter(
        Application.user_id == current_user.id,
        Application.university_id == university_id,
    ).first()


# ── Document upload ──────────────────────────────────────────────────────────

class DocumentOut(BaseModel):
    id: int
    application_id: int
    filename: str
    original_name: str
    file_type: str
    file_size: int
    uploaded_at: datetime
    url: str
    is_approved: bool = False
    model_config = {"from_attributes": True}


def _doc_url(app_id: int, doc_id: int) -> str:
    return f"/applications/{app_id}/documents/{doc_id}/download"


def _to_doc_out(doc: ApplicationDocument) -> DocumentOut:
    return DocumentOut(
        id=doc.id,
        application_id=doc.application_id,
        filename=doc.filename,
        original_name=doc.original_name,
        file_type=doc.file_type,
        file_size=doc.file_size,
        uploaded_at=doc.uploaded_at,
        url=_doc_url(doc.application_id, doc.id),
        is_approved=doc.is_approved,
    )


def _get_app_owned(app_id: int, user_id: int, db: Session) -> Application:
    app = db.query(Application).filter(
        Application.id == app_id,
        Application.user_id == user_id,
    ).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    return app


@router.get("/{app_id}/documents", response_model=list[DocumentOut])
def list_documents(
    app_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _get_app_owned(app_id, current_user.id, db)
    docs = db.query(ApplicationDocument).filter(
        ApplicationDocument.application_id == app_id
    ).order_by(ApplicationDocument.uploaded_at.desc()).all()
    return [_to_doc_out(d) for d in docs]


@router.post("/{app_id}/documents", response_model=DocumentOut)
async def upload_document(
    app_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _get_app_owned(app_id, current_user.id, db)

    if file.content_type not in ALLOWED_DOC_TYPES:
        raise HTTPException(status_code=400, detail="File type not allowed. Upload PDF, Word, or image files only.")

    ext = Path(file.filename).suffix.lower() if file.filename else ""
    if ext not in ALLOWED_DOC_EXTENSIONS:
        raise HTTPException(status_code=400, detail="File extension not allowed.")

    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File too large (max 20 MB)")

    stored_name = f"{uuid.uuid4().hex}{ext}"
    dest = DOCS_DIR / stored_name

    with dest.open("wb") as f:
        f.write(contents)

    doc = ApplicationDocument(
        application_id=app_id,
        filename=stored_name,
        original_name=file.filename or stored_name,
        file_type=file.content_type or "application/octet-stream",
        file_size=len(contents),
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return _to_doc_out(doc)


@router.delete("/{app_id}/documents/{doc_id}")
def delete_document(
    app_id: int,
    doc_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _get_app_owned(app_id, current_user.id, db)
    doc = db.query(ApplicationDocument).filter(
        ApplicationDocument.id == doc_id,
        ApplicationDocument.application_id == app_id,
    ).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    file_path = DOCS_DIR / doc.filename
    if file_path.exists():
        file_path.unlink()

    db.delete(doc)
    db.commit()
    return {"id": doc_id}


@router.get("/{app_id}/documents/{doc_id}/download")
def download_document(
    app_id: int,
    doc_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Authenticated document download — only the owner (or admin) can download."""
    # Allow admin to download any document
    if current_user.role != "admin":
        _get_app_owned(app_id, current_user.id, db)

    doc = db.query(ApplicationDocument).filter(
        ApplicationDocument.id == doc_id,
        ApplicationDocument.application_id == app_id,
    ).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    file_path = (DOCS_DIR / doc.filename).resolve()
    if not file_path.exists() or DOCS_DIR.resolve() not in file_path.parents:
        raise HTTPException(status_code=404, detail="File not found on server")

    return FileResponse(
        path=file_path,
        filename=doc.original_name,
        media_type=doc.file_type or "application/octet-stream",
    )
