from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import Request
from sqlalchemy import func
from sqlalchemy.orm import Session

from app import models


LIMIT_MESSAGE = (
    "Batas penggunaan chatbot hari ini sudah tercapai. Silakan coba lagi nanti atau gunakan fitur konsultasi ke petugas."
)


@dataclass(frozen=True)
class ChatIdentity:
    user_id: Optional[str]
    ip_address: str
    role: str


def resolve_chat_identity(request: Request) -> ChatIdentity:
    forwarded_for = request.headers.get("x-forwarded-for", "")
    ip_address = forwarded_for.split(",", 1)[0].strip()
    if not ip_address and request.client:
        ip_address = request.client.host
    ip_address = ip_address or "unknown"

    role = request.headers.get("x-stuntguard-role", "guest").strip().lower()
    user_id = (
        request.headers.get("x-stuntguard-user-id")
        or request.headers.get("x-stuntguard-email")
        or request.headers.get("x-user-id")
    )
    user_id = user_id.strip().lower() if user_id else None

    if role not in {"parent", "admin"} or not user_id:
        return ChatIdentity(user_id=None, ip_address=ip_address, role="guest")
    return ChatIdentity(user_id=user_id, ip_address=ip_address, role=role)


def _usage_query(db: Session, identity: ChatIdentity, since: datetime):
    query = db.query(func.count(models.ChatUsage.id)).filter(models.ChatUsage.created_at >= since)
    if identity.user_id:
        return query.filter(models.ChatUsage.user_id == identity.user_id)
    return query.filter(models.ChatUsage.user_id.is_(None), models.ChatUsage.ip_address == identity.ip_address)


def check_chat_rate_limit(db: Session, identity: ChatIdentity) -> tuple[bool, str | None]:
    now = datetime.now(timezone.utc)
    day_start = now - timedelta(days=1)
    minute_start = now - timedelta(minutes=1)

    if identity.role == "admin":
        daily_limit = 100
        minute_limit = None
    elif identity.role == "parent":
        daily_limit = 30
        minute_limit = 5
    else:
        daily_limit = 10
        minute_limit = 3

    daily_count = _usage_query(db, identity, day_start).scalar() or 0
    if daily_count >= daily_limit:
        return False, LIMIT_MESSAGE

    if minute_limit is not None:
        minute_count = _usage_query(db, identity, minute_start).scalar() or 0
        if minute_count >= minute_limit:
            return False, (
                "Batas penggunaan chatbot per menit sudah tercapai. Silakan tunggu sebentar lalu coba lagi."
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
