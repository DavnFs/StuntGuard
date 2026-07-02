from fastapi import APIRouter, HTTPException, Request, status

from app import schemas
from app.services.authentication import (
    authenticate_user,
    clear_failed_logins,
    ensure_login_attempt_allowed,
    issue_access_token,
    record_failed_login,
    Depends
)


router = APIRouter(prefix="/auth", tags=["auth"])

from sqlalchemy.orm import Session
from app.database import get_db

@router.post("/register", response_model=schemas.LoginResponse)
def register(payload: schemas.RegisterRequest, request: Request, db: Session = Depends(get_db)):
    ensure_login_attempt_allowed(request)
    from app import crud
    existing = crud.get_user_by_email(db, payload.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email sudah terdaftar.",
        )
    user = crud.create_user(db, payload)
    clear_failed_logins(request)
    token, expires_at = issue_access_token(user)
    return schemas.LoginResponse(
        token=token,
        expires_at=expires_at,
        email=user.email,
        name=user.name,
        role=user.role,
    )

@router.post("/login", response_model=schemas.LoginResponse)
def login(payload: schemas.LoginRequest, request: Request, db: Session = Depends(get_db)):
    ensure_login_attempt_allowed(request)
    user = authenticate_user(db, payload.email, payload.password)
    if user is None:
        record_failed_login(request)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email atau password tidak valid.",
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
