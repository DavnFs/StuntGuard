import { FormEvent, useState, useEffect } from "react";
import {
  Activity,
  ArrowLeft,
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
  UserRound,
  Users,
  ChevronRight,
  Sparkle,
  ShieldAlert,
  type LucideIcon,
} from "lucide-react";
import { Link } from "react-router-dom";

import ChatbotPopup from "../components/ChatbotPopup";
import PredictionResultCard from "../components/PredictionResultCard";
import { ErrorBlock } from "../components/StateBlock";
import { api } from "../services/api";
import type {
  ChatChildContext,
  Gender,
  PredictionRequest,
  PredictionResponse,
} from "../types";

const DISCLAIMER =
  "Hasil ini merupakan skrining awal dan bukan diagnosis medis. Silakan konsultasikan ke petugas kesehatan atau Puskesmas untuk pemeriksaan lanjutan.";

const highlights: Array<{
  title: string;
  text: string;
  icon: LucideIcon;
  gradient: string;
}> = [
  {
    title: "Pantau Pertumbuhan Anak",
    text: "Catat tinggi dan berat anak secara berkala untuk memantau tren pertumbuhan secara optimal.",
    icon: HeartPulse,
    gradient: "from-emerald-500/10 to-teal-500/10",
  },
  {
    title: "Kenali Risiko Lebih Awal",
    text: "Dapatkan sinyal deteksi dini jika pertumbuhan anak Anda memerlukan perhatian medis lebih lanjut.",
    icon: ShieldCheck,
    gradient: "from-cyan-500/10 to-blue-500/10",
  },
  {
    title: "Edukasi Gizi dengan AI",
    text: "Dapatkan rekomendasi MPASI, porsi makan, serta edukasi gizi dari asisten kecerdasan buatan.",
    icon: BookOpen,
    gradient: "from-violet-500/10 to-purple-500/10",
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
    <div className="relative mx-auto w-full max-w-md" aria-hidden="true">
      {/* Decorative blobs */}
      <div className="absolute -left-10 -top-10 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl animate-pulse-glow" />
      <div className="absolute -bottom-10 -right-10 h-72 w-72 rounded-full bg-emerald-400/20 blur-3xl" />

      <svg
        viewBox="0 0 400 360"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="relative z-10 w-full drop-shadow-2xl animate-float-slow"
      >
        {/* Background circle and grids */}
        <circle
          cx="200"
          cy="180"
          r="150"
          fill="url(#heroGrad)"
          opacity="0.08"
        />
        <circle
          cx="200"
          cy="180"
          r="110"
          fill="url(#heroGrad)"
          opacity="0.06"
        />

        {/* Outer glowing border ring */}
        <circle
          cx="200"
          cy="180"
          r="150"
          stroke="url(#strokeGrad)"
          strokeWidth="1"
          strokeDasharray="6 6"
          opacity="0.4"
        />

        {/* Growth chart bars */}
        <rect
          x="90"
          y="230"
          width="24"
          height="60"
          rx="6"
          fill="#10b981"
          opacity="0.2"
        />
        <rect
          x="130"
          y="210"
          width="24"
          height="80"
          rx="6"
          fill="#10b981"
          opacity="0.4"
        />
        <rect
          x="170"
          y="185"
          width="24"
          height="105"
          rx="6"
          fill="#06b6d4"
          opacity="0.6"
        />
        <rect
          x="210"
          y="160"
          width="24"
          height="130"
          rx="6"
          fill="#06b6d4"
          opacity="0.8"
        />
        <rect x="250" y="140" width="24" height="150" rx="6" fill="#0891b2" />
        <rect x="290" y="120" width="24" height="170" rx="6" fill="#0e7490" />

        {/* Trend line */}
        <polyline
          points="102,225 142,205 182,180 222,155 262,135 302,115"
          stroke="#10b981"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />

        {/* Dots on trend line with pulses */}
        {[
          [102, 225],
          [142, 205],
          [182, 180],
          [222, 155],
          [262, 135],
          [302, 115],
        ].map(([cx, cy], i) => (
          <g key={i}>
            <circle
              cx={cx}
              cy={cy}
              r="8"
              fill="#10b981"
              opacity="0.15"
              className="animate-ping"
              style={{ animationDelay: `${i * 0.4}s` }}
            />
            <circle
              cx={cx}
              cy={cy}
              r="4"
              fill="#10b981"
              stroke="#fff"
              strokeWidth="2.5"
            />
          </g>
        ))}

        {/* Floating elements inside glass-cards */}
        {/* Heart block */}
        <g transform="translate(300,60)" className="animate-float-slow">
          <rect
            x="-30"
            y="-30"
            width="60"
            height="60"
            rx="16"
            fill="white"
            filter="url(#dropShadow)"
          />
          <rect
            x="-30"
            y="-30"
            width="60"
            height="60"
            rx="16"
            fill="rgba(254, 243, 199, 0.5)"
          />
          <path
            d="M0-10C-2-14-8-14-8-10C-8-6 0 2 0 2S8-6 8-10C8-14 2-14 0-10Z"
            fill="#f59e0b"
            transform="scale(1.2)"
          />
        </g>

        {/* Shield block */}
        <g transform="translate(80,90)" className="animate-float-medium">
          <rect
            x="-25"
            y="-25"
            width="50"
            height="50"
            rx="14"
            fill="white"
            filter="url(#dropShadow)"
          />
          <rect
            x="-25"
            y="-25"
            width="50"
            height="50"
            rx="14"
            fill="rgba(236, 253, 245, 0.6)"
          />
          <path d="M0-8L-6-5V0C-6 4 0 7 0 7S6 4 6 0V-5L0-8Z" fill="#10b981" />
        </g>

        {/* Baby check badge */}
        <g transform="translate(200,285)">
          <rect
            x="-65"
            y="-18"
            width="130"
            height="36"
            rx="18"
            fill="white"
            filter="url(#dropShadow)"
          />
          <circle cx="-42" cy="0" r="10" fill="#ecfeff" />
          <path
            d="M-45-2L-43 0L-39-4"
            stroke="#06b6d4"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <text
            x="-25"
            y="4"
            fill="#0f172a"
            fontFamily="Outfit"
            fontSize="10"
            fontWeight="bold"
          >
            Tinggi Sesuai
          </text>
        </g>

        <defs>
          <linearGradient id="heroGrad" x1="50" y1="30" x2="350" y2="330">
            <stop stopColor="#10b981" />
            <stop offset="1" stopColor="#06b6d4" />
          </linearGradient>
          <linearGradient id="strokeGrad" x1="0" y1="0" x2="400" y2="360">
            <stop stopColor="#06b6d4" />
            <stop offset="0.5" stopColor="#10b981" />
            <stop offset="1" stopColor="#a7f3d0" />
          </linearGradient>
          <filter id="dropShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow
              dx="0"
              dy="4"
              stdDeviation="6"
              floodColor="#0e7490"
              floodOpacity="0.1"
            />
          </filter>
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

  // Wizard state: 1: Jenis Kelamin, 2: Usia, 3: Pengukuran
  const [step, setStep] = useState(1);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const updateForm = (updates: Partial<PredictionRequest>) => {
    setForm((current) => ({ ...current, ...updates }));
  };

  const buildChatContext = (
    prediction: PredictionResponse,
  ): ChatChildContext => ({
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
      window.sessionStorage.setItem(
        "stuntguard_last_child_context",
        JSON.stringify(buildChatContext(prediction)),
      );
      window.setTimeout(() => {
        document
          .getElementById("hasil")
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 150);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Prediksi gagal");
    } finally {
      setLoading(false);
    }
  };

  const checkAgain = () => {
    setResult(null);
    setStep(1);
    document
      .getElementById("cek")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleNextStep = () => {
    if (step < 3) {
      setStep(step + 1);
    }
  };

  const handlePrevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  return (
    <main className="min-h-screen bg-canvas text-slate-900 bg-dot-pattern">
      {/* ── Navbar ── */}
      <nav
        className={`sticky top-0 z-40 transition-all duration-350 ${
          scrolled
            ? "border-b border-slate-200/50 bg-white/90 shadow-md backdrop-blur-md py-3.5"
            : "border-b border-transparent bg-transparent py-5"
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <a href="#hero" className="flex items-center gap-3">
            <span className="relative rounded-2xl bg-slate-50 p-1.5 border border-slate-100 shadow-sm">
              <img
                src="/logo.png"
                alt="StuntGuard"
                className="h-8 w-8 rounded-lg object-contain"
              />
              <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-white animate-pulse" />
            </span>
            <span>
              <span className="block font-heading text-lg font-bold text-slate-950">
                StuntGuard
              </span>
              <span className="hidden text-[9px] font-bold uppercase tracking-[0.14em] text-cyan-600 sm:block">
                Healthcare Platform
              </span>
            </span>
          </a>
          <div className="hidden items-center gap-8 text-sm font-semibold text-slate-600 md:flex">
            <a href="#cek" className="transition hover:text-cyan-600">
              Cek Stunting
            </a>
            <Link
              to="/chatbot"
              onClick={(e) => {
                e.preventDefault();
                window.dispatchEvent(new CustomEvent("open-chatbot"));
              }}
              className="transition hover:text-cyan-600"
            >
              Edukasi Gizi
            </Link>
            <a href="#tentang" className="transition hover:text-cyan-600">
              Tentang
            </a>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2.5 text-white hover:bg-slate-800 shadow-sm transition"
            >
              <LogIn className="h-4 w-4" />
              Akses Portal Dashboard
            </Link>
          </div>
          <Link
            to="/login"
            className="inline-flex min-h-10 items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 md:hidden"
          >
            Portal
          </Link>
        </div>
      </nav>

      {/* ── Hero Section ── */}
      <section
        id="hero"
        className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28"
      >
        {/* Background Gradients */}
        <div className="pointer-events-none absolute -left-32 top-0 h-96 w-96 rounded-full bg-cyan-200/25 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 bottom-10 h-[500px] w-[500px] rounded-full bg-emerald-100/30 blur-3xl" />

        <div className="relative mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:px-8 items-center">
          <div className="flex flex-col justify-center text-left">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-cyan-500/10 bg-cyan-500/5 px-4 py-2 text-xs font-bold tracking-wide text-cyan-800 shadow-sm">
              <Sparkles className="h-3.5 w-3.5 text-cyan-600" />
              <span>SKRINING STATUS GIZI TERSTANDAR WHO & KEMENKES</span>
            </div>

            <h1 className="mt-6 font-heading text-4xl font-extrabold leading-[1.08] text-slate-950 sm:text-5xl lg:text-[3.6rem]">
              Pantau Tumbuh Kembang Balita.{" "}
              <span className="bg-gradient-to-r from-cyan-600 via-teal-600 to-emerald-600 bg-clip-text text-transparent">
                Cegah Stunting Sejak Dini.
              </span>
            </h1>

            <p className="mt-5 max-w-xl text-base leading-7 text-slate-600 sm:text-lg">
              StuntGuard menyediakan platform skrining awal risiko stunting yang
              cepat, ramah pengguna, dan berbasis data medis resmi secara
              instan.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <a
                href="#cek"
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-600 to-teal-600 px-7 py-4 text-sm font-bold text-white shadow-xl shadow-cyan-900/15 hover:shadow-cyan-950/25 transition duration-300"
              >
                <Activity className="h-4 w-4" />
                Mulai Skrining Mandiri
                <ArrowRight className="h-4 w-4" />
              </a>
              <Link
                to="/chatbot"
                onClick={(e) => {
                  e.preventDefault();
                  window.dispatchEvent(new CustomEvent("open-chatbot"));
                }}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-7 py-4 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50 transition"
              >
                <MessageCircle className="h-4 w-4 text-cyan-600" />
                Tanya Asisten AI
              </Link>
            </div>

            {/* Trust Badges */}
            <div className="mt-12 pt-8 border-t border-slate-200/60">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Dipercaya Oleh Pengguna
              </p>
              <div className="mt-4 flex flex-wrap gap-x-8 gap-y-4 text-sm font-bold text-slate-600">
                <div className="flex items-center gap-2">
                  <span className="text-cyan-600 text-lg">98%</span>
                  <span className="text-xs font-medium text-slate-500">
                    Akurasi Skrining Gizi
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-600 text-lg">50k+</span>
                  <span className="text-xs font-medium text-slate-500">
                    Balita Terpantau
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-teal-600 text-lg">Real-time</span>
                  <span className="text-xs font-medium text-slate-500">
                    Rekomendasi AI Gizi
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center lg:pl-6">
            <HeroIllustration />
          </div>
        </div>
      </section>

      {/* ── Wizard Form Cek Stunting ── */}
      <section
        id="cek"
        className="relative pb-20 bg-gradient-to-b from-transparent to-white/70"
      >
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold tracking-wide text-emerald-800 border border-emerald-100">
              <Sparkle className="h-3 w-3 text-emerald-600" /> Asisten Skrining
            </span>
            <h2 className="mt-3 font-heading text-3xl font-extrabold text-slate-950 sm:text-4xl">
              Kalkulator Gizi & Stunting
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-slate-500">
              Isi data pertumbuhan di bawah ini dengan akurat. Pengukuran
              disesuaikan dengan kurva pertumbuhan standar organisasi kesehatan
              dunia (WHO).
            </p>
          </div>

          {error ? (
            <div className="mt-6">
              <ErrorBlock message={error} />
            </div>
          ) : null}

          {/* Wizard Container */}
          <div className="mt-10 overflow-hidden rounded-3xl border border-slate-200/60 bg-white/80 shadow-2xl shadow-cyan-900/[0.03] backdrop-blur-lg">
            {/* Step Indicators */}
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-4 sm:px-8">
              {[
                { number: 1, title: "Jenis Kelamin" },
                { number: 2, title: "Usia Anak" },
                { number: 3, title: "Tinggi & Berat" },
              ].map((s) => (
                <div key={s.number} className="flex items-center gap-2.5">
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition duration-300 ${
                      step === s.number
                        ? "bg-cyan-600 text-white shadow-md shadow-cyan-500/20"
                        : step > s.number
                          ? "bg-emerald-500 text-white"
                          : "bg-slate-200 text-slate-500"
                    }`}
                  >
                    {step > s.number ? "✓" : s.number}
                  </span>
                  <span
                    className={`hidden text-xs font-bold sm:inline-block ${
                      step === s.number ? "text-slate-900" : "text-slate-400"
                    }`}
                  >
                    {s.title}
                  </span>
                  {s.number < 3 ? (
                    <ChevronRight className="hidden h-4 w-4 text-slate-300 sm:block" />
                  ) : null}
                </div>
              ))}
            </div>

            <form onSubmit={submit} className="p-6 sm:p-8">
              {/* Step 1: Gender selection */}
              {step === 1 && (
                <div className="space-y-6">
                  <div className="text-center sm:text-left">
                    <p className="text-sm font-bold text-slate-900">
                      Pilih Jenis Kelamin Anak
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Standar tinggi & berat badan WHO dibedakan berdasarkan
                      jenis kelamin.
                    </p>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {[
                      {
                        value: "female" as Gender,
                        label: "Perempuan",
                        subtitle: "Kurva Pertumbuhan Perempuan WHO",
                        icon: UserRound,
                        desc: "Pilih untuk anak perempuan",
                        colorClass:
                          "border-pink-500 bg-pink-50/20 text-pink-700 shadow-pink-100",
                      },
                      {
                        value: "male" as Gender,
                        label: "Laki-laki",
                        subtitle: "Kurva Pertumbuhan Laki-laki WHO",
                        icon: Users,
                        desc: "Pilih untuk anak laki-laki",
                        colorClass:
                          "border-cyan-500 bg-cyan-50/20 text-cyan-700 shadow-cyan-100",
                      },
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
                          aria-pressed={selected}
                          className={`flex items-center gap-4 rounded-2xl border-2 p-5 text-left transition duration-300 ${
                            selected
                              ? `${item.colorClass} shadow-lg`
                              : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                          }`}
                        >
                          <span
                            className={`rounded-xl p-3.5 transition ${selected ? "bg-cyan-600 text-white shadow-sm" : "bg-slate-100 text-slate-500"}`}
                          >
                            <Icon className="h-6 w-6" />
                          </span>
                          <div>
                            <span className="block text-base font-bold text-slate-950">
                              {item.label}
                            </span>
                            <span className="block text-xs text-slate-400 mt-0.5">
                              {item.subtitle}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Step 2: Age selection */}
              {step === 2 && (
                <div className="space-y-6">
                  <div className="text-center sm:text-left">
                    <p className="text-sm font-bold text-slate-900">
                      Tentukan Usia Anak
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Masukkan usia balita dalam hitungan bulan (0 - 60 bulan).
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200/60 bg-slate-50/50 p-6 flex flex-col items-center justify-center text-center">
                    <div className="relative rounded-full bg-cyan-50 p-4 border border-cyan-100 shadow-inner">
                      <Baby className="h-10 w-10 text-cyan-600" />
                    </div>
                    <div className="mt-4">
                      <span className="font-heading text-4xl font-extrabold text-cyan-700">
                        {form.age_month}
                      </span>
                      <span className="text-lg font-bold text-slate-400 ml-1.5">
                        bulan
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Setara dengan {Math.floor(form.age_month / 12)} tahun{" "}
                      {form.age_month % 12} bulan
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      onClick={() =>
                        updateForm({
                          age_month: clamp(form.age_month - 1, 0, 60),
                        })
                      }
                      className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:border-cyan-300 hover:bg-cyan-50 transition"
                      aria-label="Kurangi usia"
                    >
                      <Minus className="h-5 w-5" />
                    </button>
                    <input
                      required
                      type="number"
                      min={0}
                      max={60}
                      value={form.age_month}
                      onChange={(event) =>
                        updateForm({
                          age_month: clamp(Number(event.target.value), 0, 60),
                        })
                      }
                      aria-label="Usia anak dalam bulan"
                      className="h-12 flex-1 rounded-xl border border-slate-200 bg-white px-4 text-center font-bold text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-50"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        updateForm({
                          age_month: clamp(form.age_month + 1, 0, 60),
                        })
                      }
                      className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:border-cyan-300 hover:bg-cyan-50 transition"
                      aria-label="Tambah usia"
                    >
                      <Plus className="h-5 w-5" />
                    </button>
                  </div>

                  {/* Quick select range markers */}
                  <div className="mt-4">
                    <input
                      type="range"
                      min={0}
                      max={60}
                      value={form.age_month}
                      onChange={(event) =>
                        updateForm({ age_month: Number(event.target.value) })
                      }
                      className="w-full premium-slider"
                    />
                    <div className="flex justify-between text-[10px] font-bold text-slate-400 px-1 mt-2">
                      <span>Baru Lahir (0 m)</span>
                      <span>1 Tahun (12 m)</span>
                      <span>2 Tahun (24 m)</span>
                      <span>3 Tahun (36 m)</span>
                      <span>4 Tahun (48 m)</span>
                      <span>5 Tahun (60 m)</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Height & Weight */}
              {step === 3 && (
                <div className="space-y-6">
                  <div className="text-center sm:text-left">
                    <p className="text-sm font-bold text-slate-900">
                      Masukkan Tinggi & Berat Badan
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Ukur dengan cermat. Nilai standar ideal WHO akan
                      ditampilkan sebagai pembanding.
                    </p>
                  </div>

                  <div className="grid gap-6 md:grid-cols-2">
                    {/* Height input container */}
                    <div className="rounded-2xl border border-slate-200/60 bg-slate-50/30 p-5 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="rounded-lg bg-cyan-50 p-2 border border-cyan-100">
                            <Ruler className="h-5 w-5 text-cyan-600" />
                          </span>
                          <span className="text-sm font-bold text-slate-700">
                            Tinggi Badan
                          </span>
                        </div>
                        <div>
                          <span className="font-heading text-2xl font-extrabold text-cyan-700">
                            {form.height_cm.toFixed(1)}
                          </span>
                          <span className="text-xs font-bold text-slate-400 ml-1">
                            cm
                          </span>
                        </div>
                      </div>
                      <input
                        type="range"
                        min={45}
                        max={125}
                        step={0.1}
                        value={form.height_cm}
                        onChange={(event) =>
                          updateForm({
                            height_cm: roundOne(Number(event.target.value)),
                          })
                        }
                        aria-label="Tinggi badan anak"
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
                          updateForm({
                            height_cm: val === "" ? 0 : Number(val),
                          });
                        }}
                        onBlur={() => {
                          updateForm({
                            height_cm: clamp(roundOne(form.height_cm), 20, 150),
                          });
                        }}
                        aria-label="Tinggi badan anak dalam sentimeter"
                        className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-center text-sm font-bold outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-50"
                      />
                    </div>

                    {/* Weight input container */}
                    <div className="rounded-2xl border border-slate-200/60 bg-slate-50/30 p-5 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="rounded-lg bg-emerald-50 p-2 border border-emerald-100">
                            <Scale className="h-5 w-5 text-emerald-600" />
                          </span>
                          <span className="text-sm font-bold text-slate-700">
                            Berat Badan
                          </span>
                        </div>
                        <div>
                          <span className="font-heading text-2xl font-extrabold text-emerald-700">
                            {form.weight_kg.toFixed(1)}
                          </span>
                          <span className="text-xs font-bold text-slate-400 ml-1">
                            kg
                          </span>
                        </div>
                      </div>
                      <input
                        type="range"
                        min={2}
                        max={30}
                        step={0.1}
                        value={form.weight_kg}
                        onChange={(event) =>
                          updateForm({
                            weight_kg: roundOne(Number(event.target.value)),
                          })
                        }
                        aria-label="Berat badan anak"
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
                          updateForm({
                            weight_kg: val === "" ? 0 : Number(val),
                          });
                        }}
                        onBlur={() => {
                          updateForm({
                            weight_kg: clamp(roundOne(form.weight_kg), 1, 60),
                          });
                        }}
                        aria-label="Berat badan anak dalam kilogram"
                        className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-center text-sm font-bold outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Wizard navigation */}
              <div className="mt-8 flex items-center justify-between gap-4 border-t border-slate-100 pt-6">
                {step > 1 ? (
                  <button
                    key="btn-prev"
                    type="button"
                    onClick={handlePrevStep}
                    className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 hover:bg-slate-50 transition"
                  >
                    <ArrowLeft className="h-4 w-4" />
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
                    className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-slate-900 px-6 text-sm font-bold text-white hover:bg-slate-800 transition ml-auto"
                  >
                    Lanjut
                    <ArrowRight className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    key="btn-submit"
                    type="submit"
                    disabled={loading}
                    className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 px-6 text-sm font-bold text-white shadow-lg shadow-cyan-900/10 hover:shadow-cyan-900/20 transition disabled:opacity-60 ml-auto"
                  >
                    <HeartPulse className="h-4 w-4" />
                    {loading ? "Memproses..." : "Cek Risiko Sekarang"}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* ── Hasil Skrining ── */}
      {result ? (
        <section
          id="hasil"
          className="mx-auto max-w-5xl scroll-mt-16 px-4 py-12 sm:px-6 lg:px-8 border-t border-slate-100"
        >
          <div className="text-center md:text-left mb-8">
            <span className="inline-flex items-center gap-1 rounded-full bg-cyan-50 px-2.5 py-1 text-xs font-semibold text-cyan-800">
              Hasil Skrining Resmi
            </span>
            <h2 className="mt-2 font-heading text-3xl font-extrabold text-slate-950">
              Dashboard Penilaian Gizi Anak
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Hasil diagnosis model AI pendeteksi dini risiko stunting dan gizi
              buruk.
            </p>
          </div>
          <PredictionResultCard
            result={result}
            childContext={buildChatContext(result)}
            onCheckAgain={checkAgain}
          />
        </section>
      ) : null}

      {/* ── Kenapa StuntGuard ── */}
      <section
        id="tentang"
        className="border-t border-slate-100 bg-gradient-to-b from-white to-slate-50/50 py-20"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-600">
              Keunggulan Platform
            </span>
            <h2 className="mx-auto mt-3 max-w-2xl font-heading text-3xl font-extrabold text-slate-950 sm:text-4xl">
              Teknologi Kesehatan untuk Langkah Lebih Terarah
            </h2>
            <p className="mt-3 text-sm text-slate-500">
              Pantau secara berkelanjutan demi menjamin kebaikan gizi masa depan
              si kecil.
            </p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {highlights.map(({ title, text, icon: Icon, gradient }) => (
              <article
                key={title}
                className="group rounded-3xl border border-slate-200/50 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-cyan-500/20 hover:shadow-xl"
              >
                <span
                  className={`inline-flex rounded-2xl bg-gradient-to-br ${gradient} p-4 transition-transform duration-300 group-hover:scale-105`}
                >
                  <Icon className="h-6 w-6 text-cyan-700" />
                </span>
                <h3 className="mt-5 font-heading text-base font-bold text-slate-950">
                  {title}
                </h3>
                <p className="mt-2.5 text-xs leading-5 text-slate-500">
                  {text}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── Disclaimer ── */}
      <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-amber-500/10 bg-amber-500/[0.03] p-6 text-amber-900 shadow-sm backdrop-blur-sm">
          <div className="flex gap-4 items-start">
            <ShieldAlert className="h-6 w-6 flex-none text-amber-600 mt-0.5" />
            <div>
              <h3 className="font-bold text-sm text-amber-950">
                Catatan Penting (Disclaimer)
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-amber-800">
                {DISCLAIMER}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-slate-200/50 bg-white py-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <img
              src="/logo.png"
              alt="StuntGuard"
              className="h-6 w-6 object-contain opacity-80"
            />
            <p className="font-heading font-bold text-slate-700">
              StuntGuard Platform
            </p>
          </div>
          <p>
            © 2026 StuntGuard. Hak cipta dilindungi undang-undang. Skrining
            edukatif tumbuh kembang anak.
          </p>
        </div>
      </footer>
      <ChatbotPopup />
    </main>
  );
}
