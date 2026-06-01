import type { NutritionStatus, RiskLevel } from "../types";

const statusStyles: Record<NutritionStatus, string> = {
  "severely stunted": "bg-red-100 text-red-700 ring-red-200",
  stunted: "bg-amber-100 text-amber-700 ring-amber-200",
  normal: "bg-care-100 text-care-700 ring-care-200",
  tall: "bg-brand-100 text-brand-700 ring-brand-200",
};

const riskStyles: Record<RiskLevel, string> = {
  high: "bg-red-100 text-red-700 ring-red-200",
  medium: "bg-amber-100 text-amber-700 ring-amber-200",
  low: "bg-care-100 text-care-700 ring-care-200",
  monitor: "bg-brand-100 text-brand-700 ring-brand-200",
};

export const statusLabel: Record<NutritionStatus, string> = {
  "severely stunted": "Severely Stunted",
  stunted: "Stunted",
  normal: "Normal",
  tall: "Tall",
};

export const riskLabel: Record<RiskLevel, string> = {
  high: "Risiko Tinggi",
  medium: "Risiko Sedang",
  low: "Risiko Rendah",
  monitor: "Pantau",
};

interface StatusBadgeProps {
  value: NutritionStatus | RiskLevel;
  type?: "status" | "risk";
}

export default function StatusBadge({ value, type = "status" }: StatusBadgeProps) {
  const styles =
    type === "status"
      ? statusStyles[value as NutritionStatus]
      : riskStyles[value as RiskLevel];
  const label =
    type === "status"
      ? statusLabel[value as NutritionStatus]
      : riskLabel[value as RiskLevel];

  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${styles}`}>
      {label}
    </span>
  );
}
