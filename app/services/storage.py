"""
Supabase Storage abstraction.
Falls back to local disk if SUPABASE_URL / SUPABASE_SERVICE_KEY are not set,
so development still works without a Supabase account.
"""
import logging
import uuid
from pathlib import Path
from typing import Optional

from app.config import settings

logger = logging.getLogger("university_finder")

_LOCAL_ROOT = Path(__file__).resolve().parent.parent.parent / "uploads"
_LOCAL_ROOT.mkdir(parents=True, exist_ok=True)


def _client():
    from supabase import create_client
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)


def _supabase_ready() -> bool:
    return bool(settings.SUPABASE_URL and settings.SUPABASE_SERVICE_KEY)


def upload(bucket: str, path: str, data: bytes, content_type: str) -> str:
    """Upload bytes to Supabase or local disk. Returns the stored path/key."""
    if _supabase_ready():
        client = _client()
        client.storage.from_(bucket).upload(
            path, data, {"content-type": content_type, "upsert": "true"}
        )
        logger.info("[STORAGE] Uploaded to Supabase: %s/%s", bucket, path)
        return path
    local_dir = _LOCAL_ROOT / bucket
    local_dir.mkdir(parents=True, exist_ok=True)
    (local_dir / path).write_bytes(data)
    logger.info("[STORAGE] Saved locally: %s/%s", bucket, path)
    return path


def download(bucket: str, path: str) -> bytes:
    """Download bytes from Supabase or local disk."""
    if _supabase_ready():
        client = _client()
        return client.storage.from_(bucket).download(path)
    local_path = _LOCAL_ROOT / bucket / path
    if not local_path.is_file():
        raise FileNotFoundError(f"File not found: {bucket}/{path}")
    return local_path.read_bytes()


def delete(bucket: str, path: str) -> None:
    """Delete a file from Supabase or local disk."""
    if _supabase_ready():
        client = _client()
        client.storage.from_(bucket).remove([path])
        return
    local_path = _LOCAL_ROOT / bucket / path
    local_path.unlink(missing_ok=True)


def public_url(bucket: str, path: str) -> str:
    """Return a public URL for a file in a public Supabase bucket."""
    if _supabase_ready():
        client = _client()
        return client.storage.from_(bucket).get_public_url(path)
    return f"/uploads/{bucket}/{path}"
