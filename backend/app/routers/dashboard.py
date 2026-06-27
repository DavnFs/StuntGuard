from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, joinedload

from app import models, schemas
from app.database import get_db
from app.services.authentication import AuthenticatedUser, require_current_user


router = APIRouter(prefix="/parent", tags=["parent-dashboard"])


@router.get("/dashboard", response_model=schemas.ParentDashboardResponse)
def parent_dashboard(
    current_user: AuthenticatedUser = Depends(require_current_user),
    db: Session = Depends(get_db),
):
    children = (
        db.query(models.Child)
        .options(joinedload(models.Child.measurements))
        .order_by(models.Child.created_at.desc())
        .all()
    )

    children_with_measurements = []
    for child in children:
        sorted_measurements = sorted(child.measurements, key=lambda m: m.age_month)
        briefs = [
            schemas.MeasurementBrief(
                id=m.id,
                measurement_date=m.measurement_date,
                age_month=m.age_month,
                height_cm=m.height_cm,
                weight_kg=m.weight_kg,
                kms_status=m.kms_status,
                predicted_status=m.predicted_status,
                created_at=m.created_at,
            )
            for m in sorted_measurements
        ]
        child_read = schemas.ChildWithMeasurements(
            id=child.id,
            name=child.name,
            gender=child.gender,
            birth_date=child.birth_date,
            parent_name=child.parent_name,
            address=child.address,
            posyandu_area=child.posyandu_area,
            created_at=child.created_at,
            measurements=briefs,
        )
        children_with_measurements.append(child_read)

    return schemas.ParentDashboardResponse(
        parent_name=current_user.name,
        children=children_with_measurements,
    )
