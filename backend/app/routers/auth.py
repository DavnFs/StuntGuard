from fastapi import APIRouter, HTTPException, Request, status

from app import schemas
from app.services.authentication import (
    authenticate_demo_user,
    clear_failed_logins,
    ensure_login_attempt_allowed,
    issue_access_token,
    record_failed_login,
)


router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/login", response_model=schemas.LoginResponse)
def login(payload: schemas.LoginRequest, request: Request):
    ensure_login_attempt_allowed(request)
    user = authenticate_demo_user(payload.email, payload.password)
    if user is None:
        record_failed_login(request)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email atau password demo tidak valid.",
        )

    clear_failed_logins(request)
    token, expires_at = issue_access_token(user)
    return schemas.LoginResponse(
        token=token,
        expires_at=expires_at,
        email=user.email,
        name=user.name,
        role=user.role,
    )
