import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Baby,
  BookOpen,
  CalendarDays,
  ClipboardPlus,
  HeartPulse,
  MessageSquareText,
  Sparkles,
  Users,
} from "lucide-react";

import StatCard from "../components/StatCard";
import { ErrorBlock, LoadingBlock } from "../components/StateBlock";
import { api } from "../services/api";
import { getCurrentUser } from "../services/auth";
import type { Child } from "../types";

const tips = [
  "💡 ASI eksklusif selama 6 bulan pertama adalah fondasi terbaik untuk tumbuh kembang anak.",
  "💡 Pemeriksaan rutin setiap bulan ke Posyandu membantu mendeteksi masalah pertumbuhan sejak dini.",
  "💡 Variasi makanan bergizi (protein hewani, sayur, buah) penting setelah usia 6 bulan.",
  "💡 Imunisasi lengkap membantu melindungi anak dari penyakit yang bisa menghambat pertumbuhan.",
];

export default function ParentDashboardPage() {
  const user = getCurrentUser();
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const dailyTip = tips[new Date().getDate() % tips.length];

  useEffect(() => {
    api
      .getChildren()
      .then(setChildren)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingBlock />;
  if (error) return <ErrorBlock message={error} />;

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div className="rounded-2xl border border-brand-100/80 bg-gradient-to-r from-brand-50/80 via-white to-care-50/60 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-brand-700">Selamat datang kembali 👋</p>
            <h2 className="mt-1 font-heading text-2xl font-extrabold text-slate-950">
              {user?.name ?? "Orang Tua"}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Pantau pertumbuhan anak Anda dan lakukan skrining risiko stunting secara berkala.
            </p>
          </div>
          <Link
            to="/app/predict"
            className="inline-flex items-center gap-2 whitespace-nowrap rounded-full bg-gradient-to-r from-care-600 to-care-700 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-care-700/20 transition hover:shadow-xl"
          >
            <HeartPulse className="h-4 w-4" />
            Cek Risiko Sekarang
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard title="Data Anak Tersimpan" value={children.length} icon={<Baby className="h-5 w-5" />} tone="green" />
        <StatCard title="Skrining Cepat" value="Aktif" icon={<ClipboardPlus className="h-5 w-5" />} tone="blue" />
        <StatCard title="Konsultasi" value="Tersedia" icon={<MessageSquareText className="h-5 w-5" />} tone="amber" />
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          {
            to: "/app/predict",
            icon: ClipboardPlus,
            title: "Prediksi Cepat",
            desc: "Cek risiko tanpa menyimpan data",
            gradient: "from-emerald-500/10 to-teal-500/10",
            iconColor: "text-emerald-600",
          },
          {
            to: "/app/consultations",
            icon: MessageSquareText,
            title: "Konsultasi Petugas",
            desc: "Ajukan pertanyaan ke petugas kesehatan",
            gradient: "from-blue-500/10 to-cyan-500/10",
            iconColor: "text-blue-600",
          },
          {
            to: "/chatbot",
            icon: BookOpen,
            title: "Edukasi Gizi",
            desc: "Tanya AI tentang gizi dan stunting",
            gradient: "from-violet-500/10 to-purple-500/10",
            iconColor: "text-violet-600",
          },
        ].map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.to}
              to={action.to}
              className="group flex items-start gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-lg hover:shadow-brand-900/[0.06]"
            >
              <span className={`rounded-2xl bg-gradient-to-br ${action.gradient} p-3`}>
                <Icon className={`h-5 w-5 ${action.iconColor}`} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-slate-950 group-hover:text-brand-700">{action.title}</p>
                <p className="mt-1 text-sm text-slate-500">{action.desc}</p>
              </div>
              <ArrowRight className="mt-1 h-4 w-4 text-slate-300 transition group-hover:text-brand-500" />
            </Link>
          );
        })}
      </div>

      {/* Children List */}
      <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-brand-700" />
            <div>
              <h3 className="text-base font-semibold text-slate-950">Anak Terdaftar</h3>
              <p className="mt-0.5 text-sm text-slate-500">Data anak yang sudah disimpan di sistem.</p>
            </div>
          </div>
          <Link to="/app/children" className="inline-flex items-center gap-2 rounded-lg bg-care-600 px-4 py-2 text-sm font-semibold text-white hover:bg-care-700">
            Kelola Data Anak
          </Link>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {children.length === 0 ? (
            <div className="col-span-full rounded-xl border border-dashed border-slate-200 p-8 text-center">
              <Baby className="mx-auto h-10 w-10 text-slate-300" />
              <p className="mt-3 text-sm font-semibold text-slate-500">Belum ada data anak</p>
              <p className="mt-1 text-xs text-slate-400">Tambahkan data anak untuk memulai pemantauan pertumbuhan.</p>
              <Link to="/app/children" className="mt-4 inline-flex items-center gap-2 rounded-lg bg-brand-50 px-4 py-2 text-sm font-bold text-brand-700 hover:bg-brand-100">
                Tambah Anak Pertama
              </Link>
            </div>
          ) : (
            children.slice(0, 6).map((child) => (
              <Link
                key={child.id}
                to={`/app/children/${child.id}`}
                className="group flex items-center gap-4 rounded-xl border border-slate-200 p-4 transition hover:border-brand-200 hover:bg-brand-50/30"
              >
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">
                  {child.name.charAt(0).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-950 group-hover:text-brand-700">{child.name}</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {child.gender === "male" ? "Laki-laki" : "Perempuan"}
                    {child.posyandu_area ? ` · ${child.posyandu_area}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-1 text-xs text-slate-400">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {new Date(child.birth_date).toLocaleDateString("id-ID", { year: "numeric", month: "short" })}
                </div>
              </Link>
            ))
          )}
        </div>
      </section>

      {/* Daily Tip */}
      <div className="rounded-2xl border border-amber-100/80 bg-gradient-to-r from-amber-50 to-amber-50/50 p-5">
        <div className="flex items-start gap-3">
          <Sparkles className="mt-0.5 h-5 w-5 flex-none text-amber-500" />
          <div>
            <p className="text-sm font-bold text-amber-800">Tips Harian</p>
            <p className="mt-1 text-sm leading-6 text-amber-700">{dailyTip}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
