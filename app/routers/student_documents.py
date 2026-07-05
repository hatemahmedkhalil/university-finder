import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Request
from fastapi.responses import Response
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from datetime import datetime

from app.dependencies import get_db, get_current_user
from app.core.limiter import limiter
from app.models.student_document import StudentDocument, DOC_TYPES
from app.models.user import User
from app.services import storage

BUCKET = "student-documents"

MAX_FILE_SIZE = 20 * 1024 * 1024
ALLOWED_TYPES = {
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "image/jpeg",
    "image/png",
    "image/webp",
}
ALLOWED_EXTENSIONS = {".pdf", ".doc", ".docx", ".jpg", ".jpeg", ".png", ".webp"}

router = APIRouter(prefix="/student-documents", tags=["Document Locker"])


class DocumentOut(BaseModel):
    id: int
    name: str
    doc_type: str
    original_name: str
    file_type: str
    file_size: int
    created_at: datetime
    model_config = {"from_attributes": True}


class DocumentRename(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    doc_type: str = Field(default="other")


@router.get("", response_model=list[DocumentOut])
def list_documents(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(StudentDocument).filter(
        StudentDocument.user_id == current_user.id
    ).order_by(StudentDocument.created_at.desc()).all()


@router.post("", response_model=DocumentOut, status_code=201)
@limiter.limit("10/minute")
def upload_document(
    request: Request,
    name: str = "",
    doc_type: str = "other",
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=422, detail="File type not allowed")
    if file.content_type and file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=422, detail="MIME type not allowed")
    if doc_type not in DOC_TYPES:
        doc_type = "other"

    content = file.file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File exceeds 20 MB limit")

    stored_name = f"{current_user.id}/{uuid.uuid4().hex}{ext}"
    storage.upload(BUCKET, stored_name, content, file.content_type or "application/octet-stream")

    doc = StudentDocument(
        user_id=current_user.id,
        name=name or file.filename,
        doc_type=doc_type,
        filename=stored_name,
        original_name=file.filename,
        file_type=file.content_type or "application/octet-stream",
        file_size=len(content),
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return doc


@router.get("/{doc_id}/download")
def download_document(doc_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    doc = db.query(StudentDocument).filter(
        StudentDocument.id == doc_id,
        StudentDocument.user_id == current_user.id,
    ).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    try:
        data = storage.download(BUCKET, doc.filename)
    except Exception:
        raise HTTPException(status_code=404, detail="File not found in storage")
    return Response(
        content=data,
        media_type=doc.file_type,
        headers={"Content-Disposition": f'attachment; filename="{doc.original_name}"'},
    )


@router.patch("/{doc_id}", response_model=DocumentOut)
def rename_document(doc_id: int, body: DocumentRename, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    doc = db.query(StudentDocument).filter(
        StudentDocument.id == doc_id,
        StudentDocument.user_id == current_user.id,
    ).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    doc.name = body.name
    if body.doc_type in DOC_TYPES:
        doc.doc_type = body.doc_type
    db.commit()
    db.refresh(doc)
    return doc


@router.delete("/{doc_id}", status_code=204)
def delete_document(doc_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    doc = db.query(StudentDocument).filter(
        StudentDocument.id == doc_id,
        StudentDocument.user_id == current_user.id,
    ).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    try:
        storage.delete(BUCKET, doc.filename)
    except Exception:
        pass
    db.delete(doc)
    db.commit()
