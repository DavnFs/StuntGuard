import { useEffect, useMemo, useState } from "react";
import { BrainCircuit, Database, ShieldAlert } from "lucide-react";

import { ErrorBlock, LoadingBlock } from "../components/StateBlock";
import { api } from "../services/api";
import type { ModelInfo } from "../types";

function formatMetric(value: unknown) {
  if (typeof value === "number") return value.toFixed(4);
  return "-";
}

export default function ModelInfoPage() {
  const [info, setInfo] = useState<ModelInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .getModelInfo()
      .then(setInfo)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const bestMetrics = useMemo(() => {
    const metrics = info?.metrics?.best_model_metrics;
    return metrics && typeof metrics === "object" ? (metrics as Record<string, unknown>) : null;
  }, [info]);
  const metricsNote =
    typeof info?.metrics?.metrics_note === "string" ? info.metrics.metrics_note : null;

  if (loading) return <LoadingBlock />;
  if (error) return <ErrorBlock message={error} />;
  if (!info) return null;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold text-brand-700">Tentang Model</p>
        <h2 className="mt-1 text-2xl font-bold text-slate-950">Informasi AI dan Batasan Sistem</h2>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card lg:col-span-2">
          <div className="flex items-center gap-2">
            <BrainCircuit className="h-5 w-5 text-brand-700" />
            <h3 className="text-base font-semibold text-slate-950">Model Aktif</h3>
          </div>
          <dl className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-200 p-4">
              <dt className="text-sm text-slate-500">Nama model</dt>
              <dd className="mt-1 font-semibold text-slate-950">{info.model_name}</dd>
            </div>
            <div className="rounded-xl border border-slate-200 p-4">
              <dt className="text-sm text-slate-500">Mode aktif</dt>
              <dd className="mt-1 font-semibold text-slate-950">{info.active_model_mode}</dd>
            </div>
            <div className="rounded-xl border border-slate-200 p-4 sm:col-span-2">
              <dt className="text-sm text-slate-500">Fitur training</dt>
              <dd className="mt-1 font-semibold text-slate-950">{info.trained_features.join(", ")}</dd>
            </div>
            <div className="rounded-xl border border-slate-200 p-4 sm:col-span-2">
              <dt className="text-sm text-slate-500">Fitur turunan</dt>
              <dd className="mt-1 font-semibold text-slate-950">
                {info.engineered_features.length ? info.engineered_features.join(", ") : "Tidak tersedia pada fallback height-only"}
              </dd>
            </div>
            <div className="rounded-xl border border-slate-200 p-4 sm:col-span-2">
              <dt className="text-sm text-slate-500">Label prediksi</dt>
              <dd className="mt-1 font-semibold text-slate-950">{info.labels.join(", ")}</dd>
            </div>
            <div className="rounded-xl border border-slate-200 p-4 sm:col-span-2">
              <dt className="text-sm text-slate-500">Weight tersedia saat training</dt>
              <dd className="mt-1 font-semibold text-slate-950">{info.weight_available_during_training ? "Ya" : "Tidak"}</dd>
            </div>
          </dl>
        </section>

        <section className="rounded-lg border border-amber-200 bg-amber-50 p-5 shadow-sm">
          <div className="flex items-center gap-2 text-amber-800">
            <ShieldAlert className="h-5 w-5" />
            <h3 className="text-base font-semibold">Disclaimer</h3>
          </div>
          <p className="mt-3 text-sm leading-6 text-amber-800">{info.disclaimer}</p>
        </section>
      </div>

      <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card">
        <div className="flex items-center gap-2">
          <Database className="h-5 w-5 text-brand-700" />
          <h3 className="text-base font-semibold text-slate-950">Metrics Training</h3>
        </div>
        {bestMetrics ? (
          <div className="mt-4 grid gap-4 md:grid-cols-4">
            <div className="rounded-xl border border-slate-200 p-4">
              <p className="text-sm text-slate-500">Accuracy</p>
              <p className="mt-1 text-xl font-bold text-slate-950">{formatMetric(bestMetrics.accuracy)}</p>
            </div>
            <div className="rounded-xl border border-slate-200 p-4">
              <p className="text-sm text-slate-500">Macro Precision</p>
              <p className="mt-1 text-xl font-bold text-slate-950">{formatMetric(bestMetrics.macro_precision)}</p>
            </div>
            <div className="rounded-xl border border-slate-200 p-4">
              <p className="text-sm text-slate-500">Macro Recall</p>
              <p className="mt-1 text-xl font-bold text-slate-950">{formatMetric(bestMetrics.macro_recall)}</p>
            </div>
            <div className="rounded-xl border border-slate-200 p-4">
              <p className="text-sm text-slate-500">Macro F1</p>
              <p className="mt-1 text-xl font-bold text-slate-950">{formatMetric(bestMetrics.macro_f1)}</p>
            </div>
          </div>
        ) : (
          <p className="mt-4 text-sm text-slate-500">
            {metricsNote ??
              "Metrics belum tersedia. Jalankan training model dari folder backend untuk menghasilkan metrics.json."}
          </p>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card">
        <h3 className="text-base font-semibold text-slate-950">Feature Importance</h3>
        {info.feature_importance?.length ? (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead>
                <tr className="text-left text-slate-500">
                  <th className="py-3 pr-4 font-semibold">Fitur</th>
                  <th className="py-3 pr-4 font-semibold">Importance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {info.feature_importance.map((item) => (
                  <tr key={item.feature}>
                    <td className="py-3 pr-4 font-medium text-slate-950">{item.feature}</td>
                    <td className="py-3 pr-4 text-slate-600">{item.importance.toFixed(4)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-4 text-sm text-slate-500">
            Feature importance tersedia untuk model tree-based scikit-learn setelah training.
          </p>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card">
        <h3 className="text-base font-semibold text-slate-950">Informasi Dataset Training</h3>
        <pre className="mt-4 overflow-x-auto rounded-lg bg-slate-950 p-4 text-xs text-slate-100">
          {JSON.stringify(info.training_dataset_info, null, 2)}
        </pre>
      </section>

      <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card">
        <h3 className="text-base font-semibold text-slate-950">Catatan Dataset dan Batasan</h3>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Dataset menggunakan usia, gender, tinggi badan, dan berat badan sebagai fitur. Label status gizi kemungkinan sangat berkaitan dengan aturan antropometri atau standar pertumbuhan. Karena itu model cocok untuk demonstrasi skrining awal, bukan diagnosis medis lengkap. Faktor lain seperti riwayat penyakit, prematuritas, pola makan, sanitasi, dan pemeriksaan klinis belum digunakan.
        </p>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-600">
          {info.limitations.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
