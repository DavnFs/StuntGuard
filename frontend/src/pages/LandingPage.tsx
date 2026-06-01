import { FormEvent, useState } from "react";
import {
  Activity,
  Baby,
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
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

const whyCards: Array<{ title: string; text: string; icon: LucideIcon }> = [
  { title: "Pantau pertumbuhan anak", text: "Catat tinggi dan berat anak secara berkala.", icon: HeartPulse },
  { title: "Kenali risiko lebih awal", text: "Dapatkan sinyal awal jika pertumbuhan perlu perhatian.", icon: ShieldCheck },
  { title: "Dapatkan edukasi gizi", text: "Pelajari informasi gizi yang aman dan mudah dipahami.", icon: BookOpen },
  { title: "Konsultasi dengan petugas", text: "Lanjutkan ke Posyandu atau Puskesmas bila diperlukan.", icon: Stethoscope },
];

const featureCards: Array<{ title: string; icon: LucideIcon }> = [
  { title: "Cek risiko stunting tanpa login", icon: ClipboardCheck },
  { title: "Edukasi gizi dengan AI", icon: MessageCircle },
  { title: "Riwayat pertumbuhan anak", icon: HeartPulse },
  { title: "Konsultasi dengan petugas", icon: Stethoscope },
  { title: "Dashboard Posyandu/Puskesmas", icon: Activity },
];

function clamp(value: number, min: number, max: number) {
  if (Number.isNaN(value)) return min;
  return Math.min(max, Math.max(min, value));
}

function roundOne(value: number) {
  return Math.round(value * 10) / 10;
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
      <nav className="sticky top-0 z-30 border-b border-brand-100 bg-white/90 shadow-sm backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <a href="#hero" className="flex items-center gap-3">
            <span className="rounded-xl bg-brand-700 p-2 text-white">
              <Activity className="h-5 w-5" />
            </span>
            <span>
              <span className="block font-heading text-lg font-extrabold text-slate-950">StuntGuard</span>
              <span className="hidden text-[10px] font-bold uppercase tracking-[0.14em] text-brand-700 sm:block">Tumbuh terpantau</span>
            </span>
          </a>
          <div className="hidden items-center gap-6 text-sm font-semibold text-slate-600 md:flex">
            <a href="#cek" className="transition hover:text-brand-700">Cek Stunting</a>
            <Link to="/chatbot" className="transition hover:text-brand-700">Edukasi</Link>
            <a href="#tentang" className="transition hover:text-brand-700">Tentang</a>
            <Link to="/login" className="inline-flex items-center gap-2 rounded-full bg-care-700 px-4 py-2.5 text-white shadow-sm transition hover:bg-care-800">
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

      <section id="hero" className="relative overflow-hidden border-b border-brand-100 bg-gradient-to-br from-white via-canvas to-brand-50">
        <div className="pointer-events-none absolute -left-24 top-24 h-72 w-72 rounded-full bg-brand-100/50 blur-3xl" />
        <div className="pointer-events-none absolute -right-20 bottom-10 h-80 w-80 rounded-full bg-amber-100/60 blur-3xl" />
        <div className="relative mx-auto grid min-h-[650px] max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.08fr_0.92fr] lg:px-8">
          <div className="flex flex-col justify-center">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-brand-200 bg-white/80 px-3 py-1.5 text-sm font-bold text-brand-800 shadow-sm">
              <Sparkles className="h-4 w-4" />
              Skrining awal untuk orang tua
            </div>
            <h1 className="mt-6 max-w-3xl font-heading text-4xl font-extrabold leading-[1.06] text-slate-950 sm:text-5xl lg:text-6xl">
              Pantau tumbuh kembang. <span className="text-brand-700">Ambil langkah lebih awal.</span>
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
              StuntGuard membantu orang tua melakukan skrining awal risiko stunting dari usia, jenis kelamin, tinggi badan, dan berat badan anak.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <a href="#cek" className="inline-flex items-center gap-2 rounded-full bg-care-700 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-care-700/20 transition hover:bg-care-800">
                <HeartPulse className="h-4 w-4" />
                Cek Sekarang
              </a>
              <Link to="/chatbot" className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white px-5 py-3 text-sm font-bold text-brand-800 transition hover:bg-brand-50">
                <BookOpen className="h-4 w-4" />
                Pelajari Stunting
              </Link>
            </div>
            <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-xs font-bold text-slate-600 sm:text-sm">
              {["Tanpa login", "Hasil mudah dipahami", "Arahan langkah berikutnya"].map((item) => (
                <span key={item} className="inline-flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-brand-700" />
                  {item}
                </span>
              ))}
            </div>
            <p className="mt-5 max-w-xl border-l-2 border-amber-400 pl-3 text-sm leading-6 text-amber-800">
              Skrining bukan diagnosis medis. Konsultasikan hasil ke Posyandu atau Puskesmas.
            </p>
          </div>

          <div className="flex items-center justify-center">
            <div className="relative w-full max-w-md rounded-[2rem] border border-brand-100 bg-white/95 p-6 shadow-2xl shadow-brand-900/10">
              <div className="pointer-events-none absolute -right-3 -top-3 h-20 w-20 rounded-full border border-brand-200 bg-brand-50/80" />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-700">Kartu Pertumbuhan Anak</p>
                  <h2 className="mt-2 font-heading text-2xl font-extrabold text-slate-950">Pantau dengan tenang</h2>
                </div>
                <span className="relative rounded-2xl bg-brand-50 p-3 text-brand-700 ring-1 ring-brand-100">
                  <Baby className="h-6 w-6" />
                </span>
              </div>
              <div className="mt-6 space-y-4">
                <div className="rounded-2xl bg-brand-50 p-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-slate-700">Usia</span>
                    <span className="font-bold text-slate-950">24 bulan</span>
                  </div>
                  <div className="mt-3 h-2 rounded-full bg-white">
                    <div className="h-2 w-2/5 rounded-full bg-gradient-to-r from-brand-500 to-brand-700" />
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-brand-100 p-4">
                    <Ruler className="h-5 w-5 text-brand-700" />
                    <p className="mt-3 text-sm text-slate-500">Tinggi</p>
                    <p className="font-heading text-2xl font-extrabold text-slate-950">82.5 cm</p>
                  </div>
                  <div className="rounded-2xl border border-brand-100 p-4">
                    <Scale className="h-5 w-5 text-brand-700" />
                    <p className="mt-3 text-sm text-slate-500">Berat</p>
                    <p className="font-heading text-2xl font-extrabold text-slate-950">10.4 kg</p>
                  </div>
                </div>
                <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
                  Hasil mudah dipahami, dengan saran langkah berikutnya untuk orang tua.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="tentang" className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-sm font-bold text-brand-700">Kenapa deteksi dini penting?</p>
          <h2 className="mt-2 text-3xl font-bold text-slate-950">Pemantauan sederhana dapat membantu orang tua mengambil langkah lebih cepat.</h2>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-4">
          {whyCards.map(({ title, text, icon: Icon }) => (
            <article key={title} className="rounded-2xl border border-brand-100 bg-white p-5 shadow-card transition duration-200 hover:-translate-y-1 hover:border-brand-200 hover:shadow-lg">
              <span className="inline-flex rounded-xl bg-brand-50 p-3 text-brand-700">
                <Icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 font-bold text-slate-950">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="cek" className="border-y border-care-100 bg-amber-50/50">
        <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-sm font-bold text-brand-700">Cek Risiko Stunting</p>
            <h2 className="mt-2 text-3xl font-bold text-slate-950">Masukkan data pertumbuhan anak</h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              Data ini digunakan untuk skrining awal. Pastikan pengukuran tinggi dan berat dilakukan seakurat mungkin.
            </p>
          </div>

          {error ? <div className="mt-6"><ErrorBlock message={error} /></div> : null}

          <form className="mt-8 rounded-[2rem] border border-brand-100 bg-white p-5 shadow-xl shadow-brand-900/5 sm:p-7" onSubmit={submit}>
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
                      className={`flex items-center gap-3 rounded-xl border p-4 text-left transition ${
                        selected
                          ? "border-brand-600 bg-brand-50 ring-2 ring-brand-100"
                          : "border-slate-200 bg-white hover:border-brand-200 hover:bg-brand-50/50"
                      }`}
                    >
                      <span className={`rounded-xl p-3 ${selected ? "bg-brand-700 text-white" : "bg-slate-100 text-slate-600"}`}>
                        <Icon className="h-5 w-5" />
                      </span>
                      <span>
                        <span className="block font-bold text-slate-950">{item.label}</span>
                        <span className="text-sm text-slate-500">Pilih jenis kelamin</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-slate-950">Usia Anak</p>
                    <p className="mt-1 text-3xl font-bold text-brand-700">{form.age_month} bulan</p>
                  </div>
                  <Baby className="h-7 w-7 text-brand-700" />
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => updateForm({ age_month: clamp(form.age_month - 1, 0, 60) })}
                    className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-slate-300 bg-white p-2 text-slate-700 transition hover:border-brand-200 hover:bg-brand-50"
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
                    className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-center font-bold outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100"
                  />
                  <button
                    type="button"
                    onClick={() => updateForm({ age_month: clamp(form.age_month + 1, 0, 60) })}
                    className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-slate-300 bg-white p-2 text-slate-700 transition hover:border-brand-200 hover:bg-brand-50"
                    aria-label="Tambah usia"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-slate-950">Tinggi Badan</p>
                    <p className="mt-1 text-3xl font-bold text-brand-700">{form.height_cm.toFixed(1)} cm</p>
                  </div>
                  <Ruler className="h-7 w-7 text-brand-700" />
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
                  className="mt-3 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-center font-bold outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100"
                />
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-slate-950">Berat Badan</p>
                    <p className="mt-1 text-3xl font-bold text-brand-700">{form.weight_kg.toFixed(1)} kg</p>
                  </div>
                  <Scale className="h-7 w-7 text-brand-700" />
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => updateForm({ weight_kg: clamp(roundOne(form.weight_kg - 0.1), 1.1, 59.9) })}
                    className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-slate-300 bg-white p-2 text-slate-700 transition hover:border-brand-200 hover:bg-brand-50"
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
                    className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-center font-bold outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100"
                  />
                  <button
                    type="button"
                    onClick={() => updateForm({ weight_kg: clamp(roundOne(form.weight_kg + 0.1), 1.1, 59.9) })}
                    className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-slate-300 bg-white p-2 text-slate-700 transition hover:border-brand-200 hover:bg-brand-50"
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
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-care-700 px-5 py-4 text-base font-bold text-white shadow-lg shadow-care-700/20 transition hover:bg-care-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <HeartPulse className="h-5 w-5" />
              {loading ? "Memproses hasil..." : "Cek Risiko Sekarang"}
            </button>
          </form>
        </div>
      </section>

      {result ? (
        <section id="hasil" className="mx-auto max-w-5xl scroll-mt-24 px-4 py-10 sm:px-6 lg:px-8">
          <div>
            <p className="text-sm font-bold text-brand-700">Hasil Skrining</p>
            <h2 className="mt-2 text-3xl font-bold text-slate-950">Ringkasan untuk orang tua</h2>
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

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-sm font-bold text-brand-700">Fitur StuntGuard</p>
          <h2 className="mt-2 text-3xl font-bold text-slate-950">Sederhana untuk orang tua, berguna untuk petugas.</h2>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-5">
          {featureCards.map(({ title, icon: Icon }) => (
            <article key={title} className="rounded-2xl border border-brand-100 bg-white p-5 shadow-card">
              <Icon className="h-6 w-6 text-brand-700" />
              <h3 className="mt-4 text-sm font-bold leading-6 text-slate-950">{title}</h3>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-care-100 bg-care-50/70">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-sm font-bold text-brand-700">Cara Kerja StuntGuard</p>
            <h2 className="mt-2 text-3xl font-bold text-slate-950">Empat langkah mudah untuk skrining awal.</h2>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-4">
            {[
              "Masukkan usia, jenis kelamin, tinggi, dan berat badan anak.",
              "Sistem melakukan skrining awal.",
              "Hasil dan saran awal ditampilkan.",
              "Jika perlu, lanjutkan konsultasi ke Posyandu atau Puskesmas.",
            ].map((step, index) => (
              <article key={step} className="rounded-2xl border border-brand-100 bg-white p-5 shadow-card">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-brand-700 text-sm font-bold text-white">
                  {index + 1}
                </span>
                <p className="mt-4 text-sm font-semibold leading-6 text-slate-700">{step}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-900 shadow-card">
          <div className="flex gap-3">
            <ShieldCheck className="mt-1 h-5 w-5 flex-none" />
            <div>
              <h2 className="font-bold">Disclaimer</h2>
              <p className="mt-2 text-sm leading-6">{DISCLAIMER}</p>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-care-100 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-6 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p className="font-semibold text-slate-700">StuntGuard</p>
          <p>Skrining awal stunting untuk edukasi dan pemantauan keluarga.</p>
        </div>
      </footer>
    </main>
  );
}
