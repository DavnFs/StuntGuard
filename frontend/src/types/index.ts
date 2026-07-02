export type Gender = "male" | "female";
export type NutritionStatus = "severely stunted" | "stunted" | "normal" | "tall";
export type RiskLevel = "high" | "medium" | "low" | "monitor";
export type ModelMode = "full-growth-model" | "height-only-fallback-model" | "rule-based-fallback";
export type UserRole = "parent" | "guest";
export type ConsultationStatus = "pending" | "answered" | "closed";
export type KmsStatus = "Gizi Kurang" | "Normal" | "Gizi Lebih" | "Obesitas";

export interface Child {
  id: number;
  name: string;
  gender: Gender;
  birth_date: string;
  parent_name?: string | null;
  address?: string | null;
  created_at: string;
}

export interface ChildInput {
  name: string;
  gender: Gender;
  birth_date: string;
  parent_name?: string;
  address?: string;
}

export interface PredictionRequest {
  age_month: number;
  gender: Gender;
  height_cm: number;
  weight_kg: number;
}

export interface PredictionResponse {
  nutrition_status: NutritionStatus;
  risk_level: RiskLevel;
  confidence: number | null;
  summary: {
    title: string;
    description: string;
    next_action: string;
  };
  comparison: {
    tb_normal: number | null;
    bb_normal: number | null;
    persentase_tb: number | null;
    persentase_bb: number | null;
    tb_explanation: string;
    bb_explanation: string;
    overall_explanation: string;
    warning: string | null;
  };
  nutrition_recommendation: {
    description: string;
    mpasi_phase: string;
    food: string[];
    frequency: string;
    supplements: string;
    notes: string;
    calories_target: string;
    protein_target: string;
    fluid_target: string;
  };
  recommendation: string;
  growth_notes: {
    height_gap_expected: number | null;
    height_expected_ratio: number | null;
    weight_gap_expected: number | null;
    weight_expected_ratio: number | null;
  };
  technical_details: Record<string, unknown>;
  model_mode: ModelMode;
  disclaimer: string;
}

export interface MeasurementInput {
  measurement_date: string;
  age_month: number;
  height_cm: number;
  weight_kg: number;
}

export interface Measurement {
  id: number;
  child_id: number;
  measurement_date: string;
  age_month: number;
  height_cm: number;
  weight_kg: number | null;
  kms_status: KmsStatus;
  predicted_status: NutritionStatus;
  risk_level: RiskLevel;
  confidence: number | null;
  recommendation: string;
  model_mode: ModelMode;
  created_at: string;
}



export interface ChatResponse {
  reply: string;
  source: "rule-based" | "llm" | "guardrail" | string;
  safety_level: string;
  suggested_actions: string[];
}

export interface ChatChildContext {
  age_month?: number | null;
  gender?: Gender | string | null;
  height_cm?: number | null;
  weight_kg?: number | null;
  nutrition_status?: NutritionStatus | string | null;
  risk_level?: RiskLevel | string | null;
  recommendation?: string | null;
  comparison?: {
    tb_explanation?: string | null;
    bb_explanation?: string | null;
    overall_explanation?: string | null;
    warning?: string | null;
  } | null;
  nutrition_recommendation?: {
    description?: string | null;
    mpasi_phase?: string | null;
    food?: string[];
    frequency?: string | null;
    supplements?: string | null;
    notes?: string | null;
  } | null;
}

export interface ModelInfo {
  active_model_mode: ModelMode;
  model_name: string;
  metrics: Record<string, unknown> | null;
  trained_features: string[];
  engineered_features: string[];
  features: string[];
  labels: string[];
  feature_importance: Array<{ feature: string; importance: number }> | null;
  training_dataset_info: Record<string, unknown>;
  weight_available_during_training: boolean;
  limitations: string[];
  disclaimer: string;
}

export interface AuthUser {
  token: string;
  expires_at: number;
  email: string;
  name: string;
  role: UserRole;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface Consultation {
  id: number;
  child_id: number;
  child_name: string;
  subject: string;
  message: string;
  latest_measurement_id?: number | null;
  status: ConsultationStatus;
  admin_reply?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ConsultationInput {
  child_id: number;
  subject: string;
  message: string;
  latest_measurement_id?: number | null;
}

export interface MeasurementBrief {
  id: number;
  measurement_date: string;
  age_month: number;
  height_cm: number;
  weight_kg: number | null;
  kms_status: KmsStatus;
  predicted_status: NutritionStatus;
  created_at: string;
}

export interface ChildWithMeasurements extends Child {
  measurements: MeasurementBrief[];
}

export interface ParentDashboardResponse {
  parent_name: string;
  children: ChildWithMeasurements[];
}
