from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.dependencies import get_current_user, get_db
from app.models.user import User
from app.models.user_language import UserLanguage
from app.schemas.user_language import UserLanguageCreate, UserLanguageOut, UserLanguageUpdate

router = APIRouter(prefix="/user-languages", tags=["User Languages"])

VALID_LANGUAGES = {"english", "german", "polish", "french", "spanish", "italian", "arabic", "other"}
VALID_LEVELS = {"A1", "A2", "B1", "B2", "C1", "C2", "native"}


@router.get("", response_model=list[UserLanguageOut])
def list_languages(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return db.query(UserLanguage).filter(UserLanguage.user_id == current_user.id).all()


@router.post("", response_model=UserLanguageOut, status_code=status.HTTP_201_CREATED)
def add_language(
    payload: UserLanguageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    lang = payload.language.lower().strip()
    level = payload.level.upper().strip()
    if level not in VALID_LEVELS:
        raise HTTPException(status_code=400, detail=f"Invalid level. Must be one of: {', '.join(VALID_LEVELS)}")
    # Prevent duplicates
    existing = db.query(UserLanguage).filter(
        UserLanguage.user_id == current_user.id,
        UserLanguage.language == lang,
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"You already have {lang.capitalize()} in your language list. Edit it instead.")
    entry = UserLanguage(user_id=current_user.id, language=lang, level=level)
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


@router.patch("/{lang_id}", response_model=UserLanguageOut)
def update_language(
    lang_id: int,
    payload: UserLanguageUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    entry = db.query(UserLanguage).filter(
        UserLanguage.id == lang_id,
        UserLanguage.user_id == current_user.id,
    ).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Language entry not found.")
    level = payload.level.upper().strip()
    if level not in VALID_LEVELS:
        raise HTTPException(status_code=400, detail=f"Invalid level. Must be one of: {', '.join(VALID_LEVELS)}")
    entry.level = level
    db.commit()
    db.refresh(entry)
    return entry


@router.delete("/{lang_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_language(
    lang_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    entry = db.query(UserLanguage).filter(
        UserLanguage.id == lang_id,
        UserLanguage.user_id == current_user.id,
    ).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Language entry not found.")
    db.delete(entry)
    db.commit()
