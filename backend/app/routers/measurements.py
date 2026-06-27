from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import crud, schemas
from app.database import get_db
from app.ml.predict import predict_nutrition
from app.services.authentication import AuthenticatedUser, require_current_user


router = APIRouter(tags=["measurements"])


@router.get("/children/{child_id}/measurements", response_model=list[schemas.MeasurementRead])
def get_child_measurements(
    child_id: int,
    _current_user: AuthenticatedUser = Depends(require_current_user),
    db: Session = Depends(get_db),
):
    child = crud.get_child(db, child_id)
    if child is None:
        raise HTTPException(status_code=404, detail="Child not found")
    return crud.list_child_measurements(db, child_id)


@router.post(
    "/children/{child_id}/measurements",
    response_model=schemas.MeasurementRead,
    status_code=status.HTTP_201_CREATED,
)
def create_child_measurement(
    child_id: int,
    payload: schemas.MeasurementCreate,
    _current_user: AuthenticatedUser = Depends(require_current_user),
    db: Session = Depends(get_db),
):
    child = crud.get_child(db, child_id)
    if child is None:
        raise HTTPException(status_code=404, detail="Child not found")
    prediction = predict_nutrition(
        schemas.PredictionRequest(
            age_month=payload.age_month,
            gender=child.gender,
            height_cm=payload.height_cm,
            weight_kg=payload.weight_kg,
        )
    )
    return crud.create_measurement(db, child_id, payload, prediction)


