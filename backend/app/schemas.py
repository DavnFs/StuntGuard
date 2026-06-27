from datetime import date, datetime
from typing import Any, Dict, List, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator


Gender = Literal["male", "female"]
NutritionStatus = Literal["severely stunted", "stunted", "normal", "tall"]
RiskLevel = Literal["high", "medium", "low", "monitor"]
ModelMode = Literal["full-growth-model", "height-only-fallback-model", "rule-based-fallback"]
UserRole = Literal["parent", "guest"]
ConsultationStatus = Literal["pending", "answered", "closed"]
KmsStatus = Literal["Gizi Kurang", "Normal", "Gizi Lebih", "Obesitas"]


def _strip_required(value: str) -> str:
    stripped = value.strip()
    if not stripped:
        raise ValueError("must not be blank")
    return stripped


def _strip_optional(value: Optional[str]) -> Optional[str]:
    if value is None:
        return None
    stripped = value.strip()
    return stripped or None


class ChildBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=120)
    gender: Gender
    birth_date: date
    parent_name: Optional[str] = Field(default=None, max_length=120)
    address: Optional[str] = Field(default=None, max_length=500)
    posyandu_area: Optional[str] = Field(default=None, max_length=120)

    @field_validator("name", mode="before")
    @classmethod
    def strip_name(cls, value: str) -> str:
        return _strip_required(value)

    @field_validator("parent_name", "address", "posyandu_area", mode="before")
    @classmethod
    def strip_optional_fields(cls, value: Optional[str]) -> Optional[str]:
        return _strip_optional(value)

    @field_validator("birth_date")
    @classmethod
    def reject_future_birth_date(cls, value: date) -> date:
        if value > date.today():
            raise ValueError("must not be in the future")
        return value


class ChildCreate(ChildBase):
    pass


class ChildUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=120)
    gender: Optional[Gender] = None
    birth_date: Optional[date] = None
    parent_name: Optional[str] = Field(default=None, max_length=120)
    address: Optional[str] = Field(default=None, max_length=500)
    posyandu_area: Optional[str] = Field(default=None, max_length=120)

    @field_validator("name", mode="before")
    @classmethod
    def strip_name(cls, value: Optional[str]) -> Optional[str]:
        return _strip_required(value) if value is not None else None

    @field_validator("parent_name", "address", "posyandu_area", mode="before")
    @classmethod
    def strip_optional_fields(cls, value: Optional[str]) -> Optional[str]:
        return _strip_optional(value)

    @field_validator("birth_date")
    @classmethod
    def reject_future_birth_date(cls, value: Optional[date]) -> Optional[date]:
        if value is not None and value > date.today():
            raise ValueError("must not be in the future")
        return value


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

    @field_validator("measurement_date")
    @classmethod
    def reject_future_measurement_date(cls, value: date) -> date:
        if value > date.today():
            raise ValueError("must not be in the future")
        return value


class MeasurementRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    child_id: int
    measurement_date: date
    age_month: int
    height_cm: float
    weight_kg: Optional[float]
    kms_status: str
    predicted_status: NutritionStatus
    risk_level: RiskLevel
    confidence: Optional[float]
    recommendation: str
    model_mode: ModelMode
    created_at: datetime




class ChatGrowthComparison(BaseModel):
    tb_explanation: Optional[str] = Field(default=None, max_length=1000)
    bb_explanation: Optional[str] = Field(default=None, max_length=1000)
    overall_explanation: Optional[str] = Field(default=None, max_length=1000)
    warning: Optional[str] = Field(default=None, max_length=1000)


class ChatNutritionRecommendation(BaseModel):
    description: Optional[str] = Field(default=None, max_length=1000)
    mpasi_phase: Optional[str] = Field(default=None, max_length=500)
    food: List[str] = Field(default_factory=list, max_length=8)
    frequency: Optional[str] = Field(default=None, max_length=500)
    supplements: Optional[str] = Field(default=None, max_length=500)
    notes: Optional[str] = Field(default=None, max_length=1000)

    @field_validator("food")
    @classmethod
    def limit_food_item_lengths(cls, value: List[str]) -> List[str]:
        return [_strip_required(item)[:300] for item in value]


class ChatChildContext(BaseModel):
    age_month: Optional[int] = Field(default=None, ge=0, le=60)
    gender: Optional[Gender] = None
    height_cm: Optional[float] = Field(default=None, gt=20, lt=150)
    weight_kg: Optional[float] = Field(default=None, gt=1, lt=60)
    nutrition_status: Optional[NutritionStatus] = None
    risk_level: Optional[RiskLevel] = None
    recommendation: Optional[str] = Field(default=None, max_length=1000)
    comparison: Optional[ChatGrowthComparison] = None
    nutrition_recommendation: Optional[ChatNutritionRecommendation] = None


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=500)
    child_context: Optional[ChatChildContext] = None
    child_id: Optional[int] = Field(default=None, gt=0)

    @field_validator("message", mode="before")
    @classmethod
    def strip_message(cls, value: str) -> str:
        return _strip_required(value)


class ChatResponse(BaseModel):
    reply: str
    source: str
    safety_level: str
    suggested_actions: List[str] = Field(default_factory=list)


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

    @field_validator("email", mode="before")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        return _strip_required(value).lower()


class LoginResponse(BaseModel):
    token: str
    expires_at: int
    email: str
    name: str
    role: UserRole


class ConsultationCreate(BaseModel):
    child_id: int = Field(..., gt=0)
    subject: str = Field(..., min_length=3, max_length=160)
    message: str = Field(..., min_length=5, max_length=2000)
    latest_measurement_id: Optional[int] = Field(default=None, gt=0)

    @field_validator("subject", "message", mode="before")
    @classmethod
    def strip_text_fields(cls, value: str) -> str:
        return _strip_required(value)





class ConsultationRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    child_id: int
    child_name: str
    subject: str
    message: str
    latest_measurement_id: Optional[int]
    status: ConsultationStatus
    created_at: datetime
    updated_at: datetime


class MeasurementBrief(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    measurement_date: date
    age_month: int
    height_cm: float
    weight_kg: Optional[float]
    kms_status: str
    predicted_status: NutritionStatus
    created_at: datetime


class ChildWithMeasurements(ChildRead):
    measurements: List[MeasurementBrief] = []


class ParentDashboardResponse(BaseModel):
    parent_name: str
    children: List[ChildWithMeasurements]
