from collections import OrderedDict

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db


router = APIRouter(prefix="/dashboard", tags=["dashboard"])

STATUS_ORDER = ["severely stunted", "stunted", "normal", "tall"]
GENDER_ORDER = ["male", "female"]


@router.get("/summary", response_model=schemas.DashboardSummary)
def dashboard_summary(db: Session = Depends(get_db)):
    total_children = db.query(models.Child).count()
    total_measurements = db.query(models.Measurement).count()

    status_counts = OrderedDict((status, 0) for status in STATUS_ORDER)
    for status, count in (
        db.query(models.Measurement.predicted_status, func.count(models.Measurement.id))
        .group_by(models.Measurement.predicted_status)
        .all()
    ):
        status_counts[status] = count

    stunting_count = status_counts["severely stunted"] + status_counts["stunted"]
    stunting_percentage = round((stunting_count / total_measurements) * 100, 2) if total_measurements else 0.0

    gender_counts = OrderedDict((gender, 0) for gender in GENDER_ORDER)
    for gender, count in (
        db.query(models.Child.gender, func.count(models.Child.id)).group_by(models.Child.gender).all()
    ):
        gender_counts[gender] = count

    status_by_gender_map = {
        gender: {"gender": gender, **{status: 0 for status in STATUS_ORDER}} for gender in GENDER_ORDER
    }
    for gender, status, count in (
        db.query(models.Child.gender, models.Measurement.predicted_status, func.count(models.Measurement.id))
        .join(models.Measurement, models.Measurement.child_id == models.Child.id)
        .group_by(models.Child.gender, models.Measurement.predicted_status)
        .all()
    ):
        if gender not in status_by_gender_map:
            status_by_gender_map[gender] = {"gender": gender, **{item: 0 for item in STATUS_ORDER}}
        status_by_gender_map[gender][status] = count

    area_counts = OrderedDict()
    for area, count in (
        db.query(models.Child.posyandu_area, func.count(models.Child.id))
        .group_by(models.Child.posyandu_area)
        .order_by(func.count(models.Child.id).desc())
        .all()
    ):
        area_counts[area or "Tidak diisi"] = count

    monthly_trend = [
        {"month": month, "count": count}
        for month, count in (
            db.query(func.strftime("%Y-%m", models.Measurement.measurement_date), func.count(models.Measurement.id))
            .group_by(func.strftime("%Y-%m", models.Measurement.measurement_date))
            .order_by(func.strftime("%Y-%m", models.Measurement.measurement_date))
            .all()
        )
    ]

    recent_rows = (
        db.query(models.Measurement, models.Child)
        .join(models.Child, models.Measurement.child_id == models.Child.id)
        .filter(models.Measurement.risk_level == "high")
        .order_by(models.Measurement.measurement_date.desc(), models.Measurement.created_at.desc())
        .limit(8)
        .all()
    )
    recent_high_risk_cases = [
        schemas.RecentHighRiskCase(
            child_id=child.id,
            child_name=child.name,
            posyandu_area=child.posyandu_area,
            measurement_date=measurement.measurement_date,
            age_month=measurement.age_month,
            height_cm=measurement.height_cm,
            predicted_status=measurement.predicted_status,
            risk_level=measurement.risk_level,
        )
        for measurement, child in recent_rows
    ]

    return schemas.DashboardSummary(
        total_children=total_children,
        total_measurements=total_measurements,
        count_by_nutrition_status=dict(status_counts),
        stunting_percentage=stunting_percentage,
        count_by_gender=dict(gender_counts),
        status_by_gender=list(status_by_gender_map.values()),
        count_by_posyandu_area=dict(area_counts),
        monthly_measurement_trend=monthly_trend,
        recent_high_risk_cases=recent_high_risk_cases,
    )
