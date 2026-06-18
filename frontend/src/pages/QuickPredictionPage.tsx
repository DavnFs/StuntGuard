import { FormEvent, useState } from "react";
import {
  Baby,
  ClipboardPlus,
  Gauge,
  HeartPulse,
  Minus,
  Plus,
  Ruler,
  Scale,
  UserRound,
  Users,
  ArrowLeft,
  ArrowRight,
  ChevronRight,
} from "lucide-react";

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
  
  // Wizard state: 1: Jenis Kelamin, 2: Usia, 3: Pengukuran
  const [step, setStep] = useState(1);

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
    if (step < 3) {
      handleNextStep();
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const sanitizedForm = {
        ...form,
        height_cm: clamp(roundOne(form.height_cm), 20, 150),
        weight_kg: clamp(roundOne(form.weight_kg), 1, 60),
      };
      const prediction = await api.predict(sanitizedForm);
      setResult(prediction);
      window.sessionStorage.setItem("stuntguard_last_child_context", JSON.stringify(buildChatContext(prediction)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Prediksi gagal");
    } finally {
      setLoading(false);
    }
  };

  const handleNextStep = () => {
    if (step < 3) setStep(step + 1);
  };

  const handlePrevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold text-cyan-600">Fitur Prediksi Cepat</p>
        <h2 className="mt-1 text-2xl font-bold text-slate-950">Skrining Status Gizi & Risiko Stunting</h2>
        <p className="text-xs text-slate-500 mt-1">Lakukan skrining cepat tumbuh kembang balita tanpa menyimpan data ke sistem.</p>
      </div>

      {error ? <ErrorBlock message={error} /> : null}

      <div className="grid gap-6 lg:grid-cols-[440px_1fr]">
        <section className="rounded-3xl border border-slate-200/60 bg-white shadow-xl shadow-cyan-900/[0.02] flex flex-col justify-between overflow-hidden">
          {/* Header & Step progress */}
          <div>
            <div className="border-b border-slate-100 bg-slate-50/50 px-5 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ClipboardPlus className="h-4.5 w-4.5 text-cyan-600" />
                <h3 className="text-sm font-bold text-slate-850">Langkah Skrining</h3>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                <span className="text-cyan-600">{step}</span>/<span>3</span>
              </div>
            </div>

            {/* Step progress bar */}
            <div className="h-1 bg-slate-100 w-full">
              <div
                className="h-1 bg-gradient-to-r from-cyan-500 to-teal-500 transition-all duration-300"
                style={{ width: `${(step / 3) * 100}%` }}
              />
            </div>

            <form className="p-5 space-y-6" onSubmit={submit}>
              {/* Step 1: Gender */}
              {step === 1 && (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-bold text-slate-800">Jenis Kelamin Anak</label>
                    <p className="text-xs text-slate-400 mt-0.5">Tentukan kurva acuan standar WHO.</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { value: "female" as Gender, label: "Perempuan", icon: UserRound, activeClass: "border-pink-500 bg-pink-50/30 text-pink-700" },
                      { value: "male" as Gender, label: "Laki-laki", icon: Users, activeClass: "border-cyan-500 bg-cyan-50/30 text-cyan-700" },
                    ].map((item) => {
                      const selected = form.gender === item.value;
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.value}
                          type="button"
                          onClick={() => {
                            updateForm({ gender: item.value });
                            handleNextStep();
                          }}
                          className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 text-center transition ${
                            selected
                              ? `${item.activeClass} font-bold shadow-md`
                              : "border-slate-100 text-slate-500 hover:border-slate-200"
                          }`}
                        >
                          <Icon className="h-5 w-5" />
                          <span className="text-xs">{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Step 2: Age */}
              {step === 2 && (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-bold text-slate-800">Usia Anak</label>
                    <p className="text-xs text-slate-400 mt-0.5">Usia dalam hitungan bulan (0 - 60 bulan).</p>
                  </div>

                  <div className="rounded-xl border border-slate-150 bg-slate-50/50 p-4 text-center">
                    <span className="font-heading text-3xl font-extrabold text-cyan-600">{form.age_month}</span>
                    <span className="text-sm font-bold text-slate-400 ml-1">bulan</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => updateForm({ age_month: clamp(form.age_month - 1, 0, 60) })}
                      className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <input
                      required
                      type="number"
                      min={0}
                      max={60}
                      value={form.age_month}
                      onChange={(event) => updateForm({ age_month: clamp(Number(event.target.value), 0, 60) })}
                      className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-center text-sm font-bold outline-none transition focus:border-cyan-500"
                    />
                    <button
                      type="button"
                      onClick={() => updateForm({ age_month: clamp(form.age_month + 1, 0, 60) })}
                      className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="pt-2">
                    <input
                      type="range"
                      min={0}
                      max={60}
                      value={form.age_month}
                      onChange={(event) => updateForm({ age_month: Number(event.target.value) })}
                      className="w-full premium-slider"
                    />
                  </div>
                </div>
              )}

              {/* Step 3: Height & Weight */}
              {step === 3 && (
                <div className="space-y-4">
                  {/* Height */}
                  <div className="rounded-xl border border-slate-100 bg-slate-50/30 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Ruler className="h-4 w-4 text-cyan-600" />
                        <span className="text-xs font-bold text-slate-600">Tinggi Badan</span>
                      </div>
                      <span className="text-sm font-bold text-cyan-700">{form.height_cm.toFixed(1)} cm</span>
                    </div>
                    <input
                      type="range"
                      min={45}
                      max={125}
                      step={0.1}
                      value={form.height_cm}
                      onChange={(event) => updateForm({ height_cm: roundOne(Number(event.target.value)) })}
                      className="w-full premium-slider"
                    />
                    <input
                      required
                      type="number"
                      min={20}
                      max={150}
                      step={0.1}
                      value={form.height_cm || ""}
                      onChange={(event) => {
                        const val = event.target.value;
                        updateForm({ height_cm: val === "" ? 0 : Number(val) });
                      }}
                      onBlur={() => {
                        updateForm({ height_cm: clamp(roundOne(form.height_cm), 20, 150) });
                      }}
                      className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-center text-xs font-bold outline-none transition focus:border-cyan-500"
                    />
                  </div>

                  {/* Weight */}
                  <div className="rounded-xl border border-slate-100 bg-slate-50/30 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Scale className="h-4 w-4 text-emerald-600" />
                        <span className="text-xs font-bold text-slate-600">Berat Badan</span>
                      </div>
                      <span className="text-sm font-bold text-emerald-700">{form.weight_kg.toFixed(1)} kg</span>
                    </div>
                    <input
                      type="range"
                      min={2}
                      max={30}
                      step={0.1}
                      value={form.weight_kg}
                      onChange={(event) => updateForm({ weight_kg: roundOne(Number(event.target.value)) })}
                      className="w-full premium-slider-care"
                    />
                    <input
                      required
                      type="number"
                      min={1}
                      max={60}
                      step={0.1}
                      value={form.weight_kg || ""}
                      onChange={(event) => {
                        const val = event.target.value;
                        updateForm({ weight_kg: val === "" ? 0 : Number(val) });
                      }}
                      onBlur={() => {
                        updateForm({ weight_kg: clamp(roundOne(form.weight_kg), 1, 60) });
                      }}
                      className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-center text-xs font-bold outline-none transition focus:border-emerald-500"
                    />
                  </div>
                </div>
              )}
            </form>
          </div>

          {/* Navigation panel */}
          <div className="border-t border-slate-100 bg-slate-50/50 p-5 flex items-center justify-between">
            {step > 1 ? (
              <button
                key="btn-prev"
                type="button"
                onClick={handlePrevStep}
                className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Kembali
              </button>
            ) : (
              <div key="spacer-prev" />
            )}

            {step < 3 ? (
              <button
                key="btn-next"
                type="button"
                onClick={handleNextStep}
                className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-slate-900 px-5 text-xs font-bold text-white hover:bg-slate-800 transition"
              >
                Lanjut
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            ) : (
              <button
                key="btn-submit"
                type="button"
                onClick={(e) => submit(e as any)}
                disabled={loading}
                className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 px-5 text-xs font-bold text-white shadow-md shadow-cyan-900/10 hover:shadow-cyan-900/20 disabled:opacity-60"
              >
                <Gauge className="h-3.5 w-3.5" />
                {loading ? "Memproses..." : "Prediksi Sekarang"}
              </button>
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200/60 bg-white p-5 shadow-xl shadow-cyan-900/[0.02] flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <HeartPulse className="h-4.5 w-4.5 text-cyan-600" />
              <h3 className="text-sm font-bold text-slate-850">Hasil Analisis</h3>
            </div>
            {result ? (
              <div className="mt-4">
                <PredictionResultCard
                  result={result}
                  childContext={buildChatContext(result)}
                />
              </div>
            ) : (
              <div className="mt-12 flex flex-col items-center py-16 text-center">
                <div className="rounded-2xl bg-cyan-50 p-4 border border-cyan-100 shadow-inner animate-float-slow">
                  <Baby className="h-10 w-10 text-cyan-400" />
                </div>
                <p className="mt-5 text-sm font-bold text-slate-700">Hasil Prediksi Kosong</p>
                <p className="mt-2.5 max-w-xs text-xs text-slate-400 leading-relaxed">
                  Gunakan form wizard di sebelah kiri untuk mengisi data anak, lalu jalankan analisis skrining stunting.
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
