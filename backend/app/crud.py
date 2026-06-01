from typing import Optional

from sqlalchemy import or_
from sqlalchemy.orm import Session, joinedload

from app import models, schemas


def get_child(db: Session, child_id: int) -> Optional[models.Child]:
    return db.query(models.Child).filter(models.Child.id == child_id).first()


def list_children(
    db: Session,
    search: Optional[str] = None,
    posyandu_area: Optional[str] = None,
) -> list[models.Child]:
    query = db.query(models.Child)
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


def create_child(db: Session, payload: schemas.ChildCreate) -> models.Child:
    child = models.Child(**payload.model_dump())
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


def list_measurements(db: Session) -> list[models.Measurement]:
    return db.query(models.Measurement).order_by(models.Measurement.measurement_date.desc()).all()


def list_child_measurements(db: Session, child_id: int) -> list[models.Measurement]:
    return (
        db.query(models.Measurement)
        .filter(models.Measurement.child_id == child_id)
        .order_by(models.Measurement.measurement_date.asc())
        .all()
    )


def get_measurement(db: Session, measurement_id: int) -> Optional[models.Measurement]:
    return db.query(models.Measurement).filter(models.Measurement.id == measurement_id).first()


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


def delete_measurement(db: Session, measurement: models.Measurement) -> None:
    db.delete(measurement)
    db.commit()


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


def reply_consultation(
    db: Session,
    ticket: models.ConsultationTicket,
    payload: schemas.ConsultationReply,
) -> models.ConsultationTicket:
    ticket.admin_reply = payload.reply
    ticket.status = payload.status
    db.add(ticket)
    db.commit()
    db.refresh(ticket)
    return ticket


def update_consultation_status(
    db: Session,
    ticket: models.ConsultationTicket,
    payload: schemas.ConsultationStatusUpdate,
) -> models.ConsultationTicket:
    ticket.status = payload.status
    db.add(ticket)
    db.commit()
    db.refresh(ticket)
    return ticket
