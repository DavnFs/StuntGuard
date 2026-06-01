import { useEffect, useState } from "react";

import { ErrorBlock, LoadingBlock } from "../components/StateBlock";
import StatusBadge from "../components/StatusBadge";
import { api } from "../services/api";
import type { Measurement } from "../types";

export default function MeasurementsPage() {
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiRequest();
  }, []);

  const apiRequest = () => {
    setLoading(true);
    api
      .getAllMeasurements()
      .then(setMeasurements)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  };

  if (loading) return <LoadingBlock />;
  if (error) return <ErrorBlock message={error} />;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold text-brand-700">Data Pemeriksaan</p>
        <h2 className="mt-1 text-2xl font-bold text-slate-950">Semua Pengukuran Balita</h2>
      </div>
      <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead>
              <tr className="text-left text-slate-500">
                <th className="py-3 pr-4 font-semibold">Tanggal</th>
                <th className="py-3 pr-4 font-semibold">Child ID</th>
                <th className="py-3 pr-4 font-semibold">Usia</th>
                <th className="py-3 pr-4 font-semibold">Tinggi</th>
                <th className="py-3 pr-4 font-semibold">Berat</th>
                <th className="py-3 pr-4 font-semibold">Status</th>
                <th className="py-3 pr-4 font-semibold">Risiko</th>
                <th className="py-3 pr-4 font-semibold">Model</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {measurements.map((item) => (
                <tr key={item.id}>
                  <td className="py-3 pr-4 text-slate-600">{new Date(item.measurement_date).toLocaleDateString("id-ID")}</td>
                  <td className="py-3 pr-4 text-slate-600">{item.child_id}</td>
                  <td className="py-3 pr-4 text-slate-600">{item.age_month} bulan</td>
                  <td className="py-3 pr-4 text-slate-600">{item.height_cm} cm</td>
                  <td className="py-3 pr-4 text-slate-600">{item.weight_kg ?? "-"} kg</td>
                  <td className="py-3 pr-4"><StatusBadge value={item.predicted_status} /></td>
                  <td className="py-3 pr-4"><StatusBadge value={item.risk_level} type="risk" /></td>
                  <td className="py-3 pr-4 text-xs text-slate-600">{item.model_mode}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
