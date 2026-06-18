import { useState } from "react";
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

const statusTone: Record<NutritionStatus, { badge: string; tone: string; iconTone: string; accent: string }> = {
  normal: {
    badge: "Normal",
    tone: "border-care-200 bg-care-50 text-care-800",
    iconTone: "bg-care-100 text-care-700",
    accent: "bg-care-600",
  },
  tall: {
    badge: "Perlu Dipantau",
    tone: "border-brand-200 bg-brand-50 text-brand-800",
    iconTone: "bg-brand-100 text-brand-700",
    accent: "bg-brand-600",
  },
  stunted: {
    badge: "Risiko Stunting",
    tone: "border-amber-200 bg-amber-50 text-amber-800",
    iconTone: "bg-amber-100 text-amber-700",
    accent: "bg-amber-600",
  },
  "severely stunted": {
    badge: "Risiko Tinggi",
    tone: "border-red-200 bg-red-50 text-red-800",
    iconTone: "bg-red-100 text-red-700",
    accent: "bg-red-600",
  },
};

const modeLabel: Record<string, string> = {
  "full-growth-model": "Model pertumbuhan lengkap",
  "height-only-fallback-model": "Model cadangan (tinggi badan saja)",
  "rule-based-fallback": "Aturan berbasis standar WHO",
};

function pct(value: number | null | undefined) {
  return typeof value === "number" ? `${Math.round(value * 100)}%` : "N/A";
}

function numberOrDash(value: number | null | undefined, suffix = "") {
  return typeof value === "number" ? `${value}${suffix}` : "-";
}

type TabKey = "ringkasan" | "gizi" | "teknis";

const tabs: Array<{ key: TabKey; label: string }> = [
  { key: "ringkasan", label: "Ringkasan" },
  { key: "gizi", label: "Saran Gizi" },
  { key: "teknis", label: "Detail Teknis" },
];

interface PredictionResultCardProps {
  result: PredictionResponse;
  childContext?: ChatChildContext;
  onCheckAgain?: () => void;
}

export default function PredictionResultCard({ result, childContext, onCheckAgain }: PredictionResultCardProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("ringkasan");
  const tone = statusTone[result.nutrition_status];
  const risky = result.nutrition_status === "stunted" || result.nutrition_status === "severely stunted";
  const foodItems = result.nutrition_recommendation.food.slice(0, 5);

  return (
    <div className={`overflow-hidden rounded-2xl border shadow-sm ${tone.tone}`}>
      {/* ── Header: Status Badge + Title ── */}
      <div className="p-5 pb-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex gap-3">
            <div className={`mt-1 rounded-2xl p-3 ${tone.iconTone}`}>
              <HeartPulse className="h-6 w-6" />
            </div>
            <div>
              <span className="inline-flex rounded-full bg-white/80 px-3 py-1 text-xs font-bold shadow-sm">
                {tone.badge}
              </span>
              <h3 className="mt-3 font-heading text-2xl font-bold leading-tight text-slate-950">
                {result.summary.title}
              </h3>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-700">
                {result.summary.description}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Tab Navigation ── */}
      <div className="flex gap-1 border-y border-black/[0.06] bg-white/50 px-5">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`relative px-4 py-3 text-sm font-bold transition ${
              activeTab === tab.key
                ? "text-slate-950"
                : "text-slate-400 hover:text-slate-600"
            }`}
          >
            {tab.label}
            {activeTab === tab.key ? (
              <span className={`absolute bottom-0 left-2 right-2 h-0.5 rounded-full ${tone.accent}`} />
            ) : null}
          </button>
        ))}
      </div>

      {/* ── Tab Content ── */}
      <div className="p-5">
        {/* Tab: Ringkasan */}
        {activeTab === "ringkasan" ? (
          <div className="space-y-4">
            <div className="rounded-xl bg-white/85 p-4">
              <p className="text-sm font-bold text-slate-950">Langkah berikutnya</p>
              <p className="mt-2 text-sm leading-6 text-slate-700">{result.summary.next_action}</p>
            </div>
            <div className="rounded-xl bg-white/85 p-4">
              <p className="text-sm font-bold text-slate-950">Perbandingan pertumbuhan</p>
              <ul className="mt-2 space-y-1.5 text-sm leading-6 text-slate-700">
                <li className="flex items-start gap-2">
                  <span className="mt-2 h-1.5 w-1.5 flex-none rounded-full bg-brand-500" />
                  {result.comparison.tb_explanation}
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-2 h-1.5 w-1.5 flex-none rounded-full bg-brand-500" />
                  {result.comparison.bb_explanation}
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-2 h-1.5 w-1.5 flex-none rounded-full bg-brand-500" />
                  {result.comparison.overall_explanation}
                </li>
              </ul>
              {result.comparison.warning ? (
                <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-800">
                  {result.comparison.warning}
                </p>
              ) : null}
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-2 pt-2">
              {risky ? (
                <>
                  <Link to="/chatbot" state={{ childContext }} className="inline-flex items-center gap-2 rounded-xl bg-care-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-care-700">
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
                  <Link to="/chatbot" state={{ childContext }} className="inline-flex items-center gap-2 rounded-xl bg-care-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-care-700">
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
          </div>
        ) : null}

        {/* Tab: Saran Gizi */}
        {activeTab === "gizi" ? (
          <div className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-2">
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
                <ul className="mt-3 space-y-1.5 text-sm leading-6 text-slate-700">
                  {foodItems.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="mt-2 h-1.5 w-1.5 flex-none rounded-full bg-care-500" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="rounded-xl bg-white/85 p-4">
              <p className="text-sm font-bold text-slate-950">Catatan aman</p>
              <p className="mt-2 text-sm leading-6 text-slate-700">{result.nutrition_recommendation.notes}</p>
              <p className="mt-2 text-sm leading-6 text-slate-700">{result.nutrition_recommendation.supplements}</p>
            </div>
          </div>
        ) : null}

        {/* Tab: Detail Teknis */}
        {activeTab === "teknis" ? (
          <div className="space-y-4">
            <p className="mb-3 text-xs leading-5 text-slate-500 flex items-center gap-1.5">
              <Info className="h-4 w-4 text-brand-600 flex-shrink-0" />
              <span>Informasi di bawah ini ditujukan untuk petugas kesehatan sebagai pendukung keputusan skrining. Bukan diagnosis medis.</span>
            </p>
            <div className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
              <div className="flex flex-col justify-between rounded-xl bg-white/85 p-4 border border-slate-100/50 shadow-sm">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Tingkat Keyakinan Model</p>
                  <p className="mt-1 text-lg font-bold text-slate-950">{pct(result.confidence)}</p>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-slate-500 border-t border-slate-100 pt-1.5">
                  Probabilitas kategori terpilih dari 4 pilihan status gizi WHO. Karena ada 4 kategori (baseline acak 25%), nilai di atas 25% menunjukkan pilihan terkuat model, sehingga {pct(result.confidence)} sudah dominan.
                </p>
              </div>
              <div className="flex flex-col justify-between rounded-xl bg-white/85 p-4 border border-slate-100/50 shadow-sm">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Mode Model Prediksi</p>
                  <p className="mt-1 text-lg font-bold text-slate-950">{modeLabel[result.model_mode] ?? result.model_mode}</p>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-slate-500 border-t border-slate-100 pt-1.5">
                  Metode klasifikasi yang dipakai oleh sistem untuk menganalisis data tumbuh kembang anak.
                </p>
              </div>
              <div className="flex flex-col justify-between rounded-xl bg-white/85 p-4 border border-slate-100/50 shadow-sm">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Tinggi Badan Standar</p>
                  <p className="mt-1 text-lg font-bold text-slate-950">{numberOrDash(result.comparison.tb_normal, " cm")}</p>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-slate-500 border-t border-slate-100 pt-1.5">
                  Rata-rata tinggi badan anak sehat WHO berdasarkan umur dan jenis kelamin yang sama.
                </p>
              </div>
              <div className="flex flex-col justify-between rounded-xl bg-white/85 p-4 border border-slate-100/50 shadow-sm">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Berat Badan Standar</p>
                  <p className="mt-1 text-lg font-bold text-slate-950">{numberOrDash(result.comparison.bb_normal, " kg")}</p>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-slate-500 border-t border-slate-100 pt-1.5">
                  Rata-rata berat badan anak sehat WHO berdasarkan umur dan jenis kelamin yang sama.
                </p>
              </div>
              <div className="flex flex-col justify-between rounded-xl bg-white/85 p-4 border border-slate-100/50 shadow-sm">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Persentase Tinggi thd Standar</p>
                  <p className="mt-1 text-lg font-bold text-slate-950">{numberOrDash(result.comparison.persentase_tb, "%")}</p>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-slate-500 border-t border-slate-100 pt-1.5">
                  Persentase tinggi badan riil dibandingkan dengan standar WHO.
                </p>
              </div>
              <div className="flex flex-col justify-between rounded-xl bg-white/85 p-4 border border-slate-100/50 shadow-sm">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Persentase Berat thd Standar</p>
                  <p className="mt-1 text-lg font-bold text-slate-950">{numberOrDash(result.comparison.persentase_bb, "%")}</p>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-slate-500 border-t border-slate-100 pt-1.5">
                  Persentase berat badan riil dibandingkan dengan standar WHO.
                </p>
              </div>
              <div className="flex flex-col justify-between rounded-xl bg-white/85 p-4 border border-slate-100/50 shadow-sm">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Selisih Tinggi dari Standar</p>
                  <p className="mt-1 text-lg font-bold text-slate-950">{numberOrDash(result.growth_notes.height_gap_expected, " cm")}</p>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-slate-500 border-t border-slate-100 pt-1.5">
                  Berapa cm tinggi anak berada di atas (+) atau di bawah (-) batas pertumbuhan yang diharapkan.
                </p>
              </div>
              <div className="flex flex-col justify-between rounded-xl bg-white/85 p-4 border border-slate-100/50 shadow-sm">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Rasio Tinggi thd Standar</p>
                  <p className="mt-1 text-lg font-bold text-slate-950">{numberOrDash(result.growth_notes.height_expected_ratio)}</p>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-slate-500 border-t border-slate-100 pt-1.5">
                  Rasio tinggi anak dibanding standar WHO. Angka 1.0 berarti sama persis dengan standar, di bawah 1.0 artinya lebih pendek.
                </p>
              </div>
              <div className="flex flex-col justify-between rounded-xl bg-white/85 p-4 border border-slate-100/50 shadow-sm">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Selisih Berat dari Standar</p>
                  <p className="mt-1 text-lg font-bold text-slate-950">{numberOrDash(result.growth_notes.weight_gap_expected, " kg")}</p>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-slate-500 border-t border-slate-100 pt-1.5">
                  Berapa kg berat anak berada di atas (+) atau di bawah (-) batas pertumbuhan yang diharapkan.
                </p>
              </div>
              <div className="flex flex-col justify-between rounded-xl bg-white/85 p-4 border border-slate-100/50 shadow-sm">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Rasio Berat thd Standar</p>
                  <p className="mt-1 text-lg font-bold text-slate-950">{numberOrDash(result.growth_notes.weight_expected_ratio)}</p>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-slate-500 border-t border-slate-100 pt-1.5">
                  Rasio berat anak dibanding standar WHO. Angka 1.0 berarti sama persis dengan standar, di bawah 1.0 artinya lebih ringan.
                </p>
              </div>
              <div className="rounded-xl bg-white/85 p-4 border border-slate-100/50 shadow-sm sm:col-span-2 lg:col-span-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Target Gizi Edukatif</p>
                <p className="mt-2 font-semibold text-slate-950">{result.nutrition_recommendation.calories_target}</p>
                <p className="mt-1 font-semibold text-slate-950">{result.nutrition_recommendation.protein_target}</p>
                <p className="mt-1 font-semibold text-slate-950">{result.nutrition_recommendation.fluid_target}</p>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* ── Disclaimer (always visible) ── */}
      <div className="border-t border-black/[0.06] px-5 py-4">
        <p className="text-xs leading-5 text-slate-500">
          {result.disclaimer || DISCLAIMER}
        </p>
      </div>
    </div>
  );
}
