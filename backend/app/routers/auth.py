from fastapi import APIRouter, HTTPException, status

from app import schemas


router = APIRouter(prefix="/auth", tags=["auth"])

DEMO_USERS = {
    "parent@demo.com": {
        "password": "password",
        "name": "Demo Parent",
        "role": "parent",
    },
    "admin@demo.com": {
        "password": "password",
        "name": "Admin Posyandu",
        "role": "admin",
    },
}


@router.post("/login", response_model=schemas.LoginResponse)
def login(payload: schemas.LoginRequest):
    user = DEMO_USERS.get(payload.email.strip().lower())
    if not user or user["password"] != payload.password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email atau password demo tidak valid.",
        )

    return schemas.LoginResponse(
        token=f"demo-{user['role']}-token",
        email=payload.email.strip().lower(),
        name=user["name"],
        role=user["role"],
    )
