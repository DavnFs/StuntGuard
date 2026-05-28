export type Gender = "male" | "female";
export type NutritionStatus = "severely stunted" | "stunted" | "normal" | "tall";
export type RiskLevel = "high" | "medium" | "low" | "monitor";

export interface Child {
  id: number;
  name: string;
  gender: Gender;
  birth_date: string;
  parent_name?: string | null;
  address?: string | null;
  posyandu_area?: string | null;
  created_at: string;
}

export interface ChildInput {
  name: string;
  gender: Gender;
  birth_date: string;
  parent_name?: string;
  address?: string;
  posyandu_area?: string;
}

export interface PredictionRequest {
  age_month: number;
  gender: Gender;
  height_cm: number;
}

export interface PredictionResponse {
  nutrition_status: NutritionStatus;
  risk_level: RiskLevel;
  confidence: number | null;
  recommendation: string;
  disclaimer: string;
}

export interface MeasurementInput {
  measurement_date: string;
  age_month: number;
  height_cm: number;
}

export interface Measurement {
  id: number;
  child_id: number;
  measurement_date: string;
  age_month: number;
  height_cm: number;
  predicted_status: NutritionStatus;
  risk_level: RiskLevel;
  confidence: number | null;
  recommendation: string;
  created_at: string;
}

export interface RecentHighRiskCase {
  child_id: number;
  child_name: string;
  posyandu_area?: string | null;
  measurement_date: string;
  age_month: number;
  height_cm: number;
  predicted_status: NutritionStatus;
  risk_level: RiskLevel;
}

export interface DashboardSummary {
  total_children: number;
  total_measurements: number;
  count_by_nutrition_status: Record<NutritionStatus, number>;
  stunting_percentage: number;
  count_by_gender: Record<Gender, number>;
  status_by_gender: Array<Record<string, number | string>>;
  count_by_posyandu_area: Record<string, number>;
  monthly_measurement_trend: Array<{ month: string; count: number }>;
  recent_high_risk_cases: RecentHighRiskCase[];
}

export interface ChatResponse {
  reply: string;
  source: "rule-based" | "llm";
}

export interface ModelInfo {
  model_name: string;
  metrics: Record<string, unknown> | null;
  features: string[];
  labels: string[];
  feature_importance: Array<{ feature: string; importance: number }> | null;
  disclaimer: string;
}
