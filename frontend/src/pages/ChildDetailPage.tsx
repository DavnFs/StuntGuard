import { FormEvent, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, CalendarPlus, LineChart as LineChartIcon, Ruler } from "lucide-react";

import { ErrorBlock, LoadingBlock, SuccessBlock } from "../components/StateBlock";
import { KmsStatusBadge } from "../components/StatusBadge";
import { KmsChart } from "../components/KmsChart";
import { api } from "../services/api";
import type { Child, Measurement, MeasurementInput } from "../types";

const today = new Date().toISOString().slice(0, 10);

export default function ChildDetailPage() {
  const { id } = useParams();
  const childId = Number(id);
  const [child, setChild] = useState<Child | null>(null);
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [latestResult, setLatestResult] = useState<Measurement | null>(null);
  const [form, setForm] = useState<MeasurementInput>({
    measurement_date: today,
    age_month: 24,
    height_cm: 80,
    weight_kg: 9.2,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [childData, measurementData] = await Promise.all([
        api.getChild(childId),
        api.getMeasurements(childId),
      ]);
      setChild(childData);
      setMeasurements(measurementData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat detail balita");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (Number.isInteger(childId) && childId > 0) {
      load();
    } else {
      setError("ID balita tidak valid.");
      setLoading(false);
    }
  }, [childId]);

  const submitMeasurement = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const created = await api.createMeasurement(childId, form);
      setLatestResult(created);
      const updated = await api.getMeasurements(childId);
      setMeasurements(updated);
      setSuccess("Pemeriksaan berhasil disimpan dan grafik pertumbuhan telah diperbarui.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan pemeriksaan");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingBlock />;
  if (!child) return <ErrorBlock message={error ?? "Data balita tidak ditemukan."} />;

  return (
    <div className="space-y-6">
      <Link to="/app/children" className="inline-flex items-center gap-2 text-sm font-semibold text-brand-700 hover:text-brand-800">
        <ArrowLeft className="h-4 w-4" />
        Kembali ke Data Balita
      </Link>
      {error ? <ErrorBlock message={error} /> : null}
      {success ? <SuccessBlock message={success} /> : null}

      <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card">
        <div className="flex flex-col justify-between gap-4 md:flex-row">
          <div>
            <p className="text-sm font-semibold text-brand-700">Profil Balita</p>
            <h2 className="mt-1 text-2xl font-bold text-slate-950">{child.name}</h2>
            <p className="mt-2 text-sm text-slate-600">
              {child.gender === "male" ? "Laki-laki" : "Perempuan"} | Lahir {new Date(child.birth_date).toLocaleDateString("id-ID")}
            </p>
          </div>
          <div className="grid gap-2 text-sm text-slate-600 sm:grid-cols-2 md:text-right">
            <span>Orang tua: {child.parent_name || "-"}</span>
            <span>Wilayah: {child.posyandu_area || "-"}</span>
            <span className="sm:col-span-2">Alamat demo: {child.address || "-"}</span>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card">
          <div className="flex items-center gap-2 mb-4">
            <LineChartIcon className="h-5 w-5 text-brand-700" />
            <h3 className="text-base font-semibold text-slate-950">Grafik Pertumbuhan StuntGuard</h3>
          </div>
          
          {measurements.length === 0 ? (
            <div className="flex h-80 items-center justify-center rounded-xl border-2 border-dashed border-slate-200">
              <p className="text-sm text-slate-500">Belum ada data pengukuran.</p>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap gap-3 mb-4 text-xs font-medium">
                <span className="flex items-center gap-1.5"><span className="h-3 w-6 rounded bg-[#fee2e2] border border-red-200" /> BGM (Garis Merah)</span>
                <span className="flex items-center gap-1.5"><span className="h-3 w-6 rounded bg-[#fef9c3] border border-yellow-200" /> Kurang</span>
                <span className="flex items-center gap-1.5"><span className="h-3 w-6 rounded bg-[#dcfce7] border border-green-200" /> Normal</span>
                <span className="flex items-center gap-1.5"><span className="h-3 w-6 rounded bg-[#fff7ed] border border-orange-200" /> Lebih</span>
                <span className="flex items-center gap-1.5"><span className="h-2.5 w-6 rounded bg-slate-900" /> Berat Anak</span>
              </div>
              <KmsChart measurements={measurements} />
            </>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card">
          <div className="flex items-center gap-2">
            <CalendarPlus className="h-5 w-5 text-brand-700" />
            <h3 className="text-base font-semibold text-slate-950">Tambah Catatan Pertumbuhan</h3>
          </div>
          <form className="mt-4 space-y-4" onSubmit={submitMeasurement}>
            <label className="block text-sm font-medium text-slate-700">
              Tanggal Pemeriksaan
              <input
                required
                type="date"
                max={today}
                value={form.measurement_date}
                onChange={(event) => setForm({ ...form, measurement_date: event.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100"
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Usia (bulan)
              <input
                required
                type="number"
                min={0}
                max={60}
                value={form.age_month}
                onChange={(event) => setForm({ ...form, age_month: Number(event.target.value) })}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100"
              />
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
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100"
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
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100"
              />
            </label>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-care-600 px-4 py-2 text-sm font-semibold text-white hover:bg-care-700 disabled:opacity-60"
            >
              <Ruler className="h-4 w-4" />
              {saving ? "Memproses..." : "Simpan Catatan Pertumbuhan"}
            </button>
          </form>

          {latestResult ? (
            <div className="mt-5 rounded-lg border border-brand-100 bg-brand-50 p-4">
              <p className="text-sm font-semibold text-slate-800 mb-2">Hasil Pemeriksaan Bulan Ini:</p>
              <div className="flex flex-wrap gap-2">
                <KmsStatusBadge value={latestResult.kms_status} />
              </div>
              <p className="mt-3 text-sm text-slate-700">
                Silakan rujuk grafik pertumbuhan untuk melihat detail jalur pertumbuhan anak Anda.
                Jika berada di bawah garis merah, segera konsultasikan ke Posyandu.
              </p>
            </div>
          ) : null}
        </section>
      </div>

      <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card">
        <h3 className="text-base font-semibold text-slate-950">Riwayat Pertumbuhan</h3>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead>
              <tr className="text-left text-slate-500">
                <th className="py-3 pr-4 font-semibold">Tanggal</th>
                <th className="py-3 pr-4 font-semibold">Usia</th>
                <th className="py-3 pr-4 font-semibold">Tinggi</th>
                <th className="py-3 pr-4 font-semibold">Berat</th>
                <th className="py-3 pr-4 font-semibold">Status Pertumbuhan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {measurements.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-5 text-center text-slate-500">
                    Belum ada pemeriksaan.
                  </td>
                </tr>
              ) : (
                [...measurements].reverse().map((item) => (
                  <tr key={item.id}>
                    <td className="py-3 pr-4 text-slate-600">{new Date(item.measurement_date).toLocaleDateString("id-ID")}</td>
                    <td className="py-3 pr-4 text-slate-600">{item.age_month} bulan</td>
                    <td className="py-3 pr-4 text-slate-600">{item.height_cm} cm</td>
                    <td className="py-3 pr-4 text-slate-600 font-semibold">{item.weight_kg ?? "-"} kg</td>
                    <td className="py-3 pr-4"><KmsStatusBadge value={item.kms_status} /></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
