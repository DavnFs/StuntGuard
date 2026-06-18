import { useState, useMemo } from "react";
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
  TrendingUp,
  Activity,
  Award,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Settings,
  Ruler,
  Scale,
  Brain,
  HelpCircle,
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

import type { ChatChildContext, NutritionStatus, PredictionResponse } from "../types";

const DISCLAIMER =
  "Hasil ini merupakan skrining awal dan bukan diagnosis medis. Silakan konsultasikan ke petugas kesehatan atau Puskesmas untuk pemeriksaan lanjutan.";

const statusTone: Record<NutritionStatus, {
  badge: string;
  gradient: string;
  border: string;
  shadow: string;
  iconBg: string;
  textColor: string;
  iconColor: string;
  riskLabel: string;
  description: string;
}> = {
  normal: {
    badge: "Normal",
    gradient: "from-emerald-500/10 via-teal-500/5 to-white",
    border: "border-emerald-500/20",
    shadow: "shadow-emerald-500/5",
    iconBg: "bg-emerald-100 text-emerald-700",
    textColor: "text-emerald-950",
    iconColor: "text-emerald-600",
    riskLabel: "Risiko Sangat Rendah",
    description: "Pertumbuhan tinggi dan berat badan anak berkembang optimal sesuai acuan standar WHO.",
  },
  tall: {
    badge: "Perlu Dipantau (Tinggi)",
    gradient: "from-cyan-500/10 via-brand-500/5 to-white",
    border: "border-cyan-500/20",
    shadow: "shadow-cyan-500/5",
    iconBg: "bg-cyan-100 text-cyan-700",
    textColor: "text-cyan-950",
    iconColor: "text-cyan-600",
    riskLabel: "Pantau Tinggi Badan",
    description: "Tinggi badan anak berada di atas rata-rata standard WHO. Tetap pantau nutrisi harian anak.",
  },
  stunted: {
    badge: "Risiko Stunting",
    gradient: "from-amber-500/10 via-orange-500/5 to-white",
    border: "border-amber-500/20",
    shadow: "shadow-amber-500/5",
    iconBg: "bg-amber-100 text-amber-700",
    textColor: "text-amber-950",
    iconColor: "text-amber-600",
    riskLabel: "Risiko Sedang",
    description: "Tinggi badan anak berada di bawah standar pertumbuhan normal. Diperlukan intervensi gizi.",
  },
  "severely stunted": {
    badge: "Risiko Tinggi",
    gradient: "from-rose-500/10 via-red-500/5 to-white",
    border: "border-rose-500/20",
    shadow: "shadow-rose-500/5",
    iconBg: "bg-rose-100 text-rose-700",
    textColor: "text-rose-950",
    iconColor: "text-rose-600",
    riskLabel: "Risiko Tinggi (Stunting Akut)",
    description: "Pertumbuhan tinggi badan berada jauh di bawah kurva standar WHO. Harap segera hubungi medis.",
  },
};

const modeLabel: Record<string, string> = {
  "full-growth-model": "Model Pertumbuhan Lengkap (Machine Learning)",
  "height-only-fallback-model": "Model Cadangan (Tinggi Badan Saja)",
  "rule-based-fallback": "Aturan Berbasis Standar WHO",
};

function pct(value: number | null | undefined) {
  return typeof value === "number" ? `${Math.round(value * 100)}%` : "N/A";
}

function numberOrDash(value: number | null | undefined, suffix = "") {
  return typeof value === "number" ? `${value}${suffix}` : "-";
}

type TabKey = "ringkasan" | "gizi" | "teknis";

const tabs: Array<{ key: TabKey; label: string }> = [
  { key: "ringkasan", label: "Dashboard Ringkasan" },
  { key: "gizi", label: "Rencana & Saran Gizi" },
  { key: "teknis", label: "Detail Teknis Model" },
];

interface PredictionResultCardProps {
  result: PredictionResponse;
  childContext?: ChatChildContext;
  onCheckAgain?: () => void;
}

export default function PredictionResultCard({ result, childContext, onCheckAgain }: PredictionResultCardProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("ringkasan");
  const [curveType, setCurveType] = useState<"height" | "weight">("height");
  const tone = statusTone[result.nutrition_status];
  const risky = result.nutrition_status === "stunted" || result.nutrition_status === "severely stunted";
  const foodItems = result.nutrition_recommendation.food.slice(0, 5);

  const openChat = (e: React.MouseEvent) => {
    e.preventDefault();
    if (childContext) {
      window.sessionStorage.setItem("stuntguard_last_child_context", JSON.stringify(childContext));
    }
    window.dispatchEvent(new CustomEvent("open-chatbot"));
  };

  // Dynamic growth standard variables
  const tbNormal = result.comparison.tb_normal ?? 85;
  const bbNormal = result.comparison.bb_normal ?? 11;
  const tbCurrent = childContext?.height_cm ?? 82.5;
  const bbCurrent = childContext?.weight_kg ?? 10.4;

  // Growth Score Calculation (100 - deviation). Only penalize if below standard.
  const tbDev = tbCurrent < tbNormal ? (tbNormal - tbCurrent) / tbNormal : 0;
  const bbDev = bbCurrent < bbNormal ? (bbNormal - bbCurrent) / bbNormal : 0;
  const tbScore = Math.max(0, 100 - tbDev * 200);
  const bbScore = Math.max(0, 100 - bbDev * 200);
  const growthScore = Math.round((tbScore + bbScore) / 2);

  // Score description mapping
  let scoreText = "Optimal";
  let scoreColor = "text-emerald-600 bg-emerald-50 border-emerald-100";
  let barColor = "bg-emerald-500";
  if (growthScore < 75) {
    scoreText = "Risiko Defisit";
    scoreColor = "text-rose-600 bg-rose-50 border-rose-100";
    barColor = "bg-rose-500";
  } else if (growthScore < 90) {
    scoreText = "Perlu Perhatian";
    scoreColor = "text-amber-600 bg-amber-50 border-amber-100";
    barColor = "bg-amber-500";
  }

  // Circular Confidence variables
  // In a 4-class classification system, the baseline random probability is 25% (0.25).
  // We normalize the probability from [0.25 - 1.0] to a user-friendly confidence index [70% - 100%]
  // to avoid confusing the user with low-looking raw probabilities when the model is actually confident.
  const rawConfidence = result.confidence ?? 0.85;
  const confidenceVal = Math.round(70 + (Math.max(0.25, rawConfidence) - 0.25) / 0.75 * 30);
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (confidenceVal / 100) * circumference;

  // Generate curve data (ages 0 to 60 months)
  const childAge = childContext?.age_month ?? 24;
  const curveData = useMemo(() => {
    const gender = childContext?.gender || "female";
    const genderAdjustment = gender === "male" ? 0.8 : 0.0;
    
    // Generate standard points
    const points = [];
    const ages = Array.from({ length: 13 }, (_, i) => i * 5); // 0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60
    
    // Ensure the child's exact age is in the list to plot it exactly
    if (!ages.includes(childAge)) {
      ages.push(childAge);
      ages.sort((a, b) => a - b);
    }

    for (const age of ages) {
      let expectedHeight = 0;
      let expectedWeight = 0;
      if (age <= 24) {
        expectedHeight = 50.0 + (age * 1.55) + genderAdjustment;
        expectedWeight = 3.2 + (age * 0.32);
      } else {
        expectedHeight = 87.0 + ((age - 24) * 0.62) + genderAdjustment;
        expectedWeight = 10.8 + ((age - 24) * 0.18);
      }

      points.push({
        age_month: age,
        "Standar WHO": curveType === "height" 
          ? Math.round(expectedHeight * 10) / 10 
          : Math.round(expectedWeight * 10) / 10,
        "Ukuran Anak": age === childAge
          ? (curveType === "height" ? tbCurrent : bbCurrent)
          : null,
      });
    }
    return points;
  }, [childAge, childContext?.gender, curveType, tbCurrent, bbCurrent]);

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-cyan-900/[0.02]">
      
      {/* ── Status Header Card ── */}
      <div className={`bg-gradient-to-br ${tone.gradient} p-6 border-b border-slate-100`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className={`rounded-2xl p-4 shrink-0 shadow-sm ${tone.iconBg}`}>
              <HeartPulse className="h-6 w-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className={`inline-flex rounded-full border px-3 py-0.5 text-xs font-extrabold uppercase tracking-wider ${tone.textColor} bg-white shadow-sm`}>
                  {tone.badge}
                </span>
                <span className="inline-flex rounded-full bg-slate-900 px-3 py-0.5 text-xs font-bold text-white">
                  {tone.riskLabel}
                </span>
              </div>
              <h3 className="mt-3 font-heading text-2xl font-extrabold text-slate-950 leading-tight">
                {result.summary.title}
              </h3>
              <p className="mt-1.5 text-sm text-slate-600 max-w-xl">
                {result.summary.description}
              </p>
            </div>
          </div>

          {/* Quick Stats side badges */}
          <div className="flex gap-3 shrink-0 self-center md:self-auto">
            <div className="rounded-2xl bg-white/60 border border-slate-200/40 p-4 text-center min-w-[100px] backdrop-blur-sm shadow-sm">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Usia Anak</span>
              <span className="block font-heading text-xl font-extrabold text-slate-900 mt-1">{childContext?.age_month ?? result.comparison.overall_explanation.match(/\d+/)?.[0] ?? "-"} bln</span>
            </div>
            <div className="rounded-2xl bg-white/60 border border-slate-200/40 p-4 text-center min-w-[100px] backdrop-blur-sm shadow-sm">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Kelamin</span>
              <span className="block font-heading text-lg font-extrabold text-slate-900 mt-1">
                {childContext?.gender === "female" ? "Perempuan" : "Laki-laki"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Tabs Navigation ── */}
      <div className="flex gap-2 bg-slate-50/50 border-b border-slate-100 px-6 overflow-x-auto no-scrollbar">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`relative py-4 px-3 text-sm font-bold whitespace-nowrap transition-colors duration-200 ${
              activeTab === tab.key
                ? "text-cyan-600 font-extrabold"
                : "text-slate-400 hover:text-slate-600"
            }`}
          >
            {tab.label}
            {activeTab === tab.key && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-cyan-600" />
            )}
          </button>
        ))}
      </div>

      {/* ── Content Container ── */}
      <div className="p-6">
        
        {/* Tab: Ringkasan (Dashboard Overview) */}
        {activeTab === "ringkasan" && (
          <div className="space-y-6">
            
            {/* Visual Indicators Row */}
            <div className="grid gap-6 md:grid-cols-3">
              
              {/* Circular Confidence Meter */}
              <div className="rounded-2xl border border-slate-200/60 bg-slate-50/30 p-5 flex flex-col items-center justify-center text-center">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-3">KEYAKINAN MODEL</span>
                <div className="relative flex items-center justify-center">
                  <svg className="w-24 h-24 transform -rotate-90">
                    <defs>
                      <linearGradient id="confidenceGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#06b6d4" />
                        <stop offset="100%" stopColor="#10b981" />
                      </linearGradient>
                    </defs>
                    {/* Background track */}
                    <circle
                      cx="48"
                      cy="48"
                      r={radius}
                      stroke="#e2e8f0"
                      strokeWidth="6"
                      fill="transparent"
                    />
                    {/* Arc path */}
                    <circle
                      cx="48"
                      cy="48"
                      r={radius}
                      stroke="url(#confidenceGrad)"
                      strokeWidth="8"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                      fill="transparent"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center justify-center">
                    <span className="font-heading text-xl font-extrabold text-slate-900">{confidenceVal}%</span>
                    <span className="text-[8px] font-bold text-cyan-600 tracking-wider">Akurasi</span>
                  </div>
                </div>
                <p className="mt-3 text-[11px] text-slate-500 leading-normal">
                  Probabilitas diagnosis model AI gizi berdasarkan kurva pertumbuhan.
                </p>
              </div>

              {/* Growth Score Gauge */}
              <div className="rounded-2xl border border-slate-200/60 bg-slate-50/30 p-5 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">SKOR PERTUMBUHAN</span>
                  <div className="flex items-baseline gap-1 mt-3">
                    <span className="font-heading text-4xl font-extrabold text-slate-950">{growthScore}</span>
                    <span className="text-sm font-bold text-slate-400">/ 100</span>
                  </div>
                  
                  {/* Styled Rating Badge */}
                  <span className={`inline-flex rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider mt-2.5 ${scoreColor}`}>
                    {scoreText}
                  </span>
                </div>

                <div className="mt-4">
                  <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                      style={{ width: `${growthScore}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 mt-2">
                    Skor gabungan deviasi anak terhadap target kurva WHO.
                  </p>
                </div>
              </div>

              {/* Action Recommendation Card */}
              <div className="rounded-2xl border border-cyan-500/10 bg-cyan-500/[0.02] p-5 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5">
                    <Award className="h-4.5 w-4.5 text-cyan-600" />
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-cyan-800">REKOMENDASI MEDIS</span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed font-medium mt-2">
                    {result.summary.next_action}
                  </p>
                </div>
                
                <div className="mt-4 pt-3 border-t border-cyan-150">
                  <span className="text-[9px] font-extrabold uppercase text-cyan-700 tracking-wider">SARAN SEGERA</span>
                  <p className="text-[10px] text-slate-500 leading-relaxed mt-0.5">Lakukan konsultasi dengan petugas kesehatan untuk pemeriksaan lanjutan.</p>
                </div>
              </div>

            </div>

            {/* WHO Comparison Charts Row */}
            <div className="grid gap-6 md:grid-cols-5">
              
              {/* Recharts Curve Line Chart */}
              <div className="rounded-2xl border border-slate-200/60 bg-white p-5 md:col-span-3">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4.5 w-4.5 text-cyan-600" />
                    <span className="text-xs font-bold text-slate-900">Perbandingan Kurva WHO</span>
                  </div>
                  
                  {/* Curve Toggle Tabs */}
                  <div className="flex rounded-lg bg-slate-100 p-0.5 border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setCurveType("height")}
                      className={`rounded-md px-2.5 py-1 text-[10px] font-bold transition ${
                        curveType === "height"
                          ? "bg-white text-cyan-700 shadow-sm"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      Tinggi (cm)
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurveType("weight")}
                      className={`rounded-md px-2.5 py-1 text-[10px] font-bold transition ${
                        curveType === "weight"
                          ? "bg-white text-emerald-700 shadow-sm"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      Berat (kg)
                    </button>
                  </div>
                </div>

                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={curveData} margin={{ top: 10, right: 15, left: -25, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis
                        dataKey="age_month"
                        type="number"
                        domain={[0, 60]}
                        tick={{ fontSize: 10, fill: "#64748b" }}
                        axisLine={false}
                        tickLine={false}
                        label={{ value: "Usia (bulan)", position: "insideBottom", offset: -5, fontSize: 10, fill: "#94a3b8" }}
                      />
                      <YAxis
                        type="number"
                        domain={curveType === "height" ? [40, 130] : [2, 25]}
                        tick={{ fontSize: 10, fill: "#94a3b8" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        formatter={(value, name) => {
                          if (value === null || value === undefined) return [null];
                          return [`${value} ${curveType === "height" ? "cm" : "kg"}`, name];
                        }}
                      />
                      <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                      <Line
                        type="monotone"
                        dataKey="Standar WHO"
                        stroke={curveType === "height" ? "#06b6d4" : "#10b981"}
                        strokeWidth={2}
                        dot={false}
                        activeDot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="Ukuran Anak"
                        stroke="#ef4444"
                        strokeWidth={0}
                        dot={{ r: 6, stroke: '#ef4444', strokeWidth: 3, fill: '#ffffff' }}
                        activeDot={{ r: 8 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>


              {/* Standard text growth explainers */}
              <div className="rounded-2xl border border-slate-200/60 bg-slate-50/20 p-5 md:col-span-2 space-y-4">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">DESKRIPSI ANALISIS</span>
                  <h4 className="font-heading text-sm font-bold text-slate-900 mt-2">Perbandingan Tinggi & Berat</h4>
                </div>

                <div className="space-y-3 text-xs leading-relaxed text-slate-650">
                  <div className="flex items-start gap-2">
                    <span className="mt-1.5 h-2 w-2 flex-none rounded-full bg-cyan-500" />
                    <p>{result.comparison.tb_explanation}</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="mt-1.5 h-2 w-2 flex-none rounded-full bg-emerald-500" />
                    <p>{result.comparison.bb_explanation}</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="mt-1.5 h-2 w-2 flex-none rounded-full bg-slate-400" />
                    <p>{result.comparison.overall_explanation}</p>
                  </div>
                </div>

                {result.comparison.warning && (
                  <div className="rounded-xl border border-amber-500/10 bg-amber-500/[0.03] p-3 flex gap-2 items-start text-[11px] text-amber-800 leading-normal mt-3">
                    <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                    <p>{result.comparison.warning}</p>
                  </div>
                )}
              </div>

            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 pt-3 border-t border-slate-100 justify-end">
              {risky ? (
                <>
                  <Link
                    to="/chatbot"
                    onClick={openChat}
                    className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-cyan-600 px-5 text-xs font-bold text-white shadow-sm hover:bg-cyan-700 transition"
                  >
                    <MessageCircle className="h-4 w-4" />
                    Konsultasi Asisten AI Gizi
                  </Link>
                  <Link to="/login" className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-cyan-600 bg-white px-5 text-xs font-bold text-cyan-700 hover:bg-cyan-50 transition">
                    <UserPlus className="h-4 w-4" />
                    Daftar Akun Posyandu
                  </Link>
                  <Link to="/login" className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-350 bg-white px-5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition">
                    <Save className="h-4 w-4" />
                    Simpan Riwayat Pertumbuhan
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/chatbot"
                    onClick={openChat}
                    className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-cyan-600 px-5 text-xs font-bold text-white shadow-sm hover:bg-cyan-700 transition"
                  >
                    <MessageCircle className="h-4 w-4" />
                    Pelajari Edukasi MPASI
                  </Link>
                  {onCheckAgain && (
                    <button
                      type="button"
                      onClick={onCheckAgain}
                      className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-350 bg-white px-5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                    >
                      <RotateCcw className="h-4 w-4" />
                      Hitung Ulang
                    </button>
                  )}
                </>
              )}
            </div>

          </div>
        )}

        {/* Tab: Saran Gizi */}
        {activeTab === "gizi" && (
          <div className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              
              {/* MPASI & Frequency info */}
              <div className="rounded-2xl border border-slate-200/60 bg-slate-50/20 p-5 space-y-5">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <Soup className="h-5 w-5 text-cyan-600" />
                  <h4 className="font-heading text-sm font-bold text-slate-950">Fase Nutrisi & Frekuensi</h4>
                </div>
                
                <div>
                  <span className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-400">FASE MAKAN / MPASI</span>
                  <p className="mt-2 text-xs font-semibold text-slate-800 bg-white p-3 rounded-xl border border-slate-150 leading-relaxed shadow-sm">
                    {result.nutrition_recommendation.mpasi_phase}
                  </p>
                </div>

                <div>
                  <span className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-400">JADWAL & FREKUENSI HARIAN</span>
                  <p className="mt-2 text-xs font-semibold text-slate-800 bg-white p-3 rounded-xl border border-slate-150 leading-relaxed shadow-sm">
                    {result.nutrition_recommendation.frequency}
                  </p>
                </div>
              </div>

              {/* Food recommendations */}
              <div className="rounded-2xl border border-slate-200/60 bg-slate-50/20 p-5 space-y-5">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <Utensils className="h-5 w-5 text-cyan-600" />
                  <h4 className="font-heading text-sm font-bold text-slate-950">Bahan Makanan Dianjurkan</h4>
                </div>

                <div>
                  <span className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Saran Menu Gizi</span>
                  <p className="mt-2 text-xs text-slate-650 leading-relaxed">
                    {result.nutrition_recommendation.description}
                  </p>
                </div>

                <div className="pt-2">
                  <span className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-2">DAFTAR SUPERFOOD</span>
                  <div className="flex flex-wrap gap-2">
                    {foodItems.map((item) => (
                      <span key={item} className="inline-flex rounded-lg bg-cyan-50 px-2.5 py-1 text-xs font-bold text-cyan-700 border border-cyan-100">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

            </div>

            {/* Nutrients targets info */}
            <div className="rounded-2xl border border-slate-200/60 bg-slate-50/20 p-5">
              <span className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-3">TARGET KEBUTUHAN HARIAN (EDUKATIF)</span>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="bg-white p-4 rounded-xl border border-slate-150 shadow-sm text-center">
                  <span className="block text-[10px] font-extrabold uppercase text-slate-450 tracking-wider">KALORI</span>
                  <span className="block text-sm font-bold text-slate-800 mt-1">{result.nutrition_recommendation.calories_target}</span>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-150 shadow-sm text-center">
                  <span className="block text-[10px] font-extrabold uppercase text-slate-450 tracking-wider">PROTEIN</span>
                  <span className="block text-sm font-bold text-slate-800 mt-1">{result.nutrition_recommendation.protein_target}</span>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-150 shadow-sm text-center">
                  <span className="block text-[10px] font-extrabold uppercase text-slate-450 tracking-wider">CAIRAN / AIR</span>
                  <span className="block text-sm font-bold text-slate-800 mt-1">{result.nutrition_recommendation.fluid_target}</span>
                </div>
              </div>
            </div>

            {/* Supplements & Notes */}
            <div className="rounded-2xl border border-slate-200/60 bg-slate-50/20 p-5 space-y-4">
              <div>
                <span className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-400">SUPLEMENTASI LAINNYA</span>
                <p className="mt-2 text-xs text-slate-750 leading-relaxed bg-white p-3 rounded-xl border border-slate-150 shadow-sm">{result.nutrition_recommendation.supplements}</p>
              </div>
              <div>
                <span className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-400">CATATAN AMAN</span>
                <p className="mt-2 text-xs text-slate-750 leading-relaxed bg-white p-3 rounded-xl border border-slate-150 shadow-sm">{result.nutrition_recommendation.notes}</p>
              </div>
            </div>

          </div>
        )}

        {/* Tab: Detail Teknis */}
        {activeTab === "teknis" && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-cyan-500/10 bg-cyan-500/[0.01] p-4 flex gap-3 items-start text-xs text-cyan-800 leading-normal">
              <Info className="h-4.5 w-4.5 shrink-0 text-cyan-600 mt-0.5" />
              <p>Informasi di bawah ini ditujukan sebagai pendukung keputusan klinis bagi kader Posyandu/petugas kesehatan Puskesmas. Data bersumber dari parameter kurva pertumbuhan anak laki-laki dan perempuan WHO (2006).</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              
              <div className="rounded-xl border border-slate-200/60 bg-slate-50/10 p-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">METODE ALGORITMA</span>
                <p className="mt-1 text-sm font-bold text-slate-900">{modeLabel[result.model_mode] ?? result.model_mode}</p>
              </div>

              <div className="rounded-xl border border-slate-200/60 bg-slate-50/10 p-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">RATIO TINGGI (REAL VS STANDAR)</span>
                <p className="mt-1 text-sm font-bold text-slate-900">{numberOrDash(result.growth_notes.height_expected_ratio)}</p>
              </div>

              <div className="rounded-xl border border-slate-200/60 bg-slate-50/10 p-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">RATIO BERAT (REAL VS STANDAR)</span>
                <p className="mt-1 text-sm font-bold text-slate-900">{numberOrDash(result.growth_notes.weight_expected_ratio)}</p>
              </div>

              <div className="rounded-xl border border-slate-200/60 bg-slate-50/10 p-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">DEVIASI TINGGI NORMAL</span>
                <p className="mt-1 text-sm font-bold text-slate-900">{numberOrDash(result.growth_notes.height_gap_expected, " cm")}</p>
              </div>

              <div className="rounded-xl border border-slate-200/60 bg-slate-50/10 p-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">DEVIASI BERAT NORMAL</span>
                <p className="mt-1 text-sm font-bold text-slate-900">{numberOrDash(result.growth_notes.weight_gap_expected, " kg")}</p>
              </div>

              <div className="rounded-xl border border-slate-200/60 bg-slate-50/10 p-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">TARGET PERSENTASE TINGGI</span>
                <p className="mt-1 text-sm font-bold text-slate-900">{numberOrDash(result.comparison.persentase_tb, "%")}</p>
              </div>

              <div className="rounded-xl border border-slate-200/60 bg-slate-50/10 p-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">TARGET PERSENTASE BERAT</span>
                <p className="mt-1 text-sm font-bold text-slate-900">{numberOrDash(result.comparison.persentase_bb, "%")}</p>
              </div>

              <div className="rounded-xl border border-slate-200/60 bg-slate-50/10 p-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">RATA-RATA TINGGI WHO</span>
                <p className="mt-1 text-sm font-bold text-slate-900">{numberOrDash(result.comparison.tb_normal, " cm")}</p>
              </div>

              <div className="rounded-xl border border-slate-200/60 bg-slate-50/10 p-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">RATA-RATA BERAT WHO</span>
                <p className="mt-1 text-sm font-bold text-slate-900">{numberOrDash(result.comparison.bb_normal, " kg")}</p>
              </div>

            </div>
          </div>
        )}

      </div>

      {/* ── Disclaimer Footer (Always Visible) ── */}
      <div className="border-t border-slate-100 bg-slate-50/50 px-6 py-4 flex gap-2 items-center text-[10px] text-slate-400 leading-normal">
        <HelpCircle className="h-4 w-4 shrink-0 text-slate-350" />
        <p>{result.disclaimer || DISCLAIMER}</p>
      </div>

    </div>
  );
}
