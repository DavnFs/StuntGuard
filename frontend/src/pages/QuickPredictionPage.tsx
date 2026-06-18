import { FormEvent, useState } from "react";
import { Baby, ClipboardPlus, Gauge, HeartPulse, Minus, Plus, Ruler, Scale, UserRound, Users } from "lucide-react";

import PredictionResultCard from "../components/PredictionResultCard";
import { ErrorBlock } from "../components/StateBlock";
import { api } from "../services/api";
import type { ChatChildContext, Gender, PredictionRequest, PredictionResponse } from "../types";

function clamp(value: number, min: number, max: number) {
  if (Number.isNaN(value)) return min;
  return Math.min(max, Math.max(min, value));
}

function roundOne(value: number) {
  return Math.round(value * 10) / 10;
}

export default function QuickPredictionPage() {
  const [form, setForm] = useState<PredictionRequest>({
    age_month: 24,
    gender: "female",
    height_cm: 80,
    weight_kg: 9.2,
  });
  const [result, setResult] = useState<PredictionResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateForm = (updates: Partial<PredictionRequest>) => {
    setForm((current) => ({ ...current, ...updates }));
  };

  const buildChatContext = (prediction: PredictionResponse): ChatChildContext => ({
    age_month: form.age_month,
    gender: form.gender,
    height_cm: form.height_cm,
    weight_kg: form.weight_kg,
    nutrition_status: prediction.nutrition_status,
    risk_level: prediction.risk_level,
    recommendation: prediction.summary.next_action,
    comparison: {
      tb_explanation: prediction.comparison.tb_explanation,
      bb_explanation: prediction.comparison.bb_explanation,
      overall_explanation: prediction.comparison.overall_explanation,
      warning: prediction.comparison.warning,
    },
    nutrition_recommendation: {
      description: prediction.nutrition_recommendation.description,
      mpasi_phase: prediction.nutrition_recommendation.mpasi_phase,
      food: prediction.nutrition_recommendation.food,
      frequency: prediction.nutrition_recommendation.frequency,
      supplements: prediction.nutrition_recommendation.supplements,
      notes: prediction.nutrition_recommendation.notes,
    },
  });

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const prediction = await api.predict(form);
      setResult(prediction);
      window.sessionStorage.setItem("stuntguard_last_child_context", JSON.stringify(buildChatContext(prediction)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Prediksi gagal");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold text-brand-700">Prediksi Cepat</p>
        <h2 className="mt-1 text-2xl font-bold text-slate-950">Skrining Status Gizi Tanpa Menyimpan Data</h2>
      </div>

      {error ? <ErrorBlock message={error} /> : null}

      <div className="grid gap-6 lg:grid-cols-[440px_1fr]">
        <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card">
          <div className="flex items-center gap-2">
            <ClipboardPlus className="h-5 w-5 text-brand-700" />
            <h3 className="text-base font-semibold text-slate-950">Input Pemeriksaan</h3>
          </div>
          <form className="mt-5 space-y-5" onSubmit={submit}>
            {/* Gender */}
            <div>
              <p className="text-sm font-bold text-slate-700">Jenis Kelamin</p>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {[
                  { value: "female" as Gender, label: "Perempuan", icon: UserRound },
                  { value: "male" as Gender, label: "Laki-laki", icon: Users },
                ].map((item) => {
                  const selected = form.gender === item.value;
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => updateForm({ gender: item.value })}
                      aria-pressed={selected}
                      className={`flex items-center gap-2 rounded-xl border-2 p-3 text-left text-sm transition ${
                        selected
                          ? "border-brand-500 bg-brand-50 font-bold text-brand-800"
                          : "border-slate-200 text-slate-600 hover:border-brand-200"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Age */}
            <div className="rounded-xl border border-slate-200/80 bg-gradient-to-br from-slate-50/80 to-brand-50/30 p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Usia</p>
                <Baby className="h-5 w-5 text-brand-300" />
              </div>
              <p className="mt-1 font-heading text-2xl font-extrabold text-brand-700">{form.age_month} <span className="text-sm font-bold text-slate-400">bulan</span></p>
              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => updateForm({ age_month: clamp(form.age_month - 1, 0, 60) })}
                  className="inline-flex min-h-9 min-w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-brand-300 hover:bg-brand-50"
                  aria-label="Kurangi usia"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <input
                  required
                  type="number"
                  min={0}
                  max={60}
                  value={form.age_month}
                  onChange={(event) => updateForm({ age_month: clamp(Number(event.target.value), 0, 60) })}
                  className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-center text-sm font-bold outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                />
                <button
                  type="button"
                  onClick={() => updateForm({ age_month: clamp(form.age_month + 1, 0, 60) })}
                  className="inline-flex min-h-9 min-w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-brand-300 hover:bg-brand-50"
                  aria-label="Tambah usia"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Height */}
            <div className="rounded-xl border border-slate-200/80 bg-gradient-to-br from-slate-50/80 to-care-50/30 p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Tinggi Badan</p>
                <Ruler className="h-5 w-5 text-care-300" />
              </div>
              <p className="mt-1 font-heading text-2xl font-extrabold text-brand-700">{form.height_cm.toFixed(1)} <span className="text-sm font-bold text-slate-400">cm</span></p>
              <input
                type="range"
                min={45}
                max={125}
                step={0.1}
                value={form.height_cm}
                onChange={(event) => updateForm({ height_cm: roundOne(Number(event.target.value)) })}
                className="mt-3 w-full accent-care-600"
              />
              <input
                required
                type="number"
                min={20}
                max={150}
                step={0.1}
                value={form.height_cm}
                onChange={(event) => updateForm({ height_cm: clamp(roundOne(Number(event.target.value)), 20.1, 149.9) })}
                className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-center text-sm font-bold outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              />
            </div>

            {/* Weight */}
            <div className="rounded-xl border border-slate-200/80 bg-gradient-to-br from-slate-50/80 to-amber-50/30 p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Berat Badan</p>
                <Scale className="h-5 w-5 text-amber-300" />
              </div>
              <p className="mt-1 font-heading text-2xl font-extrabold text-brand-700">{form.weight_kg.toFixed(1)} <span className="text-sm font-bold text-slate-400">kg</span></p>
              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => updateForm({ weight_kg: clamp(roundOne(form.weight_kg - 0.1), 1.1, 59.9) })}
                  className="inline-flex min-h-9 min-w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-amber-300 hover:bg-amber-50"
                  aria-label="Kurangi berat"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <input
                  required
                  type="number"
                  min={1}
                  max={60}
                  step={0.1}
                  value={form.weight_kg}
                  onChange={(event) => updateForm({ weight_kg: clamp(roundOne(Number(event.target.value)), 1.1, 59.9) })}
                  className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-center text-sm font-bold outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                />
                <button
                  type="button"
                  onClick={() => updateForm({ weight_kg: clamp(roundOne(form.weight_kg + 0.1), 1.1, 59.9) })}
                  className="inline-flex min-h-9 min-w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-amber-300 hover:bg-amber-50"
                  aria-label="Tambah berat"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-care-600 to-care-700 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-care-700/20 transition hover:shadow-xl disabled:opacity-60"
            >
              <Gauge className="h-4 w-4" />
              {loading ? "Memproses..." : "Prediksi Sekarang"}
            </button>
          </form>
        </section>

        <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card">
          <div className="flex items-center gap-2">
            <HeartPulse className="h-5 w-5 text-brand-700" />
            <h3 className="text-base font-semibold text-slate-950">Hasil Prediksi</h3>
          </div>
          {result ? (
            <div className="mt-4">
              <PredictionResultCard
                result={result}
                childContext={buildChatContext(result)}
              />
            </div>
          ) : (
            <div className="mt-8 flex flex-col items-center py-12 text-center">
              <div className="rounded-2xl bg-brand-50 p-4">
                <ClipboardPlus className="h-10 w-10 text-brand-300" />
              </div>
              <p className="mt-4 text-sm font-semibold text-slate-500">Belum ada hasil</p>
              <p className="mt-1 max-w-xs text-xs text-slate-400">
                Masukkan data anak di sebelah kiri, lalu klik "Prediksi Sekarang" untuk melihat hasil skrining.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
