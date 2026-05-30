from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import inspect, text

from app.database import Base, engine
from app.routers import auth, chatbot, children, consultations, dashboard, measurements, prediction


def apply_lightweight_migrations() -> None:
    inspector = inspect(engine)
    if "measurements" not in inspector.get_table_names():
        return

    measurement_columns = {column["name"] for column in inspector.get_columns("measurements")}
    if "weight_kg" not in measurement_columns:
        with engine.begin() as connection:
            connection.execute(text("ALTER TABLE measurements ADD COLUMN weight_kg FLOAT"))
    if "model_mode" not in measurement_columns:
        with engine.begin() as connection:
            connection.execute(
                text("ALTER TABLE measurements ADD COLUMN model_mode VARCHAR(40) DEFAULT 'rule-based-fallback' NOT NULL")
            )


def create_app() -> FastAPI:
    Base.metadata.create_all(bind=engine)
    apply_lightweight_migrations()

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
    app.include_router(consultations.router)
    app.include_router(prediction.router)
    app.include_router(dashboard.router)
    app.include_router(chatbot.router)
    app.include_router(auth.router)

    return app


app = create_app()
