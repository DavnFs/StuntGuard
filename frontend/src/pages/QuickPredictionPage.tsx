import { FormEvent, useState } from "react";
import { ClipboardPlus, Gauge } from "lucide-react";

import PredictionResultCard from "../components/PredictionResultCard";
import { ErrorBlock } from "../components/StateBlock";
import { api } from "../services/api";
import type { Gender, PredictionRequest, PredictionResponse } from "../types";

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

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      setResult(await api.predict(form));
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

      <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <ClipboardPlus className="h-5 w-5 text-brand-700" />
            <h3 className="text-base font-semibold text-slate-950">Input Pemeriksaan</h3>
          </div>
          <form className="mt-4 space-y-4" onSubmit={submit}>
            <label className="block text-sm font-medium text-slate-700">
              Usia (bulan)
              <input
                required
                type="number"
                min={0}
                max={60}
                value={form.age_month}
                onChange={(event) => setForm({ ...form, age_month: Number(event.target.value) })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-brand-600"
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Gender
              <select
                value={form.gender}
                onChange={(event) => setForm({ ...form, gender: event.target.value as Gender })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-brand-600"
              >
                <option value="female">Perempuan</option>
                <option value="male">Laki-laki</option>
              </select>
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Tinggi Badan (cm)
              <input
                required
                type="number"
                min={20}
                max={150}
                step={0.1}
                value={form.height_cm}
                onChange={(event) => setForm({ ...form, height_cm: Number(event.target.value) })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-brand-600"
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Berat Badan (kg)
              <input
                required
                type="number"
                min={1}
                max={60}
                step={0.1}
                value={form.weight_kg}
                onChange={(event) => setForm({ ...form, weight_kg: Number(event.target.value) })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-brand-600"
              />
            </label>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
            >
              <Gauge className="h-4 w-4" />
              {loading ? "Memproses..." : "Prediksi"}
            </button>
          </form>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-base font-semibold text-slate-950">Hasil Prediksi</h3>
          {result ? (
            <div className="mt-4">
              <PredictionResultCard
                result={result}
                childContext={{
                  age_month: form.age_month,
                  gender: form.gender,
                  height_cm: form.height_cm,
                  weight_kg: form.weight_kg,
                  nutrition_status: result.nutrition_status,
                  risk_level: result.risk_level,
                  recommendation: result.summary.next_action,
                }}
              />
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-500">
              Masukkan usia, gender, tinggi badan, dan berat badan untuk menjalankan skrining awal.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
