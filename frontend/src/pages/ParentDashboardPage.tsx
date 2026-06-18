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
  Calendar,
  Sparkle,
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
      
      {/* Redesigned Greeting Banner */}
      <div className="relative overflow-hidden rounded-[2rem] border border-cyan-500/10 bg-gradient-to-r from-cyan-600 via-teal-600 to-emerald-600 p-6 sm:p-8 text-white shadow-xl shadow-cyan-900/10">
        {/* Floating circles inside greeting banner */}
        <div className="pointer-events-none absolute -right-24 -top-24 h-56 w-56 rounded-full bg-white/10 blur-2xl animate-pulse-glow" />
        <div className="pointer-events-none absolute -left-16 -bottom-16 h-48 w-48 rounded-full bg-white/5 blur-2xl" />

        <div className="relative z-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-1 text-xs font-bold text-white tracking-wide border border-white/10 backdrop-blur-sm">
              <Sparkle className="h-3.5 w-3.5 text-amber-200 animate-spin" style={{ animationDuration: "6s" }} />
              Selamat Datang Kembali
            </div>
            <h2 className="mt-4 font-heading text-3xl font-extrabold text-white tracking-tight">
              {user?.name ?? "Orang Tua"}
            </h2>
            <p className="mt-2 text-sm text-cyan-50 max-w-xl leading-relaxed">
              Pantau riwayat ukuran tubuh (tinggi & berat) anak Anda secara langsung dan lakukan deteksi risiko stunting secara berkala untuk menjaga tumbuh kembang optimal.
            </p>
          </div>
          
          <Link
            to="/app/predict"
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl bg-white px-5 py-4 text-sm font-bold text-cyan-850 hover:bg-slate-50 shadow-md transition duration-200 shrink-0 self-start sm:self-auto"
          >
            <HeartPulse className="h-4 w-4 text-cyan-600" />
            Skrining Mandiri Baru
          </Link>
        </div>
      </div>

      {/* Stats Cards Section */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard title="Data Anak Tersimpan" value={children.length} icon={<Baby className="h-5 w-5" />} tone="green" />
        <StatCard title="Skrining Cepat" value="Aktif" icon={<ClipboardPlus className="h-5 w-5" />} tone="blue" />
        <StatCard title="Konsultasi Petugas" value="Tersedia" icon={<MessageSquareText className="h-5 w-5" />} tone="amber" />
      </div>

      {/* Quick Actions Shortcuts */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          {
            to: "/app/predict",
            icon: ClipboardPlus,
            title: "Prediksi Cepat",
            desc: "Analisis stunting cepat tanpa rekam database",
            gradient: "from-cyan-500/10 to-teal-500/10",
            iconBg: "bg-cyan-50 text-cyan-600 border-cyan-100",
          },
          {
            to: "/app/consultations",
            icon: MessageSquareText,
            title: "Konsultasi Posyandu",
            desc: "Hubungi kader kesehatan untuk bimbingan gizi",
            gradient: "from-blue-500/10 to-indigo-500/10",
            iconBg: "bg-blue-50 text-blue-600 border-blue-100",
          },
          {
            to: "/chatbot",
            icon: BookOpen,
            title: "Tanya AI Gizi",
            desc: "Pelajari anjuran MPASI dari asisten cerdas AI",
            gradient: "from-violet-500/10 to-purple-500/10",
            iconBg: "bg-violet-50 text-violet-600 border-violet-100",
          },
        ].map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.to}
              to={action.to}
              onClick={(e) => {
                if (action.to === "/chatbot") {
                  e.preventDefault();
                  window.dispatchEvent(new CustomEvent("open-chatbot"));
                }
              }}
              className="group flex items-start gap-4 rounded-2xl border border-slate-200/60 bg-white p-5 shadow-sm transition duration-350 hover:-translate-y-0.5 hover:border-cyan-500/20 hover:shadow-lg"
            >
              <span className={`inline-flex rounded-xl border p-3.5 shrink-0 ${action.iconBg}`}>
                <Icon className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-slate-900 group-hover:text-cyan-600 transition-colors">{action.title}</p>
                <p className="mt-1 text-xs text-slate-500 leading-normal">{action.desc}</p>
              </div>
              <ArrowRight className="mt-1 h-4 w-4 text-slate-350 transition-transform group-hover:translate-x-1 group-hover:text-cyan-600 shrink-0" />
            </Link>
          );
        })}
      </div>

      {/* Children List Widget */}
      <section className="rounded-[2rem] border border-slate-200/60 bg-white p-6 shadow-xl shadow-cyan-900/[0.01]">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-cyan-50 p-2.5 border border-cyan-100 text-cyan-600">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-950">Daftar Anak Terdaftar</h3>
              <p className="text-xs text-slate-500 mt-0.5">Pantau riwayat tumbuh kembang & kurva pertumbuhan anak.</p>
            </div>
          </div>
          <Link to="/app/children" className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 transition">
            Kelola Data Anak
          </Link>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {children.length === 0 ? (
            <div className="col-span-full rounded-2xl border-2 border-dashed border-slate-200 p-10 text-center flex flex-col items-center">
              <div className="rounded-full bg-cyan-50 p-4 border border-cyan-100 animate-float-slow">
                <Baby className="h-8 w-8 text-cyan-400" />
              </div>
              <p className="mt-4 text-sm font-bold text-slate-700">Belum ada anak yang didaftarkan</p>
              <p className="mt-1 text-xs text-slate-400 max-w-xs leading-normal">Simpan data tinggi & berat badan anak agar petugas posyandu dapat memantau perkembangannya.</p>
              <Link to="/app/children" className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-cyan-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-cyan-700 transition">
                Daftarkan Anak Pertama
              </Link>
            </div>
          ) : (
            children.slice(0, 6).map((child) => (
              <Link
                key={child.id}
                to={`/app/children/${child.id}`}
                className="group flex items-center gap-4 rounded-2xl border border-slate-150 p-4 transition duration-300 hover:border-cyan-500/20 hover:bg-cyan-500/[0.01]"
              >
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-50 border border-cyan-100 text-sm font-extrabold text-cyan-700 transition-colors group-hover:bg-cyan-600 group-hover:text-white">
                  {child.name.charAt(0).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-slate-900 group-hover:text-cyan-600 transition-colors truncate">{child.name}</p>
                  <p className="mt-0.5 text-xs text-slate-400 font-medium">
                    {child.gender === "male" ? "Laki-Laki" : "Perempuan"}
                    {child.posyandu_area ? ` · Wilayah Posyandu ${child.posyandu_area}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 shrink-0">
                  <Calendar className="h-3.5 w-3.5 text-slate-350" />
                  {new Date(child.birth_date).toLocaleDateString("id-ID", { year: "numeric", month: "short" })}
                </div>
              </Link>
            ))
          )}
        </div>
      </section>

      {/* Headspace-style daily tips */}
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
