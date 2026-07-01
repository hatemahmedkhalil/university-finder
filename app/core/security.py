from datetime import datetime, timedelta, timezone

import bcrypt
from jose import JWTError, jwt

from app.config import settings


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode(), hashed.encode())


def _create_token(subject: str, expires_delta: timedelta, token_type: str, version: int = 0) -> str:
    expire = datetime.now(timezone.utc) + expires_delta
    return jwt.encode(
        {"sub": subject, "exp": expire, "type": token_type, "ver": version},
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM,
    )


def create_access_token(subject: str, version: int = 0) -> str:
    return _create_token(
        subject,
        timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
        "access",
        version=version,
    )


def create_refresh_token(subject: str, version: int = 0) -> str:
    return _create_token(
        subject,
        timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
        "refresh",
        version=version,
    )


def decode_token(token: str, expected_type: str) -> tuple[str, int] | None:
    """Return (user_id_str, token_version) if token is valid and matches expected_type, else None."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        if payload.get("type") != expected_type:
            return None
        sub = payload.get("sub")
        ver = payload.get("ver", 0)
        if sub is None:
            return None
        return sub, ver
    except JWTError:
        return None
