import { FormEvent, useState } from "react";
import {
  Activity,
  ArrowRight,
  Baby,
  BookOpen,
  CheckCircle2,
  HeartPulse,
  LogIn,
  MessageCircle,
  Minus,
  Plus,
  Ruler,
  Scale,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react";
import { Link } from "react-router-dom";

import PredictionResultCard from "../components/PredictionResultCard";
import { ErrorBlock } from "../components/StateBlock";
import { api } from "../services/api";
import type { ChatChildContext, Gender, PredictionRequest, PredictionResponse } from "../types";

const DISCLAIMER =
  "Hasil ini merupakan skrining awal dan bukan diagnosis medis. Silakan konsultasikan ke petugas kesehatan atau Puskesmas untuk pemeriksaan lanjutan.";

const highlights: Array<{ title: string; text: string; icon: LucideIcon; gradient: string }> = [
  {
    title: "Pantau pertumbuhan anak",
    text: "Catat tinggi dan berat anak secara berkala untuk melihat tren pertumbuhan.",
    icon: HeartPulse,
    gradient: "from-emerald-500/10 to-teal-500/10",
  },
  {
    title: "Kenali risiko lebih awal",
    text: "Dapatkan sinyal awal jika pertumbuhan anak memerlukan perhatian lebih.",
    icon: ShieldCheck,
    gradient: "from-cyan-500/10 to-blue-500/10",
  },
  {
    title: "Edukasi gizi dengan AI",
    text: "Pelajari informasi gizi yang aman dan mudah dipahami dari asisten AI.",
    icon: BookOpen,
    gradient: "from-violet-500/10 to-purple-500/10",
  },
  {
    title: "Konsultasi dengan petugas",
    text: "Lanjutkan ke Posyandu atau Puskesmas bila diperlukan melalui sistem konsultasi.",
    icon: Stethoscope,
    gradient: "from-amber-500/10 to-orange-500/10",
  },
];

function clamp(value: number, min: number, max: number) {
  if (Number.isNaN(value)) return min;
  return Math.min(max, Math.max(min, value));
}

function roundOne(value: number) {
  return Math.round(value * 10) / 10;
}

/* ---------- Hero Illustration (inline SVG) ---------- */
function HeroIllustration() {
  return (
    <div className="relative mx-auto w-full max-w-sm" aria-hidden="true">
      <svg viewBox="0 0 400 360" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full drop-shadow-xl">
        {/* Background circle */}
        <circle cx="200" cy="180" r="150" fill="url(#heroGrad)" opacity="0.15" />
        <circle cx="200" cy="180" r="110" fill="url(#heroGrad)" opacity="0.1" />

        {/* Growth chart bars */}
        <rect x="90" y="230" width="28" height="60" rx="6" fill="#06b6d4" opacity="0.3" />
        <rect x="130" y="210" width="28" height="80" rx="6" fill="#06b6d4" opacity="0.45" />
        <rect x="170" y="185" width="28" height="105" rx="6" fill="#06b6d4" opacity="0.6" />
        <rect x="210" y="160" width="28" height="130" rx="6" fill="#06b6d4" opacity="0.75" />
        <rect x="250" y="140" width="28" height="150" rx="6" fill="#06b6d4" opacity="0.9" />
        <rect x="290" y="120" width="28" height="170" rx="6" fill="#0891b2" />

        {/* Trend line */}
        <polyline
          points="104,225 144,205 184,180 224,155 264,135 304,115"
          stroke="#10b981"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />

        {/* Dots on trend line */}
        {[
          [104, 225],
          [144, 205],
          [184, 180],
          [224, 155],
          [264, 135],
          [304, 115],
        ].map(([cx, cy], i) => (
          <circle key={i} cx={cx} cy={cy} r="5" fill="#10b981" stroke="#fff" strokeWidth="2" />
        ))}

        {/* Heart icon top-right */}
        <g transform="translate(310,70)">
          <circle cx="0" cy="0" r="22" fill="#fef3c7" />
          <path
            d="M0-8C-3-14-12-14-12-8C-12-2 0 8 0 8S12-2 12-8C12-14 3-14 0-8Z"
            fill="#f59e0b"
            opacity="0.8"
          />
        </g>

        {/* Shield icon top-left */}
        <g transform="translate(85,85)">
          <circle cx="0" cy="0" r="20" fill="#ecfdf5" />
          <path
            d="M0-10L-8-6V0C-8 6 0 10 0 10S8 6 8 0V-6L0-10Z"
            fill="#10b981"
            opacity="0.7"
          />
          <path d="M-3 0L-1 2L3-2" stroke="#fff" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </g>

        {/* Child silhouette center-left */}
        <g transform="translate(60,250)">
          <circle cx="0" cy="-15" r="10" fill="#0e7490" opacity="0.5" />
          <path d="M-8 0C-8-5-5-8 0-8S8-5 8 0V20H-8V0Z" fill="#0e7490" opacity="0.4" rx="4" />
        </g>

        <defs>
          <linearGradient id="heroGrad" x1="50" y1="30" x2="350" y2="330">
            <stop stopColor="#06b6d4" />
            <stop offset="1" stopColor="#10b981" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

export default function LandingPage() {
  const [form, setForm] = useState<PredictionRequest>({
    age_month: 24,
    gender: "female",
    height_cm: 82.5,
    weight_kg: 10.4,
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
      window.setTimeout(() => {
        document.getElementById("hasil")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 80);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Prediksi gagal");
    } finally {
      setLoading(false);
    }
  };

  const checkAgain = () => {
    setResult(null);
    document.getElementById("cek")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <main className="min-h-screen bg-canvas text-slate-950">
      {/* ── Navbar ── */}
      <nav className="sticky top-0 z-30 border-b border-brand-100/60 bg-white/90 shadow-sm backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <a href="#hero" className="flex items-center gap-3">
            <img src="/logo.png" alt="StuntGuard" className="h-10 w-10 rounded-xl object-contain" />
            <span>
              <span className="block font-heading text-lg font-extrabold text-slate-950">StuntGuard</span>
              <span className="hidden text-[10px] font-bold uppercase tracking-[0.14em] text-brand-700 sm:block">Tumbuh terpantau</span>
            </span>
          </a>
          <div className="hidden items-center gap-6 text-sm font-semibold text-slate-600 md:flex">
            <a href="#cek" className="transition hover:text-brand-700">Cek Stunting</a>
            <Link to="/chatbot" className="transition hover:text-brand-700">Edukasi</Link>
            <a href="#tentang" className="transition hover:text-brand-700">Tentang</a>
            <Link to="/login" className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-care-600 to-care-700 px-5 py-2.5 text-white shadow-lg shadow-care-700/20 transition hover:shadow-care-700/30">
              <LogIn className="h-4 w-4" />
              Login / Daftar
            </Link>
          </div>
          <Link to="/login" className="inline-flex min-h-11 items-center rounded-full border border-brand-200 px-3.5 py-2 text-xs font-bold text-brand-700 md:hidden">
            Login
          </Link>
        </div>
        <div className="no-scrollbar mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 pb-3 text-xs font-bold text-slate-600 sm:px-6 md:hidden">
          <a href="#cek" className="whitespace-nowrap rounded-full bg-care-50 px-3 py-1.5">Cek Stunting</a>
          <Link to="/chatbot" className="whitespace-nowrap rounded-full bg-care-50 px-3 py-1.5">Edukasi</Link>
          <a href="#tentang" className="whitespace-nowrap rounded-full bg-care-50 px-3 py-1.5">Tentang</a>
        </div>
      </nav>

      {/* ── Hero Section ── */}
      <section id="hero" className="relative overflow-hidden border-b border-brand-100/50">
        {/* Background decorations */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-brand-50/80 via-white to-care-50/60" />
        <div className="pointer-events-none absolute -left-32 top-20 h-80 w-80 rounded-full bg-brand-200/30 blur-[100px]" />
        <div className="pointer-events-none absolute -right-24 bottom-0 h-96 w-96 rounded-full bg-care-200/30 blur-[100px]" />
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-60 w-60 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-100/25 blur-[80px]" />

        <div className="relative mx-auto grid max-w-7xl gap-8 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:gap-12 lg:px-8 lg:py-24">
          <div className="flex flex-col justify-center">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-brand-200/70 bg-white/80 px-4 py-2 text-sm font-bold text-brand-800 shadow-sm backdrop-blur-sm">
              <Sparkles className="h-4 w-4 text-amber-500" />
              Skrining awal untuk orang tua
            </div>
            <h1 className="mt-6 max-w-xl font-heading text-4xl font-extrabold leading-[1.08] text-slate-950 sm:text-5xl lg:text-[3.4rem]">
              Pantau tumbuh kembang.{" "}
              <span className="bg-gradient-to-r from-brand-700 to-care-600 bg-clip-text text-transparent">
                Ambil langkah lebih awal.
              </span>
            </h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-slate-600 sm:text-lg">
              StuntGuard membantu orang tua melakukan skrining awal risiko stunting dari data pertumbuhan anak — mudah, cepat, dan tanpa login.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <a
                href="#cek"
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-care-600 to-care-700 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-care-700/25 transition hover:shadow-xl hover:shadow-care-700/30"
              >
                <HeartPulse className="h-4 w-4" />
                Cek Risiko Sekarang
                <ArrowRight className="h-4 w-4" />
              </a>
              <Link
                to="/chatbot"
                className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white px-6 py-3.5 text-sm font-bold text-brand-800 shadow-sm transition hover:bg-brand-50 hover:shadow-md"
              >
                <MessageCircle className="h-4 w-4" />
                Tanya AI Tentang Stunting
              </Link>
            </div>
            <div className="mt-7 flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold text-slate-600">
              {["Tanpa login", "Hasil mudah dipahami", "Saran langkah berikutnya"].map((item) => (
                <span key={item} className="inline-flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-care-600" />
                  {item}
                </span>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-center lg:pl-8">
            <HeroIllustration />
          </div>
        </div>
      </section>

      {/* ── Form Cek Stunting ── */}
      <section id="cek" className="relative border-b border-brand-100/50 bg-gradient-to-b from-white to-brand-50/40">
        <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-sm font-bold uppercase tracking-wider text-brand-700">Cek Risiko Stunting</p>
            <h2 className="mt-2 font-heading text-3xl font-extrabold text-slate-950 sm:text-4xl">Masukkan data pertumbuhan anak</h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-500">
              Pastikan pengukuran tinggi dan berat dilakukan seakurat mungkin. Data tidak disimpan di server.
            </p>
          </div>

          {error ? <div className="mt-6"><ErrorBlock message={error} /></div> : null}

          <form
            className="mt-8 rounded-[2rem] border border-brand-100/80 bg-white p-5 shadow-xl shadow-brand-900/[0.04] sm:p-8"
            onSubmit={submit}
          >
            {/* Gender selection */}
            <div>
              <p className="text-sm font-bold text-slate-950">Jenis Kelamin Anak</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
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
                      className={`flex items-center gap-3 rounded-xl border-2 p-4 text-left transition duration-200 ${
                        selected
                          ? "border-brand-500 bg-brand-50 shadow-md shadow-brand-500/10"
                          : "border-slate-200 bg-white hover:border-brand-200 hover:bg-brand-50/30"
                      }`}
                    >
                      <span className={`rounded-xl p-3 transition ${selected ? "bg-gradient-to-br from-brand-600 to-brand-700 text-white shadow-sm" : "bg-slate-100 text-slate-500"}`}>
                        <Icon className="h-5 w-5" />
                      </span>
                      <span>
                        <span className="block font-bold text-slate-950">{item.label}</span>
                        <span className="text-xs text-slate-400">Pilih jenis kelamin</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Numeric inputs */}
            <div className="mt-6 grid gap-4 lg:grid-cols-3">
              {/* Age */}
              <div className="rounded-2xl border border-slate-200/80 bg-gradient-to-br from-slate-50/80 to-brand-50/30 p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Usia Anak</p>
                    <p className="mt-1 font-heading text-3xl font-extrabold text-brand-700">{form.age_month} <span className="text-lg font-bold text-slate-400">bulan</span></p>
                  </div>
                  <Baby className="h-8 w-8 text-brand-300" />
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => updateForm({ age_month: clamp(form.age_month - 1, 0, 60) })}
                    className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-slate-200 bg-white p-2 text-slate-600 transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
                    aria-label="Kurangi usia"
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
                    aria-label="Usia anak dalam bulan"
                    className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-center font-bold outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
                  />
                  <button
                    type="button"
                    onClick={() => updateForm({ age_month: clamp(form.age_month + 1, 0, 60) })}
                    className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-slate-200 bg-white p-2 text-slate-600 transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
                    aria-label="Tambah usia"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Height */}
              <div className="rounded-2xl border border-slate-200/80 bg-gradient-to-br from-slate-50/80 to-care-50/30 p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Tinggi Badan</p>
                    <p className="mt-1 font-heading text-3xl font-extrabold text-brand-700">{form.height_cm.toFixed(1)} <span className="text-lg font-bold text-slate-400">cm</span></p>
                  </div>
                  <Ruler className="h-8 w-8 text-care-300" />
                </div>
                <input
                  type="range"
                  min={45}
                  max={125}
                  step={0.1}
                  value={form.height_cm}
                  onChange={(event) => updateForm({ height_cm: roundOne(Number(event.target.value)) })}
                  aria-label="Tinggi badan anak"
                  className="mt-5 w-full accent-care-600"
                />
                <input
                  required
                  type="number"
                  min={20}
                  max={150}
                  step={0.1}
                  value={form.height_cm}
                  onChange={(event) => updateForm({ height_cm: clamp(roundOne(Number(event.target.value)), 20.1, 149.9) })}
                  aria-label="Tinggi badan anak dalam sentimeter"
                  className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-center font-bold outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
                />
              </div>

              {/* Weight */}
              <div className="rounded-2xl border border-slate-200/80 bg-gradient-to-br from-slate-50/80 to-amber-50/30 p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Berat Badan</p>
                    <p className="mt-1 font-heading text-3xl font-extrabold text-brand-700">{form.weight_kg.toFixed(1)} <span className="text-lg font-bold text-slate-400">kg</span></p>
                  </div>
                  <Scale className="h-8 w-8 text-amber-300" />
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => updateForm({ weight_kg: clamp(roundOne(form.weight_kg - 0.1), 1.1, 59.9) })}
                    className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-slate-200 bg-white p-2 text-slate-600 transition hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700"
                    aria-label="Kurangi berat"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <input
                    required
                    type="number"
                    min={1}
                    max={60}
                    step={0.1}
                    value={form.weight_kg}
                    onChange={(event) => updateForm({ weight_kg: clamp(roundOne(Number(event.target.value)), 1.1, 59.9) })}
                    aria-label="Berat badan anak dalam kilogram"
                    className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-center font-bold outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
                  />
                  <button
                    type="button"
                    onClick={() => updateForm({ weight_kg: clamp(roundOne(form.weight_kg + 0.1), 1.1, 59.9) })}
                    className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-slate-200 bg-white p-2 text-slate-600 transition hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700"
                    aria-label="Tambah berat"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-7 inline-flex w-full items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-care-600 to-care-700 px-6 py-4 text-base font-bold text-white shadow-xl shadow-care-700/20 transition hover:shadow-2xl hover:shadow-care-700/30 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <HeartPulse className="h-5 w-5" />
              {loading ? "Memproses hasil..." : "Cek Risiko Sekarang"}
            </button>

            <p className="mt-4 text-center text-xs text-slate-400">
              Skrining bukan diagnosis medis. Konsultasikan hasil ke Posyandu atau Puskesmas.
            </p>
          </form>
        </div>
      </section>

      {/* ── Hasil Skrining ── */}
      {result ? (
        <section id="hasil" className="mx-auto max-w-5xl scroll-mt-24 px-4 py-10 sm:px-6 lg:px-8">
          <div>
            <p className="text-sm font-bold text-brand-700">Hasil Skrining</p>
            <h2 className="mt-2 font-heading text-3xl font-extrabold text-slate-950">Ringkasan untuk orang tua</h2>
          </div>
          <div className="mt-5">
            <PredictionResultCard
              result={result}
              childContext={buildChatContext(result)}
              onCheckAgain={checkAgain}
            />
          </div>
        </section>
      ) : null}

      {/* ── Kenapa StuntGuard ── */}
      <section id="tentang" className="border-y border-brand-100/50 bg-gradient-to-b from-white via-brand-50/20 to-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-sm font-bold uppercase tracking-wider text-brand-700">Kenapa StuntGuard?</p>
            <h2 className="mx-auto mt-2 max-w-2xl font-heading text-3xl font-extrabold text-slate-950 sm:text-4xl">
              Pemantauan sederhana untuk langkah yang lebih tepat
            </h2>
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {highlights.map(({ title, text, icon: Icon, gradient }) => (
              <article
                key={title}
                className="group rounded-2xl border border-brand-100/80 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-brand-200 hover:shadow-xl hover:shadow-brand-900/[0.06]"
              >
                <span className={`inline-flex rounded-2xl bg-gradient-to-br ${gradient} p-4`}>
                  <Icon className="h-6 w-6 text-brand-700" />
                </span>
                <h3 className="mt-5 font-heading text-lg font-bold text-slate-950">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── Disclaimer ── */}
      <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-amber-200/80 bg-gradient-to-r from-amber-50 to-amber-50/60 p-5 text-amber-900 shadow-sm">
          <div className="flex gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 flex-none text-amber-600" />
            <div>
              <h2 className="font-bold">Disclaimer</h2>
              <p className="mt-2 text-sm leading-6">{DISCLAIMER}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-brand-100/50 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-6 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p className="font-heading font-bold text-slate-700">StuntGuard</p>
          <p>Skrining awal stunting untuk edukasi dan pemantauan keluarga.</p>
        </div>
      </footer>
    </main>
  );
}
