import os

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response

from app import config as _config  # noqa: F401 - loads .env before app setup
from app.database import Base, engine
from app.routers import auth, chatbot, children, consultations, dashboard, measurements, prediction


def cors_allowed_origins() -> list[str]:
    raw = os.getenv(
        "CORS_ALLOWED_ORIGINS",
        "http://127.0.0.1:5173,http://localhost:5173",
    )
    return [origin.strip() for origin in raw.split(",") if origin.strip()]


def create_app() -> FastAPI:
    Base.metadata.create_all(bind=engine)

    app = FastAPI(
        title="StuntGuard API",
        description="Sistem skrining awal risiko stunting pada balita untuk demo akademik.",
        version="1.0.0",
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=cors_allowed_origins(),
        allow_credentials=False,
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=["Authorization", "Content-Type"],
    )

    @app.middleware("http")
    async def add_security_headers(request: Request, call_next) -> Response:
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "no-referrer"
        response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
        return response

    @app.get("/health")
    def health():
        return {"status": "ok", "service": "StuntGuard API"}

    app.include_router(children.router)
    app.include_router(measurements.router)
    app.include_router(consultations.router)
    app.include_router(prediction.router)
    app.include_router(dashboard.router)
    app.include_router(chatbot.router)
    app.include_router(auth.router)

    return app


app = create_app()
