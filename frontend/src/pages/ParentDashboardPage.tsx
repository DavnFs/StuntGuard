import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  Baby,
  CheckCircle2,
  ClipboardPlus,
  HeartPulse,
  Sparkle,
  Sparkles,
  TrendingUp,
} from "lucide-react";

import { ErrorBlock, LoadingBlock } from "../components/StateBlock";
import { KmsStatusBadge } from "../components/StatusBadge";
import { KmsChart } from "../components/KmsChart";
import { api } from "../services/api";
import { getCurrentUser } from "../services/auth";
import type { ChildWithMeasurements, MeasurementBrief, ParentDashboardResponse } from "../types";

const KMS_BANNER: Record<string, { bg: string; border: string; icon: typeof CheckCircle2; iconColor: string; title: string; message: string }> = {
  Normal: {
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    icon: CheckCircle2,
    iconColor: "text-emerald-600",
    title: "Pertumbuhan Sesuai Jalur StuntGuard ✅",
    message: "Grafik bulan ini bagus! Pertumbuhan anak Anda sesuai jalur StuntGuard. Terus jaga pola makan seimbang dan lakukan pemeriksaan secara rutin.",
  },
  "Gizi Kurang": {
    bg: "bg-red-50",
    border: "border-red-200",
    icon: AlertTriangle,
    iconColor: "text-red-600",
    title: "Perhatian: Berat Badan di Bawah Garis Merah",
    message: "Grafik menunjukkan berat badan anak berada di bawah garis merah pertumbuhan. Segera konsultasikan ke tenaga kesehatan atau Puskesmas dan perbaiki asupan gizi dengan protein hewani (telur, ikan, ayam).",
  },
  "Gizi Lebih": {
    bg: "bg-amber-50",
    border: "border-amber-200",
    icon: TrendingUp,
    iconColor: "text-amber-600",
    title: "Perhatian: Berat Badan di Atas Normal",
    message: "Berat badan anak di atas zona normal pertumbuhan. Perhatikan porsi makan, kurangi makanan tinggi gula & lemak, dan tingkatkan aktivitas fisik sesuai usia.",
  },
  Obesitas: {
    bg: "bg-orange-50",
    border: "border-orange-200",
    icon: AlertTriangle,
    iconColor: "text-orange-600",
    title: "Perhatian: Risiko Obesitas",
    message: "Berat badan anak jauh di atas zona normal pertumbuhan. Konsultasikan pola makan ke petugas kesehatan atau Puskesmas untuk panduan lebih lanjut.",
  },
};

const tips = [
  "💡 ASI eksklusif selama 6 bulan pertama adalah fondasi terbaik untuk tumbuh kembang anak.",
  "💡 Pemeriksaan rutin setiap bulan ke tenaga kesehatan membantu mendeteksi masalah pertumbuhan sejak dini.",
  "💡 Variasi makanan bergizi (protein hewani, sayur, buah) penting setelah usia 6 bulan.",
  "💡 Imunisasi lengkap membantu melindungi anak dari penyakit yang bisa menghambat pertumbuhan.",
];

export default function ParentDashboardPage() {
  const user = getCurrentUser();
  const navigate = useNavigate();
  const [data, setData] = useState<ParentDashboardResponse | null>(null);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const dailyTip = tips[new Date().getDate() % tips.length];

  useEffect(() => {
    api
      .getParentDashboard()
      .then((res) => {
        setData(res);
        setSelectedIdx(0);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const children: ChildWithMeasurements[] = data?.children || [];
  const selectedChild: ChildWithMeasurements | undefined = children[selectedIdx];
  const measurements: MeasurementBrief[] = selectedChild?.measurements || [];
  const latestMeasurement: MeasurementBrief | undefined = measurements.length > 0 ? measurements[measurements.length - 1] : undefined;
  const latestStatus = latestMeasurement?.kms_status ?? "Normal";
  const banner = KMS_BANNER[latestStatus] ?? KMS_BANNER.Normal;
  const BannerIcon = banner.icon;

  const navigateToAIChat = useCallback(() => {
    if (!selectedChild || !latestMeasurement) return;

    const measurements = selectedChild.measurements;
    const childName = selectedChild.name;
    const age = latestMeasurement.age_month;
    const weight = latestMeasurement.weight_kg;
    const height = latestMeasurement.height_cm;
    const status = latestMeasurement.kms_status;

    let trend = "Data baru pertama";
    if (measurements.length >= 2) {
      const prev = measurements[measurements.length - 2];
      const curr = measurements[measurements.length - 1];
      if (prev.weight_kg != null && curr.weight_kg != null) {
        const diff = curr.weight_kg - prev.weight_kg;
        if (diff < -0.1) trend = `BB turun ${Math.abs(diff).toFixed(1)}kg dari bulan lalu`;
        else if (diff > 0.1) trend = `BB naik ${diff.toFixed(1)}kg dari bulan lalu`;
        else trend = "BB stabil dari bulan lalu";
      }
    }

    const contextText = `${childName}, Usia ${age} bulan, BB ${weight ?? "?"}kg, TB ${height ?? "?"}cm. Status KMS Terakhir: ${status}. Tren: ${trend}.`;

    navigate("/app/chatbot", {
      state: {
        childContext: contextText,
        childName,
      },
    });
  }, [selectedChild, latestMeasurement, navigate]);

  if (loading) return <LoadingBlock />;
  if (error) return <ErrorBlock message={error} />;
  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Greeting Banner */}
      <div className="relative overflow-hidden rounded-[2rem] border border-cyan-500/10 bg-gradient-to-r from-cyan-600 via-teal-600 to-emerald-600 p-6 sm:p-8 text-white shadow-xl shadow-cyan-900/10">
        <div className="pointer-events-none absolute -right-24 -top-24 h-56 w-56 rounded-full bg-white/10 blur-2xl animate-pulse" />
        <div className="pointer-events-none absolute -left-16 -bottom-16 h-48 w-48 rounded-full bg-white/5 blur-2xl" />
        <div className="relative z-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-1 text-xs font-bold tracking-wide border border-white/10 backdrop-blur-sm">
              <Sparkle className="h-3.5 w-3.5 text-amber-200" style={{ animationDuration: "6s" }} />
              Grafik Pertumbuhan StuntGuard
            </div>
            <h2 className="mt-4 font-heading text-3xl font-extrabold tracking-tight">
              Halo, {data.parent_name ?? user?.name ?? "Orang Tua"}!
            </h2>
            <p className="mt-2 text-sm text-cyan-50 max-w-xl leading-relaxed">
              Pantau Kartu Menuju Sehat anak Anda secara digital. Lihat grafik pertumbuhan, status gizi, dan dapatkan saran praktis.
            </p>
          </div>
          <Link
            to="/app/children"
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl bg-white px-5 py-4 text-sm font-bold text-cyan-800 hover:bg-slate-50 shadow-md transition duration-200 shrink-0 self-start sm:self-auto"
          >
            <HeartPulse className="h-4 w-4 text-cyan-600" />
            Data Anak
          </Link>
        </div>
      </div>

      {children.length === 0 ? (
        /* Empty state */
        <div className="rounded-[2rem] border-2 border-dashed border-slate-200 p-10 text-center flex flex-col items-center">
          <div className="rounded-full bg-cyan-50 p-4 border border-cyan-100">
            <Baby className="h-8 w-8 text-cyan-400" />
          </div>
          <p className="mt-4 text-sm font-bold text-slate-700">Belum ada anak yang didaftarkan</p>
          <p className="mt-1 text-xs text-slate-400 max-w-xs leading-normal">
            Daftarkan anak Anda untuk mulai memantau pertumbuhan melalui StuntGuard.
          </p>
          <Link
            to="/app/children"
            className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-cyan-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-cyan-700 transition"
          >
            Daftarkan Anak Pertama
          </Link>
        </div>
      ) : (
        <>
          {/* Child Selector Tabs */}
          {children.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
              {children.map((child, idx) => (
                <button
                  key={child.id}
                  type="button"
                  onClick={() => setSelectedIdx(idx)}
                  className={`inline-flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-bold transition ${
                    idx === selectedIdx
                      ? "bg-cyan-600 text-white shadow-sm"
                      : "border border-slate-200 bg-white text-slate-600 hover:border-cyan-200 hover:bg-cyan-50"
                  }`}
                >
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-xs font-extrabold">
                    {child.name.charAt(0).toUpperCase()}
                  </span>
                  {child.name}
                </button>
              ))}
            </div>
          )}

          {selectedChild && (
            <>
              {/* Status Pertumbuhan Banner */}
              {latestMeasurement && (
                <div className={`flex items-start gap-4 rounded-2xl border ${banner.border} ${banner.bg} p-5 shadow-sm`}>
                  <div className={`rounded-xl p-2.5 ${banner.bg}`}>
                    <BannerIcon className={`h-6 w-6 ${banner.iconColor}`} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{banner.title}</h4>
                    <p className="mt-1 text-xs text-slate-700 leading-relaxed">{banner.message}</p>
                  </div>
                </div>
              )}

              {/* Grafik Pertumbuhan */}
              <section className="rounded-[2rem] border border-slate-200/60 bg-white p-6 shadow-xl shadow-cyan-900/[0.01]">
                <div className="flex items-center gap-3 mb-4">
                  <div className="rounded-xl bg-cyan-50 p-2.5 border border-cyan-100 text-cyan-600">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-950">
                      Grafik Pertumbuhan StuntGuard — {selectedChild.name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Berat badan vs usia berdasarkan standar WHO
                    </p>
                  </div>
                </div>

                {measurements.length === 0 ? (
                  <div className="rounded-2xl border-2 border-dashed border-slate-200 p-8 text-center">
                    <p className="text-sm text-slate-500">Belum ada data pengukuran. Tambahkan pengukuran pertama.</p>
                    <Link
                      to={`/app/children/${selectedChild.id}`}
                      className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-cyan-600 px-4 py-2 text-xs font-bold text-white hover:bg-cyan-700"
                    >
                      <ClipboardPlus className="h-3.5 w-3.5" />
                      Tambah Pengukuran
                    </Link>
                  </div>
                ) : (
                  <>
                    {/* Chart Legend */}
                    <div className="flex flex-wrap gap-3 mb-4 text-xs font-medium">
                      <span className="flex items-center gap-1.5"><span className="h-3 w-6 rounded bg-[#fee2e2] border border-red-200" /> BGM (Garis Merah)</span>
                      <span className="flex items-center gap-1.5"><span className="h-3 w-6 rounded bg-[#fef9c3] border border-yellow-200" /> Kurang</span>
                      <span className="flex items-center gap-1.5"><span className="h-3 w-6 rounded bg-[#dcfce7] border border-green-200" /> Normal</span>
                      <span className="flex items-center gap-1.5"><span className="h-3 w-6 rounded bg-[#fff7ed] border border-orange-200" /> Lebih</span>
                      <span className="flex items-center gap-1.5"><span className="h-2.5 w-6 rounded bg-slate-900" /> Berat Anak</span>
                    </div>
                    <KmsChart measurements={measurements} />

                    {/* Consult AI button */}
                    <div className="mt-5 flex justify-center">
                      <button
                        type="button"
                        onClick={navigateToAIChat}
                        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-cyan-900/10 transition hover:shadow-cyan-900/20 hover:scale-[1.02] active:scale-[0.98]"
                      >
                        <Sparkles className="h-4 w-4" />
                        Konsultasikan Grafik Ini ke AI
                      </button>
                    </div>
                  </>
                )}
              </section>

              {/* Measurement History Table */}
              {measurements.length > 0 && (
                <section className="rounded-[2rem] border border-slate-200/60 bg-white p-6 shadow-xl shadow-cyan-900/[0.01]">
                  <h3 className="text-base font-bold text-slate-950 mb-4">Riwayat Pengukuran</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200 text-sm">
                      <thead>
                        <tr className="text-left text-slate-500">
                          <th className="py-3 pr-4 font-semibold">Tanggal</th>
                          <th className="py-3 pr-4 font-semibold">Usia</th>
                          <th className="py-3 pr-4 font-semibold">Berat</th>
                          <th className="py-3 pr-4 font-semibold">Tinggi</th>
                          <th className="py-3 pr-4 font-semibold">Status Pertumbuhan</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {[...measurements].reverse().map((m) => (
                          <tr key={m.id}>
                            <td className="py-3 pr-4 text-slate-600">{new Date(m.measurement_date).toLocaleDateString("id-ID")}</td>
                            <td className="py-3 pr-4 text-slate-600">{m.age_month} bulan</td>
                            <td className="py-3 pr-4 text-slate-600 font-semibold">{m.weight_kg ?? "-"} kg</td>
                            <td className="py-3 pr-4 text-slate-600">{m.height_cm} cm</td>
                            <td className="py-3 pr-4"><KmsStatusBadge value={m.kms_status} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}
            </>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            {[
              {
                to: selectedChild ? `/app/children/${selectedChild.id}` : "/app/children",
                icon: ClipboardPlus,
                title: "Tambah Pengukuran",
                desc: "Catat berat & tinggi badan terbaru anak",
                iconBg: "bg-cyan-50 text-cyan-600 border-cyan-100",
              },
              {
                to: "/app/chatbot",
                icon: Sparkles,
                title: "Asisten AI",
                desc: "Tanya AI tentang grafik pertumbuhan & saran gizi",
                iconBg: "bg-violet-50 text-violet-600 border-violet-100",
              },
            ].map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.title}
                  to={action.to}
                  className="group flex items-start gap-4 rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-cyan-500/20 hover:shadow-lg"
                >
                  <span className={`inline-flex rounded-xl border p-3.5 shrink-0 ${action.iconBg}`}>
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-slate-900 group-hover:text-cyan-600 transition-colors">{action.title}</p>
                    <p className="mt-1 text-xs text-slate-500 leading-normal">{action.desc}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </>
      )}

      {/* Daily Tips */}
      <div className="rounded-[2.5rem] border border-amber-500/10 bg-amber-500/[0.03] p-6 shadow-sm flex gap-4 items-start backdrop-blur-sm">
        <div className="rounded-2xl bg-amber-100 p-3 border border-amber-250 text-amber-700 shrink-0">
          <Sparkles className="h-5 w-5 text-amber-600 animate-pulse" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-amber-950">Tips Edukasi Gizi Hari Ini</h4>
          <p className="mt-2 text-xs font-medium leading-relaxed text-amber-850">{dailyTip}</p>
        </div>
      </div>
    </div>
  );
}
