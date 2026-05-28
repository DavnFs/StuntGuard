import { FormEvent, useState } from "react";
import { ClipboardPlus, Gauge } from "lucide-react";

import { ErrorBlock } from "../components/StateBlock";
import StatusBadge from "../components/StatusBadge";
import { api } from "../services/api";
import type { Gender, PredictionRequest, PredictionResponse } from "../types";

export default function QuickPredictionPage() {
  const [form, setForm] = useState<PredictionRequest>({
    age_month: 24,
    gender: "female",
    height_cm: 80,
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
            <div className="mt-4 space-y-4">
              <div className="flex flex-wrap gap-2">
                <StatusBadge value={result.nutrition_status} />
                <StatusBadge value={result.risk_level} type="risk" />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-slate-200 p-4">
                  <p className="text-sm text-slate-500">Confidence</p>
                  <p className="mt-1 text-2xl font-bold text-slate-950">
                    {result.confidence === null ? "N/A" : `${Math.round(result.confidence * 100)}%`}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-200 p-4">
                  <p className="text-sm text-slate-500">Model</p>
                  <p className="mt-1 text-base font-semibold text-slate-950">
                    {result.confidence === null ? "Fallback demo" : "Model terlatih"}
                  </p>
                </div>
              </div>
              <div className="rounded-lg border border-brand-100 bg-brand-50 p-4">
                <p className="text-sm font-semibold text-slate-950">Rekomendasi</p>
                <p className="mt-2 text-sm leading-6 text-slate-700">{result.recommendation}</p>
              </div>
              <p className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">
                {result.disclaimer}
              </p>
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-500">
              Masukkan usia, gender, dan tinggi badan untuk menjalankan skrining awal.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
