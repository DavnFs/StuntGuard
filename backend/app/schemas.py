from datetime import date, datetime
from typing import Any, Dict, List, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field


Gender = Literal["male", "female"]
NutritionStatus = Literal["severely stunted", "stunted", "normal", "tall"]
RiskLevel = Literal["high", "medium", "low", "monitor"]
ModelMode = Literal["full-growth-model", "height-only-fallback-model", "rule-based-fallback"]
UserRole = Literal["parent", "admin"]
ConsultationStatus = Literal["pending", "answered", "closed"]


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
    weight_kg: float = Field(..., gt=1, lt=60)


class PredictionSummary(BaseModel):
    title: str
    description: str
    next_action: str


class GrowthComparison(BaseModel):
    tb_normal: Optional[float]
    bb_normal: Optional[float]
    persentase_tb: Optional[float]
    persentase_bb: Optional[float]
    tb_explanation: str
    bb_explanation: str
    overall_explanation: str
    warning: Optional[str]


class NutritionRecommendation(BaseModel):
    description: str
    mpasi_phase: str
    food: List[str]
    frequency: str
    supplements: str
    notes: str
    calories_target: str
    protein_target: str
    fluid_target: str


class PredictionResponse(BaseModel):
    nutrition_status: NutritionStatus
    risk_level: RiskLevel
    confidence: Optional[float]
    summary: PredictionSummary
    comparison: GrowthComparison
    nutrition_recommendation: NutritionRecommendation
    recommendation: str
    growth_notes: Dict[str, Optional[float]]
    technical_details: Dict[str, Any]
    model_mode: ModelMode
    disclaimer: str


class MeasurementCreate(BaseModel):
    measurement_date: date
    age_month: int = Field(..., ge=0, le=60)
    height_cm: float = Field(..., gt=20, lt=150)
    weight_kg: float = Field(..., gt=1, lt=60)


class MeasurementRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    child_id: int
    measurement_date: date
    age_month: int
    height_cm: float
    weight_kg: Optional[float]
    predicted_status: NutritionStatus
    risk_level: RiskLevel
    confidence: Optional[float]
    recommendation: str
    model_mode: ModelMode
    created_at: datetime


class RecentHighRiskCase(BaseModel):
    child_id: int
    child_name: str
    posyandu_area: Optional[str]
    measurement_date: date
    age_month: int
    height_cm: float
    weight_kg: Optional[float]
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
    average_height_by_age_group: List[Dict[str, Any]]
    average_weight_by_age_group: List[Dict[str, Any]]
    high_risk_children_count: int


class ChatGrowthComparison(BaseModel):
    tb_explanation: Optional[str] = None
    bb_explanation: Optional[str] = None
    overall_explanation: Optional[str] = None
    warning: Optional[str] = None


class ChatNutritionRecommendation(BaseModel):
    description: Optional[str] = None
    mpasi_phase: Optional[str] = None
    food: List[str] = []
    frequency: Optional[str] = None
    supplements: Optional[str] = None
    notes: Optional[str] = None


class ChatChildContext(BaseModel):
    age_month: Optional[int] = Field(default=None, ge=0, le=60)
    gender: Optional[str] = None
    height_cm: Optional[float] = Field(default=None, gt=20, lt=150)
    weight_kg: Optional[float] = Field(default=None, gt=1, lt=60)
    nutrition_status: Optional[str] = None
    risk_level: Optional[str] = None
    recommendation: Optional[str] = None
    comparison: Optional[ChatGrowthComparison] = None
    nutrition_recommendation: Optional[ChatNutritionRecommendation] = None


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=500)
    child_context: Optional[ChatChildContext] = None
    child_id: Optional[int] = None


class ChatResponse(BaseModel):
    reply: str
    source: str
    safety_level: str
    suggested_actions: List[str] = []


class ModelInfoResponse(BaseModel):
    active_model_mode: ModelMode
    model_name: str
    metrics: Optional[Dict[str, Any]]
    trained_features: List[str]
    engineered_features: List[str]
    features: List[str]
    labels: List[str]
    feature_importance: Optional[List[Dict[str, Any]]]
    training_dataset_info: Dict[str, Any]
    weight_available_during_training: bool
    limitations: List[str]
    disclaimer: str


class LoginRequest(BaseModel):
    email: str = Field(..., min_length=3, max_length=160)
    password: str = Field(..., min_length=1, max_length=160)


class LoginResponse(BaseModel):
    token: str
    email: str
    name: str
    role: UserRole


class ConsultationCreate(BaseModel):
    child_id: int
    subject: str = Field(..., min_length=3, max_length=160)
    message: str = Field(..., min_length=5, max_length=2000)
    latest_measurement_id: Optional[int] = None


class ConsultationReply(BaseModel):
    reply: str = Field(..., min_length=3, max_length=2000)
    status: ConsultationStatus = "answered"


class ConsultationStatusUpdate(BaseModel):
    status: ConsultationStatus


class ConsultationRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    child_id: int
    child_name: str
    subject: str
    message: str
    latest_measurement_id: Optional[int]
    status: ConsultationStatus
    admin_reply: Optional[str]
    created_at: datetime
    updated_at: datetime
