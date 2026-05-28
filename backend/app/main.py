from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine
from app.routers import chatbot, children, dashboard, measurements, prediction


def create_app() -> FastAPI:
    Base.metadata.create_all(bind=engine)

    app = FastAPI(
        title="StuntGuard API",
        description="Sistem skrining awal risiko stunting pada balita untuk demo akademik.",
        version="1.0.0",
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/health")
    def health():
        return {"status": "ok", "service": "StuntGuard API"}

    app.include_router(children.router)
    app.include_router(measurements.router)
    app.include_router(prediction.router)
    app.include_router(dashboard.router)
    app.include_router(chatbot.router)

    return app


app = create_app()
