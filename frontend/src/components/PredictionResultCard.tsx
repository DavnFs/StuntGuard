import {
  ChevronDown,
  HeartPulse,
  Info,
  MessageCircle,
  RotateCcw,
  Save,
  Soup,
  UserPlus,
  Utensils,
} from "lucide-react";
import { Link } from "react-router-dom";

import type { ChatChildContext, NutritionStatus, PredictionResponse } from "../types";

const DISCLAIMER =
  "Hasil ini merupakan skrining awal dan bukan diagnosis medis. Silakan konsultasikan ke petugas kesehatan atau Puskesmas untuk pemeriksaan lanjutan.";

const statusTone: Record<NutritionStatus, { badge: string; tone: string; iconTone: string }> = {
  normal: {
    badge: "Normal",
    tone: "border-care-200 bg-care-50 text-care-800",
    iconTone: "bg-care-100 text-care-700",
  },
  tall: {
    badge: "Perlu Dipantau",
    tone: "border-brand-200 bg-brand-50 text-brand-800",
    iconTone: "bg-brand-100 text-brand-700",
  },
  stunted: {
    badge: "Risiko Stunting",
    tone: "border-amber-200 bg-amber-50 text-amber-800",
    iconTone: "bg-amber-100 text-amber-700",
  },
  "severely stunted": {
    badge: "Risiko Tinggi",
    tone: "border-red-200 bg-red-50 text-red-800",
    iconTone: "bg-red-100 text-red-700",
  },
};

const modeLabel: Record<string, string> = {
  "full-growth-model": "Full growth model",
  "height-only-fallback-model": "Height-only fallback model",
  "rule-based-fallback": "Rule-based fallback",
};

function pct(value: number | null | undefined) {
  return typeof value === "number" ? `${Math.round(value * 100)}%` : "N/A";
}

function numberOrDash(value: number | null | undefined, suffix = "") {
  return typeof value === "number" ? `${value}${suffix}` : "-";
}

interface PredictionResultCardProps {
  result: PredictionResponse;
  childContext?: ChatChildContext;
  onCheckAgain?: () => void;
}

export default function PredictionResultCard({ result, childContext, onCheckAgain }: PredictionResultCardProps) {
  const tone = statusTone[result.nutrition_status];
  const risky = result.nutrition_status === "stunted" || result.nutrition_status === "severely stunted";
  const foodItems = result.nutrition_recommendation.food.slice(0, 5);

  return (
    <div className={`rounded-2xl border p-5 shadow-sm ${tone.tone}`}>
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex gap-3">
          <div className={`mt-1 rounded-2xl p-3 ${tone.iconTone}`}>
            <HeartPulse className="h-6 w-6" />
          </div>
          <div>
            <span className="inline-flex rounded-full bg-white/80 px-3 py-1 text-xs font-bold">
              {tone.badge}
            </span>
            <h3 className="mt-3 text-2xl font-bold leading-tight text-slate-950">
              {result.summary.title}
            </h3>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-700">
              {result.summary.description}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_1fr]">
        <div className="rounded-xl bg-white/85 p-4">
          <p className="text-sm font-bold text-slate-950">Langkah berikutnya</p>
          <p className="mt-2 text-sm leading-6 text-slate-700">{result.summary.next_action}</p>
        </div>
        <div className="rounded-xl bg-white/85 p-4">
          <p className="text-sm font-bold text-slate-950">Perbandingan pertumbuhan</p>
          <ul className="mt-2 space-y-1 text-sm leading-6 text-slate-700">
            <li>{result.comparison.tb_explanation}</li>
            <li>{result.comparison.bb_explanation}</li>
            <li>{result.comparison.overall_explanation}</li>
          </ul>
          {result.comparison.warning ? (
            <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-800">
              {result.comparison.warning}
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-xl bg-white/85 p-4">
          <div className="flex items-center gap-2">
            <Soup className="h-5 w-5 text-brand-700" />
            <p className="text-sm font-bold text-slate-950">Fase makan / MPASI</p>
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            {result.nutrition_recommendation.mpasi_phase}
          </p>
          <p className="mt-4 text-sm font-bold text-slate-950">Frekuensi makan</p>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            {result.nutrition_recommendation.frequency}
          </p>
        </div>

        <div className="rounded-xl bg-white/85 p-4">
          <div className="flex items-center gap-2">
            <Utensils className="h-5 w-5 text-brand-700" />
            <p className="text-sm font-bold text-slate-950">Saran makanan</p>
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            {result.nutrition_recommendation.description}
          </p>
          <ul className="mt-3 space-y-1 text-sm leading-6 text-slate-700">
            {foodItems.map((item) => (
              <li key={item}>- {item}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-3 rounded-xl bg-white/85 p-4">
        <p className="text-sm font-bold text-slate-950">Catatan aman</p>
        <p className="mt-2 text-sm leading-6 text-slate-700">{result.nutrition_recommendation.notes}</p>
        <p className="mt-2 text-sm leading-6 text-slate-700">{result.nutrition_recommendation.supplements}</p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {risky ? (
          <>
            <Link to="/chatbot" state={{ childContext }} className="inline-flex items-center gap-2 rounded-xl bg-care-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-care-700">
              <MessageCircle className="h-4 w-4" />
              Tanya AI Gizi
            </Link>
            <Link to="/login" className="inline-flex items-center gap-2 rounded-xl border border-care-600 bg-white px-4 py-2.5 text-sm font-bold text-care-700 hover:bg-care-50">
              <UserPlus className="h-4 w-4" />
              Daftar untuk Konsultasi
            </Link>
            <Link to="/login" className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50">
              <Save className="h-4 w-4" />
              Simpan Riwayat Anak
            </Link>
          </>
        ) : (
          <>
            <Link to="/chatbot" state={{ childContext }} className="inline-flex items-center gap-2 rounded-xl bg-care-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-care-700">
              <MessageCircle className="h-4 w-4" />
              Pelajari Edukasi Gizi
            </Link>
            {onCheckAgain ? (
              <button
                type="button"
                onClick={onCheckAgain}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50"
              >
                <RotateCcw className="h-4 w-4" />
                Cek Lagi
              </button>
            ) : null}
          </>
        )}
      </div>

      <p className="mt-5 rounded-xl border border-amber-200 bg-white/80 p-4 text-sm leading-6 text-amber-800">
        {result.disclaimer || DISCLAIMER}
      </p>

      <details className="mt-4 rounded-xl border border-slate-200 bg-white/80 p-4 text-slate-700">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-bold text-slate-950">
          <span className="inline-flex items-center gap-2">
            <Info className="h-4 w-4 text-slate-500" />
            Detail teknis untuk petugas
          </span>
          <ChevronDown className="h-4 w-4 text-slate-500" />
        </summary>
        <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <p className="text-slate-500">Confidence</p>
            <p className="font-semibold text-slate-950">{pct(result.confidence)}</p>
          </div>
          <div>
            <p className="text-slate-500">Model mode</p>
            <p className="font-semibold text-slate-950">{modeLabel[result.model_mode] ?? result.model_mode}</p>
          </div>
          <div>
            <p className="text-slate-500">TB normal</p>
            <p className="font-semibold text-slate-950">{numberOrDash(result.comparison.tb_normal, " cm")}</p>
          </div>
          <div>
            <p className="text-slate-500">BB normal</p>
            <p className="font-semibold text-slate-950">{numberOrDash(result.comparison.bb_normal, " kg")}</p>
          </div>
          <div>
            <p className="text-slate-500">Persentase TB</p>
            <p className="font-semibold text-slate-950">{numberOrDash(result.comparison.persentase_tb, "%")}</p>
          </div>
          <div>
            <p className="text-slate-500">Persentase BB</p>
            <p className="font-semibold text-slate-950">{numberOrDash(result.comparison.persentase_bb, "%")}</p>
          </div>
          <div>
            <p className="text-slate-500">Height gap</p>
            <p className="font-semibold text-slate-950">{numberOrDash(result.growth_notes.height_gap_expected, " cm")}</p>
          </div>
          <div>
            <p className="text-slate-500">Height ratio</p>
            <p className="font-semibold text-slate-950">{numberOrDash(result.growth_notes.height_expected_ratio)}</p>
          </div>
          <div>
            <p className="text-slate-500">Weight gap</p>
            <p className="font-semibold text-slate-950">{numberOrDash(result.growth_notes.weight_gap_expected, " kg")}</p>
          </div>
          <div>
            <p className="text-slate-500">Weight ratio</p>
            <p className="font-semibold text-slate-950">{numberOrDash(result.growth_notes.weight_expected_ratio)}</p>
          </div>
          <div className="sm:col-span-2 lg:col-span-3">
            <p className="text-slate-500">Target edukatif</p>
            <p className="mt-1 font-semibold text-slate-950">{result.nutrition_recommendation.calories_target}</p>
            <p className="mt-1 font-semibold text-slate-950">{result.nutrition_recommendation.protein_target}</p>
            <p className="mt-1 font-semibold text-slate-950">{result.nutrition_recommendation.fluid_target}</p>
          </div>
        </div>
      </details>
    </div>
  );
}
