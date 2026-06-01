from collections import OrderedDict

from fastapi import APIRouter, Depends
from sqlalchemy import Integer, cast, func
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db
from app.services.authentication import AuthenticatedUser, require_admin


router = APIRouter(prefix="/dashboard", tags=["dashboard"])

STATUS_ORDER = ["severely stunted", "stunted", "normal", "tall"]
GENDER_ORDER = ["male", "female"]


@router.get("/summary", response_model=schemas.DashboardSummary)
def dashboard_summary(
    _current_user: AuthenticatedUser = Depends(require_admin),
    db: Session = Depends(get_db),
):
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
            weight_kg=measurement.weight_kg,
            predicted_status=measurement.predicted_status,
            risk_level=measurement.risk_level,
        )
        for measurement, child in recent_rows
    ]

    high_risk_children_count = (
        db.query(models.Measurement.child_id)
        .filter(models.Measurement.risk_level == "high")
        .distinct()
        .count()
    )

    age_group_start = cast(models.Measurement.age_month / 12, Integer) * 12
    age_group_rows = (
        db.query(
            age_group_start.label("start"),
            func.avg(models.Measurement.height_cm).label("average_height"),
            func.avg(models.Measurement.weight_kg).label("average_weight"),
        )
        .group_by(age_group_start)
        .order_by(age_group_start)
        .all()
    )

    average_height_by_age_group = [
        {
            "age_group": f"{start}-{min(start + 11, 60)} bulan",
            "average_height_cm": round(float(average_height), 2),
        }
        for start, average_height, _average_weight in age_group_rows
        if average_height is not None
    ]
    average_weight_by_age_group = [
        {
            "age_group": f"{start}-{min(start + 11, 60)} bulan",
            "average_weight_kg": round(float(average_weight), 2),
        }
        for start, _average_height, average_weight in age_group_rows
        if average_weight is not None
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
        average_height_by_age_group=average_height_by_age_group,
        average_weight_by_age_group=average_weight_by_age_group,
        high_risk_children_count=high_risk_children_count,
    )
