from __future__ import annotations

import base64
import hashlib
import hmac
import json
import os
import secrets
import time
from collections import defaultdict, deque
from dataclasses import dataclass
from typing import Deque

from fastapi import Depends, HTTPException, Request, status

from app import config as _config  # noqa: F401 - ensures .env files are loaded


_RUNTIME_SECRET = secrets.token_bytes(32)
_LOGIN_ATTEMPTS: dict[str, Deque[float]] = defaultdict(deque)


@dataclass(frozen=True)
class DemoUser:
    email: str
    name: str
    role: str
    password: str


@dataclass(frozen=True)
class AuthenticatedUser:
    email: str
    name: str
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


def _demo_users() -> dict[str, DemoUser]:
    parent = DemoUser(
        email="parent@demo.com",
        name="Demo Parent",
        role="parent",
        password=os.getenv("DEMO_PARENT_PASSWORD", "password"),
    )
    return {parent.email: parent}


def authenticate_demo_user(email: str, password: str) -> DemoUser | None:
    user = _demo_users().get(email.strip().lower())
    if user is None or not hmac.compare_digest(user.password, password):
        return None
    return user


def _signing_secret() -> bytes:
    configured = os.getenv("STUNTGUARD_SECRET_KEY", "").strip()
    return configured.encode("utf-8") if configured else _RUNTIME_SECRET


def _encode_segment(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("ascii")


def _decode_segment(segment: str) -> bytes:
    padding = "=" * (-len(segment) % 4)
    return base64.urlsafe_b64decode(f"{segment}{padding}")


def issue_access_token(user: DemoUser) -> tuple[str, int]:
    expires_at = int(time.time()) + _env_int("DEMO_AUTH_TOKEN_TTL_SECONDS", 8 * 60 * 60)
    payload = {
        "sub": user.email,
        "role": user.role,
        "exp": expires_at,
    }
    encoded_payload = _encode_segment(
        json.dumps(payload, separators=(",", ":"), sort_keys=True).encode("utf-8")
    )
    signature = hmac.new(_signing_secret(), encoded_payload.encode("ascii"), hashlib.sha256).digest()
    return f"{encoded_payload}.{_encode_segment(signature)}", expires_at


def validate_access_token(token: str) -> AuthenticatedUser | None:
    try:
        encoded_payload, encoded_signature = token.split(".", 1)
        expected_signature = hmac.new(
            _signing_secret(),
            encoded_payload.encode("ascii"),
            hashlib.sha256,
        ).digest()
        supplied_signature = _decode_segment(encoded_signature)
        if not hmac.compare_digest(expected_signature, supplied_signature):
            return None

        payload = json.loads(_decode_segment(encoded_payload).decode("utf-8"))
        if not isinstance(payload, dict) or int(payload.get("exp", 0)) <= int(time.time()):
            return None

        email = str(payload.get("sub", "")).strip().lower()
        role = str(payload.get("role", "")).strip().lower()
        user = _demo_users().get(email)
        if user is None or user.role != role:
            return None
        return AuthenticatedUser(email=user.email, name=user.name, role=user.role)
    except (UnicodeDecodeError, ValueError, TypeError, json.JSONDecodeError):
        return None


def get_client_ip(request: Request) -> str:
    ip_address = request.client.host if request.client else "unknown"
    if _env_bool("TRUST_PROXY_HEADERS", False):
        forwarded_for = request.headers.get("x-forwarded-for", "")
        ip_address = forwarded_for.split(",", 1)[0].strip() or ip_address
    return ip_address[:64] or "unknown"


def _authentication_error() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Sesi tidak valid atau sudah berakhir. Silakan masuk kembali.",
        headers={"WWW-Authenticate": "Bearer"},
    )


def get_optional_current_user(request: Request) -> AuthenticatedUser | None:
    authorization = request.headers.get("authorization", "").strip()
    if not authorization:
        return None

    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token:
        raise _authentication_error()

    user = validate_access_token(token)
    if user is None:
        raise _authentication_error()
    return user


def require_current_user(
    current_user: AuthenticatedUser | None = Depends(get_optional_current_user),
) -> AuthenticatedUser:
    if current_user is None:
        raise _authentication_error()
    return current_user




def ensure_login_attempt_allowed(request: Request) -> None:
    max_attempts = _env_int("LOGIN_MAX_ATTEMPTS_PER_MINUTE", 10)
    if max_attempts <= 0:
        return

    now = time.monotonic()
    attempts = _LOGIN_ATTEMPTS[get_client_ip(request)]
    while attempts and now - attempts[0] >= 60:
        attempts.popleft()
    if len(attempts) >= max_attempts:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Terlalu banyak percobaan masuk. Silakan tunggu sebentar lalu coba lagi.",
        )


def record_failed_login(request: Request) -> None:
    _LOGIN_ATTEMPTS[get_client_ip(request)].append(time.monotonic())


def clear_failed_logins(request: Request) -> None:
    _LOGIN_ATTEMPTS.pop(get_client_ip(request), None)
