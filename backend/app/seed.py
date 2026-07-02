from datetime import date

from app import models, schemas
from app.crud import create_measurement, create_user
from app.database import Base, SessionLocal, engine
from app.ml.predict import predict_nutrition

DEMO_USERS = [
    {
        "email": "parent@demo.com",
        "password": "password",
        "name": "Orang Tua Demo",
        "role": "parent",
    },
    {
        "email": "hw@demo.com",
        "password": "password",
        "name": "Petugas Kesehatan",
        "role": "health_worker",
    },
]

DEMO_CHILDREN = [
    {
        "name": "Alya Demo",
        "gender": "female",
        "birth_date": date(2022, 9, 15),
        "parent_name": "Orang Tua Demo",
        "address": "Data demo, bukan identitas asli",
        "posyandu_area": "Melati",
        "measurements": [
            {"measurement_date": date(2025, 6, 10), "age_month": 33, "height_cm": 89.5, "weight_kg": 12.3},
            {"measurement_date": date(2025, 7, 10), "age_month": 34, "height_cm": 90.3, "weight_kg": 12.7},
        ],
    },
    {
        "name": "Bima Demo",
        "gender": "male",
        "birth_date": date(2023, 3, 5),
        "parent_name": "Orang Tua Demo",
        "address": "Data demo, bukan identitas asli",
        "posyandu_area": "Mawar",
        "measurements": [
            {"measurement_date": date(2025, 6, 12), "age_month": 27, "height_cm": 76.2, "weight_kg": 8.4},
            {"measurement_date": date(2025, 7, 12), "age_month": 28, "height_cm": 77.0, "weight_kg": 8.6},
        ],
    },
    {
        "name": "Citra Demo",
        "gender": "female",
        "birth_date": date(2024, 1, 20),
        "parent_name": "Orang Tua Demo",
        "address": "Data demo, bukan identitas asli",
        "posyandu_area": "Kenanga",
        "measurements": [
            {"measurement_date": date(2025, 6, 15), "age_month": 17, "height_cm": 82.0, "weight_kg": 10.4},
            {"measurement_date": date(2025, 7, 15), "age_month": 18, "height_cm": 83.0, "weight_kg": 10.8},
        ],
    },
]

def seed() -> None:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        if db.query(models.User).count() > 0:
            print("Database already has users. Seed skipped.")
            return

        parent_user = None

        for user_data in DEMO_USERS:
            # We filter out role if RegisterRequest doesn't support it
            req_data = {k: v for k, v in user_data.items() if k != "role"}
            req = schemas.RegisterRequest(**req_data)
            user = create_user(db, req)
            if user_data["email"] == "parent@demo.com":
                parent_user = user

        if not parent_user:
            return

        for item in DEMO_CHILDREN:
            measurements = item["measurements"]
            child_data = {key: value for key, value in item.items() if key != "measurements"}
            child = models.Child(**child_data, user_id=parent_user.id)
            db.add(child)
            db.commit()
            db.refresh(child)
            for measurement_payload in measurements:
                payload = schemas.MeasurementCreate(**measurement_payload)
                prediction = predict_nutrition(
                    schemas.PredictionRequest(
                        age_month=payload.age_month,
                        gender=child.gender,
                        height_cm=payload.height_cm,
                        weight_kg=payload.weight_kg,
                    )
                )
                create_measurement(db, child.id, payload, prediction)
        print("Demo data seeded.")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
