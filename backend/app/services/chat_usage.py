from __future__ import annotations

import os
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import Request
from sqlalchemy import func
from sqlalchemy.orm import Session

from app import config as _config  # noqa: F401 - ensures .env files are loaded
from app import models
from app.services.authentication import AuthenticatedUser, get_client_ip


LIMIT_MESSAGE = (
    "Batas penggunaan chatbot hari ini sudah tercapai. "
    "Silakan coba lagi nanti atau gunakan fitur konsultasi ke petugas."
)


@dataclass(frozen=True)
class ChatIdentity:
    user_id: Optional[str]
    ip_address: str
    role: str


def _env_int(name: str, default: int) -> int:
    try:
        return int(os.getenv(name, str(default)))
    except ValueError:
        return default


def _env_bool(name: str, default: bool) -> bool:
    value = os.getenv(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


def _limit_count_sources() -> list[str] | None:
    """
    Default: count all chatbot attempts.
    For development/testing, set CHAT_LIMIT_COUNT_SOURCES=llm so only real
    LLM calls count toward local quota.
    """
    raw = os.getenv("CHAT_LIMIT_COUNT_SOURCES", "all").strip().lower()

    if raw in {"all", "*", ""}:
        return None

    if raw == "billable":
        return ["llm"]

    return [item.strip() for item in raw.split(",") if item.strip()]


def resolve_chat_identity(
    request: Request,
    current_user: AuthenticatedUser | None = None,
) -> ChatIdentity:
    ip_address = get_client_ip(request)
    if current_user is None:
        return ChatIdentity(user_id=None, ip_address=ip_address, role="guest")

    return ChatIdentity(
        user_id=current_user.email,
        ip_address=ip_address,
        role=current_user.role,
    )


def _usage_query(db: Session, identity: ChatIdentity, since: datetime):
    query = db.query(func.count(models.ChatUsage.id)).filter(models.ChatUsage.created_at >= since)

    if identity.user_id:
        query = query.filter(models.ChatUsage.user_id == identity.user_id)
    else:
        query = query.filter(
            models.ChatUsage.user_id.is_(None),
            models.ChatUsage.ip_address == identity.ip_address,
        )

    source_filter = _limit_count_sources()
    if source_filter:
        query = query.filter(models.ChatUsage.source.in_(source_filter))

    return query


def check_chat_rate_limit(db: Session, identity: ChatIdentity) -> tuple[bool, str | None]:
    """
    Local app-level rate limit.

    This is separate from Gemini/Groq/OpenRouter API limits. For development,
    increase limits from .env or disable temporarily.
    """
    if not _env_bool("CHAT_RATE_LIMIT_ENABLED", True):
        return True, None

    now = datetime.now(timezone.utc)
    day_start = now - timedelta(days=1)
    minute_start = now - timedelta(minutes=1)

    if identity.role == "admin":
        daily_limit = _env_int("CHAT_ADMIN_DAILY_LIMIT", 100)
        minute_limit = _env_int("CHAT_ADMIN_MINUTE_LIMIT", 30)
    elif identity.role == "parent":
        daily_limit = _env_int("CHAT_PARENT_DAILY_LIMIT", 30)
        minute_limit = _env_int("CHAT_PARENT_MINUTE_LIMIT", 5)
    else:
        daily_limit = _env_int("CHAT_GUEST_DAILY_LIMIT", 10)
        minute_limit = _env_int("CHAT_GUEST_MINUTE_LIMIT", 3)

    daily_count = _usage_query(db, identity, day_start).scalar() or 0
    if daily_count >= daily_limit:
        return False, LIMIT_MESSAGE

    if minute_limit > 0:
        minute_count = _usage_query(db, identity, minute_start).scalar() or 0
        if minute_count >= minute_limit:
            return False, (
                "Batas penggunaan chatbot per menit sudah tercapai. "
                "Silakan tunggu sebentar lalu coba lagi."
            )

    return True, None


def record_chat_usage(
    db: Session,
    identity: ChatIdentity,
    message_length: int,
    provider: str,
    source: str,
) -> None:
    usage = models.ChatUsage(
        user_id=identity.user_id,
        ip_address=identity.ip_address,
        role=identity.role,
        message_length=message_length,
        provider=provider,
        source=source,
    )
    db.add(usage)
    db.commit()
