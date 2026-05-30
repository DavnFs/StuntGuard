import { ChevronDown, HeartPulse, Info, MessageCircle, RotateCcw, Save, UserPlus } from "lucide-react";
import { Link } from "react-router-dom";

import type { PredictionResponse } from "../types";

const DISCLAIMER =
  "Hasil ini merupakan skrining awal dan bukan diagnosis medis. Silakan konsultasikan ke petugas kesehatan atau Puskesmas untuk pemeriksaan lanjutan.";

const resultCopy = {
  normal: {
    title: "Pertumbuhan Anak Terlihat Normal",
    badge: "Normal",
    tone: "border-emerald-200 bg-emerald-50 text-emerald-800",
    iconTone: "bg-emerald-100 text-emerald-700",
    explanation:
      "Berdasarkan data yang dimasukkan, pertumbuhan anak masih berada pada kategori aman.",
    action: "Tetap lakukan pemantauan rutin setiap bulan di Posyandu.",
  },
  tall: {
    title: "Pertumbuhan Anak Di Atas Rata-Rata",
    badge: "Perlu Dipantau",
    tone: "border-sky-200 bg-sky-50 text-sky-800",
    iconTone: "bg-sky-100 text-sky-700",
    explanation:
      "Tinggi badan anak terlihat lebih tinggi dari estimasi umum untuk usianya. Biasanya ini bukan masalah, tetapi tetap lakukan pemantauan pertumbuhan secara rutin.",
    action: "Lanjutkan pemantauan berkala.",
  },
  stunted: {
    title: "Anak Perlu Pemantauan Lebih Lanjut",
    badge: "Risiko Stunting",
    tone: "border-amber-200 bg-amber-50 text-amber-800",
    iconTone: "bg-amber-100 text-amber-700",
    explanation:
      "Tinggi badan anak terlihat lebih rendah dari estimasi pertumbuhan umum untuk usia dan jenis kelaminnya. Hasil ini belum berarti diagnosis, tetapi sebaiknya dilakukan pemantauan dan konsultasi dengan petugas kesehatan.",
    action: "Konsultasikan ke Posyandu atau Puskesmas untuk pemeriksaan lanjutan.",
  },
  "severely stunted": {
    title: "Segera Konsultasikan ke Petugas Kesehatan",
    badge: "Risiko Tinggi",
    tone: "border-red-200 bg-red-50 text-red-800",
    iconTone: "bg-red-100 text-red-700",
    explanation:
      "Data pertumbuhan anak menunjukkan indikasi risiko tinggi. Hasil ini bukan diagnosis medis, tetapi sebaiknya segera dikonsultasikan ke Posyandu atau Puskesmas.",
    action: "Jangan menunda pemeriksaan lanjutan.",
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

function growthSentences(result: PredictionResponse) {
  const heightGap = result.growth_notes.height_gap_expected;
  const weightGap = result.growth_notes.weight_gap_expected;
  const sentences: string[] = [];

  if (typeof heightGap === "number") {
    if (heightGap < -3) {
      sentences.push("Tinggi badan anak lebih rendah dari estimasi umum untuk usianya.");
      sentences.push("Pemantauan tinggi badan secara berkala disarankan.");
    } else if (heightGap <= 3) {
      sentences.push("Tinggi badan anak masih mendekati estimasi umum.");
    } else {
      sentences.push("Tinggi badan anak terlihat di atas estimasi umum untuk usianya.");
    }
  }

  if (typeof weightGap === "number") {
    if (weightGap < -1.5) {
      sentences.push("Berat badan anak juga terlihat lebih rendah dari estimasi umum.");
    } else if (weightGap <= 1.5) {
      sentences.push("Berat badan anak masih mendekati estimasi umum.");
    } else {
      sentences.push("Berat badan anak terlihat di atas estimasi umum.");
    }
  }

  return sentences;
}

interface PredictionResultCardProps {
  result: PredictionResponse;
  onCheckAgain?: () => void;
}

export default function PredictionResultCard({ result, onCheckAgain }: PredictionResultCardProps) {
  const copy = resultCopy[result.nutrition_status];
  const risky = result.nutrition_status === "stunted" || result.nutrition_status === "severely stunted";
  const notes = growthSentences(result);

  return (
    <div className={`rounded-2xl border p-5 shadow-sm ${copy.tone}`}>
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex gap-3">
          <div className={`mt-1 rounded-2xl p-3 ${copy.iconTone}`}>
            <HeartPulse className="h-6 w-6" />
          </div>
          <div>
            <span className="inline-flex rounded-full bg-white/80 px-3 py-1 text-xs font-bold">
              {copy.badge}
            </span>
            <h3 className="mt-3 text-2xl font-bold leading-tight text-slate-950">{copy.title}</h3>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-700">{copy.explanation}</p>
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-[1fr_1fr]">
        <div className="rounded-xl bg-white/80 p-4">
          <p className="text-sm font-bold text-slate-950">Saran awal</p>
          <p className="mt-2 text-sm leading-6 text-slate-700">{copy.action}</p>
        </div>
        <div className="rounded-xl bg-white/80 p-4">
          <p className="text-sm font-bold text-slate-950">Catatan pertumbuhan</p>
          <ul className="mt-2 space-y-1 text-sm leading-6 text-slate-700">
            {notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {risky ? (
          <>
            <Link to="/chatbot" className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-brand-700">
              <MessageCircle className="h-4 w-4" />
              Tanya AI Gizi
            </Link>
            <Link to="/login" className="inline-flex items-center gap-2 rounded-xl border border-brand-600 bg-white px-4 py-2.5 text-sm font-bold text-brand-700 hover:bg-brand-50">
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
            <Link to="/chatbot" className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-brand-700">
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
        </div>
      </details>
    </div>
  );
}
