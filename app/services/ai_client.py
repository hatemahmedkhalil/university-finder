"""
Unified AI chat-completion client with automatic provider fallback.

Groq is the primary provider (fast, generous limits under normal load), but
its free/on-demand tier caps out at 100k tokens/day — a real ceiling once
the app has real traffic. Gemini's OpenAI-compatible endpoint
(generativelanguage.googleapis.com/v1beta/openai/) is a drop-in secondary
provider: same `.chat.completions.create(...)` shape, so every existing call
site only needs a one-line swap to `chat_completion(...)` / `achat_completion(...)`.

Call sites keep 100% of their existing behavior when Groq is healthy —
Gemini is only ever contacted after Groq actually fails with a rate-limit
(429) error, never as a silent quality/latency trade-off.
"""
import logging
from typing import Optional

from groq import Groq, AsyncGroq
from openai import OpenAI, AsyncOpenAI

from app.config import settings

logger = logging.getLogger("university_finder")

GROQ_MODEL = "llama-3.3-70b-versatile"
GEMINI_MODEL = "gemini-flash-lite-latest"
GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/openai/"


def _is_rate_limit(exc: Exception) -> bool:
    msg = str(exc).lower()
    return "429" in msg or "rate_limit" in msg or "rate limit" in msg or "resource_exhausted" in msg


def ai_configured() -> bool:
    return bool(settings.GROQ_API_KEY or settings.GEMINI_API_KEY)


def chat_completion(
    messages: list[dict],
    max_tokens: int = 1000,
    temperature: float = 0.7,
    response_format: Optional[dict] = None,
) -> str:
    """Sync chat completion. Tries Groq first, falls back to Gemini on rate limit.
    Raises the original exception if neither provider is usable."""
    last_exc: Optional[Exception] = None

    if settings.GROQ_API_KEY:
        try:
            client = Groq(api_key=settings.GROQ_API_KEY)
            kwargs = {"response_format": response_format} if response_format else {}
            resp = client.chat.completions.create(
                model=GROQ_MODEL, messages=messages,
                max_tokens=max_tokens, temperature=temperature, **kwargs,
            )
            return resp.choices[0].message.content.strip()
        except Exception as e:
            last_exc = e
            if not _is_rate_limit(e):
                raise
            logger.warning("Groq rate-limited, falling back to Gemini: %s", e)

    if settings.GEMINI_API_KEY:
        client = OpenAI(api_key=settings.GEMINI_API_KEY, base_url=GEMINI_BASE_URL)
        kwargs = {"response_format": response_format} if response_format else {}
        resp = client.chat.completions.create(
            model=GEMINI_MODEL, messages=messages,
            max_tokens=max_tokens, temperature=temperature, **kwargs,
        )
        return resp.choices[0].message.content.strip()

    if last_exc:
        raise last_exc
    raise RuntimeError("No AI provider configured (GROQ_API_KEY and GEMINI_API_KEY both missing)")


async def achat_completion(
    messages: list[dict],
    max_tokens: int = 1000,
    temperature: float = 0.7,
    response_format: Optional[dict] = None,
) -> str:
    """Async version — for routes already using AsyncGroq."""
    last_exc: Optional[Exception] = None

    if settings.GROQ_API_KEY:
        try:
            client = AsyncGroq(api_key=settings.GROQ_API_KEY)
            kwargs = {"response_format": response_format} if response_format else {}
            resp = await client.chat.completions.create(
                model=GROQ_MODEL, messages=messages,
                max_tokens=max_tokens, temperature=temperature, **kwargs,
            )
            return resp.choices[0].message.content.strip()
        except Exception as e:
            last_exc = e
            if not _is_rate_limit(e):
                raise
            logger.warning("Groq rate-limited, falling back to Gemini: %s", e)

    if settings.GEMINI_API_KEY:
        client = AsyncOpenAI(api_key=settings.GEMINI_API_KEY, base_url=GEMINI_BASE_URL)
        kwargs = {"response_format": response_format} if response_format else {}
        resp = await client.chat.completions.create(
            model=GEMINI_MODEL, messages=messages,
            max_tokens=max_tokens, temperature=temperature, **kwargs,
        )
        return resp.choices[0].message.content.strip()

    if last_exc:
        raise last_exc
    raise RuntimeError("No AI provider configured (GROQ_API_KEY and GEMINI_API_KEY both missing)")
