from datetime import date, datetime
from typing import Any, Dict, List, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field


Gender = Literal["male", "female"]
NutritionStatus = Literal["severely stunted", "stunted", "normal", "tall"]
RiskLevel = Literal["high", "medium", "low", "monitor"]


class ChildBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=120)
    gender: Gender
    birth_date: date
    parent_name: Optional[str] = Field(default=None, max_length=120)
    address: Optional[str] = None
    posyandu_area: Optional[str] = Field(default=None, max_length=120)


class ChildCreate(ChildBase):
    pass


class ChildUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=120)
    gender: Optional[Gender] = None
    birth_date: Optional[date] = None
    parent_name: Optional[str] = Field(default=None, max_length=120)
    address: Optional[str] = None
    posyandu_area: Optional[str] = Field(default=None, max_length=120)


class ChildRead(ChildBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime


class PredictionRequest(BaseModel):
    age_month: int = Field(..., ge=0, le=60)
    gender: Gender
    height_cm: float = Field(..., gt=20, lt=150)


class PredictionResponse(BaseModel):
    nutrition_status: NutritionStatus
    risk_level: RiskLevel
    confidence: Optional[float]
    recommendation: str
    disclaimer: str


class MeasurementCreate(BaseModel):
    measurement_date: date
    age_month: int = Field(..., ge=0, le=60)
    height_cm: float = Field(..., gt=20, lt=150)


class MeasurementRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    child_id: int
    measurement_date: date
    age_month: int
    height_cm: float
    predicted_status: NutritionStatus
    risk_level: RiskLevel
    confidence: Optional[float]
    recommendation: str
    created_at: datetime


class RecentHighRiskCase(BaseModel):
    child_id: int
    child_name: str
    posyandu_area: Optional[str]
    measurement_date: date
    age_month: int
    height_cm: float
    predicted_status: NutritionStatus
    risk_level: RiskLevel


class DashboardSummary(BaseModel):
    total_children: int
    total_measurements: int
    count_by_nutrition_status: Dict[str, int]
    stunting_percentage: float
    count_by_gender: Dict[str, int]
    status_by_gender: List[Dict[str, Any]]
    count_by_posyandu_area: Dict[str, int]
    monthly_measurement_trend: List[Dict[str, Any]]
    recent_high_risk_cases: List[RecentHighRiskCase]


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=1000)


class ChatResponse(BaseModel):
    reply: str
    source: Literal["rule-based", "llm"]


class ModelInfoResponse(BaseModel):
    model_name: str
    metrics: Optional[Dict[str, Any]]
    features: List[str]
    labels: List[str]
    feature_importance: Optional[List[Dict[str, Any]]]
    disclaimer: str
