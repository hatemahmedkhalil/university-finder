import secrets
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.config import settings
from app.core.limiter import limiter
from app.core.security import create_access_token, create_refresh_token, decode_token, hash_password, verify_password
from app.dependencies import get_db, get_current_user
from app.models.user import User
from app.schemas.user import ForgotPasswordRequest, RefreshRequest, ResetPasswordRequest, Token, UserLogin, UserOut, UserRegister
from app.services.email import send_password_reset_email, send_verification_email

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
@limiter.limit("10/minute")
def register(request: Request, payload: UserRegister, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")
    is_admin = payload.email in settings.ADMIN_EMAILS
    verification_token = secrets.token_urlsafe(32)
    verification_expires = datetime.now(timezone.utc) + timedelta(hours=24)
    user = User(
        email=payload.email,
        hashed_password=hash_password(payload.password),
        role="admin" if is_admin else "student",
        is_verified=is_admin,
        verification_token=None if is_admin else verification_token,
        verification_token_expires=None if is_admin else verification_expires,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    if not is_admin:
        send_verification_email(user.email, verification_token)
    return Token(
        access_token=create_access_token(str(user.id), version=user.token_version),
        refresh_token=create_refresh_token(str(user.id), version=user.token_version),
    )


@router.get("/verify-email")
@limiter.limit("10/minute")
def verify_email(request: Request, token: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.verification_token == token).first()
    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired verification token")
    if user.verification_token_expires and datetime.now(timezone.utc) > user.verification_token_expires:
        raise HTTPException(status_code=400, detail="Verification link has expired. Please request a new one.")
    user.is_verified = True
    user.verification_token = None
    user.verification_token_expires = None
    db.commit()
    return {"message": "Email verified successfully"}


@router.post("/forgot-password")
@limiter.limit("5/minute")
def forgot_password(request: Request, payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if user:
        token = secrets.token_urlsafe(32)
        user.reset_token = token
        user.reset_token_expires = datetime.now(timezone.utc) + timedelta(hours=1)
        db.commit()
        send_password_reset_email(user.email, token)
    # Always return 200 to avoid user enumeration
    return {"message": "If that email exists, a reset link has been sent"}


@router.post("/reset-password")
@limiter.limit("5/minute")
def reset_password(request: Request, payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    token = payload.token
    new_password = payload.password
    user = db.query(User).filter(User.reset_token == token).first()
    if not user or not user.reset_token_expires:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")
    if datetime.now(timezone.utc) > user.reset_token_expires:
        raise HTTPException(status_code=400, detail="Reset token has expired")
    user.hashed_password = hash_password(new_password)
    user.reset_token = None
    user.reset_token_expires = None
    user.token_version += 1  # revoke all existing sessions after password reset
    db.commit()
    return {"message": "Password reset successfully"}


@router.post("/login", response_model=Token)
@limiter.limit("10/minute")
def login(request: Request, payload: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    if not user.is_verified and user.email not in settings.ADMIN_EMAILS:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Please verify your email address before logging in. Check your inbox for the verification link.")
    return Token(
        access_token=create_access_token(str(user.id), version=user.token_version),
        refresh_token=create_refresh_token(str(user.id), version=user.token_version),
    )


@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.post("/resend-verification")
@limiter.limit("3/minute")
def resend_verification(request: Request, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.is_verified:
        raise HTTPException(status_code=400, detail="Email already verified")
    token = secrets.token_urlsafe(32)
    current_user.verification_token = token
    current_user.verification_token_expires = datetime.now(timezone.utc) + timedelta(hours=24)
    db.commit()
    send_verification_email(current_user.email, token)
    return {"message": "Verification email sent"}


@router.post("/onboarding/complete", response_model=UserOut)
def complete_onboarding(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    current_user.has_completed_onboarding = True
    db.commit()
    db.refresh(current_user)
    return current_user


@router.post("/onboarding/reset", response_model=UserOut)
def reset_onboarding(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    current_user.has_completed_onboarding = False
    db.commit()
    db.refresh(current_user)
    return current_user


@router.post("/refresh", response_model=Token)
def refresh(payload: RefreshRequest, db: Session = Depends(get_db)):
    result = decode_token(payload.refresh_token, "refresh")
    if result is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired refresh token")
    user_id, token_version = result
    user = db.get(User, int(user_id))
    if user is None or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found or inactive")
    if user.token_version != token_version:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token has been revoked")
    return Token(
        access_token=create_access_token(str(user.id), version=user.token_version),
        refresh_token=create_refresh_token(str(user.id), version=user.token_version),
    )


@router.post("/logout")
def logout(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    current_user.token_version += 1
    db.commit()
    return {"message": "Logged out successfully"}
