from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app import crud, models, schemas
from app.database import get_db
from app.services.authentication import AuthenticatedUser, require_admin, require_current_user


router = APIRouter(prefix="/consultations", tags=["consultations"])


def _to_read(ticket: models.ConsultationTicket) -> schemas.ConsultationRead:
    return schemas.ConsultationRead(
        id=ticket.id,
        child_id=ticket.child_id,
        child_name=ticket.child.name if ticket.child else "-",
        subject=ticket.subject,
        message=ticket.message,
        latest_measurement_id=ticket.latest_measurement_id,
        status=ticket.status,
        admin_reply=ticket.admin_reply,
        created_at=ticket.created_at,
        updated_at=ticket.updated_at,
    )


@router.get("", response_model=list[schemas.ConsultationRead])
def list_consultations(
    status_filter: schemas.ConsultationStatus | None = None,
    child_id: int | None = Query(default=None, gt=0),
    _current_user: AuthenticatedUser = Depends(require_current_user),
    db: Session = Depends(get_db),
):
    tickets = crud.list_consultations(db, status=status_filter, child_id=child_id)
    return [_to_read(ticket) for ticket in tickets]


@router.post("", response_model=schemas.ConsultationRead, status_code=status.HTTP_201_CREATED)
def create_consultation(
    payload: schemas.ConsultationCreate,
    _current_user: AuthenticatedUser = Depends(require_current_user),
    db: Session = Depends(get_db),
):
    child = crud.get_child(db, payload.child_id)
    if child is None:
        raise HTTPException(status_code=404, detail="Child not found")
    if payload.latest_measurement_id is not None:
        measurement = crud.get_measurement(db, payload.latest_measurement_id)
        if measurement is None or measurement.child_id != payload.child_id:
            raise HTTPException(status_code=400, detail="latest_measurement_id tidak valid untuk balita ini")

    return _to_read(crud.create_consultation(db, payload))


@router.post("/{consultation_id}/reply", response_model=schemas.ConsultationRead)
def reply_consultation(
    consultation_id: int,
    payload: schemas.ConsultationReply,
    _current_user: AuthenticatedUser = Depends(require_admin),
    db: Session = Depends(get_db),
):
    ticket = crud.get_consultation(db, consultation_id)
    if ticket is None:
        raise HTTPException(status_code=404, detail="Consultation ticket not found")
    return _to_read(crud.reply_consultation(db, ticket, payload))


@router.patch("/{consultation_id}/status", response_model=schemas.ConsultationRead)
def update_consultation_status(
    consultation_id: int,
    payload: schemas.ConsultationStatusUpdate,
    _current_user: AuthenticatedUser = Depends(require_admin),
    db: Session = Depends(get_db),
):
    ticket = crud.get_consultation(db, consultation_id)
    if ticket is None:
        raise HTTPException(status_code=404, detail="Consultation ticket not found")
    return _to_read(crud.update_consultation_status(db, ticket, payload))
