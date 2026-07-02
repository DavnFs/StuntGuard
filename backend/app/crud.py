from typing import Optional

from sqlalchemy import or_
from sqlalchemy.orm import Session, joinedload

from app import models, schemas


import bcrypt

def get_child(db: Session, child_id: int, user_id: Optional[int] = None) -> Optional[models.Child]:
    query = db.query(models.Child).filter(models.Child.id == child_id)
    if user_id:
        query = query.filter(models.Child.user_id == user_id)
    return query.first()


def get_user_by_email(db: Session, email: str) -> Optional[models.User]:
    return db.query(models.User).filter(models.User.email == email).first()

def create_user(db: Session, payload: schemas.RegisterRequest) -> models.User:
    hashed = bcrypt.hashpw(payload.password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    user = models.User(email=payload.email, name=payload.name, password=hashed)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

def list_children(
    db: Session,
    search: Optional[str] = None,
    posyandu_area: Optional[str] = None,
    user_id: Optional[int] = None,
) -> list[models.Child]:
    query = db.query(models.Child)
    if user_id:
        query = query.filter(models.Child.user_id == user_id)
    if search:
        pattern = f"%{search.strip()}%"
        query = query.filter(
            or_(
                models.Child.name.ilike(pattern),
                models.Child.parent_name.ilike(pattern),
                models.Child.posyandu_area.ilike(pattern),
            )
        )
    if posyandu_area:
        query = query.filter(models.Child.posyandu_area.ilike(f"%{posyandu_area.strip()}%"))
    return query.order_by(models.Child.created_at.desc()).all()


def create_child(db: Session, payload: schemas.ChildCreate, user_id: int) -> models.Child:
    child = models.Child(**payload.model_dump(), user_id=user_id)
    db.add(child)
    db.commit()
    db.refresh(child)
    return child


def update_child(db: Session, child: models.Child, payload: schemas.ChildUpdate) -> models.Child:
    updates = payload.model_dump(exclude_unset=True)
    for key, value in updates.items():
        setattr(child, key, value)
    db.add(child)
    db.commit()
    db.refresh(child)
    return child


def delete_child(db: Session, child: models.Child) -> None:
    db.delete(child)
    db.commit()




def list_child_measurements(db: Session, child_id: int) -> list[models.Measurement]:
    return (
        db.query(models.Measurement)
        .filter(models.Measurement.child_id == child_id)
        .order_by(models.Measurement.measurement_date.asc())
        .all()
    )


def get_measurement(db: Session, measurement_id: int) -> Optional[models.Measurement]:
    return db.query(models.Measurement).filter(models.Measurement.id == measurement_id).first()


def _compute_kms_status(prediction: schemas.PredictionResponse) -> str:
    """Map ML prediction to KMS status categories."""
    status = prediction.nutrition_status
    if status in ("severely stunted", "stunted"):
        return "Gizi Kurang"
    elif status == "normal":
        return "Normal"
    elif status == "tall":
        return "Gizi Lebih"
    return "Normal"


def create_measurement(
    db: Session,
    child_id: int,
    payload: schemas.MeasurementCreate,
    prediction: schemas.PredictionResponse,
) -> models.Measurement:
    measurement = models.Measurement(
        child_id=child_id,
        measurement_date=payload.measurement_date,
        age_month=payload.age_month,
        height_cm=payload.height_cm,
        weight_kg=payload.weight_kg,
        kms_status=_compute_kms_status(prediction),
        predicted_status=prediction.nutrition_status,
        risk_level=prediction.risk_level,
        confidence=prediction.confidence,
        recommendation=prediction.recommendation,
        model_mode=prediction.model_mode,
    )
    db.add(measurement)
    db.commit()
    db.refresh(measurement)
    return measurement




def list_consultations(
    db: Session,
    status: Optional[str] = None,
    child_id: Optional[int] = None,
) -> list[models.ConsultationTicket]:
    query = db.query(models.ConsultationTicket).options(joinedload(models.ConsultationTicket.child))
    if status:
        query = query.filter(models.ConsultationTicket.status == status)
    if child_id:
        query = query.filter(models.ConsultationTicket.child_id == child_id)
    return query.order_by(models.ConsultationTicket.created_at.desc()).all()


def get_consultation(db: Session, consultation_id: int) -> Optional[models.ConsultationTicket]:
    return (
        db.query(models.ConsultationTicket)
        .filter(models.ConsultationTicket.id == consultation_id)
        .first()
    )


def create_consultation(
    db: Session,
    payload: schemas.ConsultationCreate,
) -> models.ConsultationTicket:
    ticket = models.ConsultationTicket(**payload.model_dump())
    db.add(ticket)
    db.commit()
    db.refresh(ticket)
    return ticket


