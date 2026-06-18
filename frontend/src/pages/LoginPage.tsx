import { FormEvent, useState } from "react";
import { Activity, ArrowLeft, Baby, CheckCircle2, HeartPulse, LogIn, ShieldCheck, Sparkles } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { ErrorBlock } from "../components/StateBlock";
import { api } from "../services/api";
import { saveCurrentUser } from "../services/auth";

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("parent@demo.com");
  const [password, setPassword] = useState("password");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const user = await api.login({ email, password });
      saveCurrentUser(user);
      navigate(user.role === "admin" ? "/app/admin" : "/app/parent", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login gagal");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-canvas px-4 py-8 lg:flex lg:items-center lg:justify-center bg-dot-pattern">
      {/* Background decorations */}
      <div className="pointer-events-none absolute -left-20 top-10 h-72 w-72 rounded-full bg-cyan-200/20 blur-3xl animate-pulse-glow" />
      <div className="pointer-events-none absolute -bottom-20 right-10 h-80 w-80 rounded-full bg-emerald-200/20 blur-3xl" />

      <div className="relative mx-auto grid min-h-[640px] w-full max-w-5xl overflow-hidden rounded-[2.5rem] border border-slate-200/60 bg-white/80 shadow-2xl shadow-cyan-900/[0.04] backdrop-blur-md lg:grid-cols-[1.1fr_0.9fr]">
        
        {/* Left pane: Branding & illustration */}
        <section className="relative hidden overflow-hidden bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 p-10 text-white lg:flex lg:flex-col lg:justify-between border-r border-white/5">
          {/* Floating graphic elements */}
          <div className="pointer-events-none absolute -right-24 top-14 h-72 w-72 rounded-full border border-white/5" />
          <div className="pointer-events-none absolute -right-4 top-40 h-36 w-36 rounded-full border border-cyan-500/10" />
          <div className="pointer-events-none absolute bottom-24 left-20 h-52 w-52 rounded-full bg-cyan-500/10 blur-3xl animate-pulse-glow" />

          {/* Logo */}
          <Link to="/" className="relative inline-flex w-fit items-center gap-3 text-white">
            <span className="relative rounded-2xl bg-white/5 p-1.5 ring-1 ring-inset ring-white/10 shadow-inner">
              <img src="/logo.png" alt="StuntGuard" className="h-8 w-8 rounded-lg object-contain" />
              <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-slate-950 animate-pulse" />
            </span>
            <span>
              <span className="block font-heading text-lg font-bold">StuntGuard</span>
              <span className="block text-[10px] font-medium text-slate-400">Tumbuh terpantau, langkah terarah</span>
            </span>
          </Link>

          {/* Slogan */}
          <div className="relative max-w-md">
            <span className="inline-flex rounded-full bg-cyan-500/10 px-3.5 py-1 text-xs font-bold text-cyan-400 border border-cyan-500/25">
              Ruang Keluarga Digital
            </span>
            <h1 className="mt-5 font-heading text-4xl font-extrabold leading-[1.1] text-white">
              Kawal Tumbuh Kembang dengan Langkah Nyata.
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-slate-300">
              Pantau riwayat tinggi & berat badan anak secara detail, lihat grafik pertumbuhan berkala, dan konsultasikan status gizi ke petugas Posyandu dengan mudah.
            </p>

            {/* Graphics bar */}
            <div className="mt-8 flex items-end gap-2.5" aria-hidden="true">
              {[35, 55, 75, 95].map((height, index) => (
                <div key={height} className="flex flex-col items-center gap-2">
                  <span className="rounded-full bg-cyan-400/40" style={{ height: 10 + index * 2.5, width: 10 + index * 2.5 }} />
                  <span className="w-1.5 rounded-t-md bg-gradient-to-t from-cyan-900 to-cyan-500" style={{ height }} />
                </div>
              ))}
              <HeartPulse className="mb-2 ml-2 h-7 w-7 text-emerald-400 animate-pulse" />
            </div>
          </div>

          {/* Small note */}
          <div className="relative flex items-start gap-2.5 rounded-2xl border border-white/5 bg-white/[0.02] p-4 text-xs leading-5 text-slate-400">
            <ShieldCheck className="mt-0.5 h-4.5 w-4.5 shrink-0 text-cyan-400" />
            <span>StuntGuard menjamin kerahasiaan riwayat medis anak Anda. Semua data demo tersimpan secara terenkripsi di server lokal.</span>
          </div>
        </section>

        {/* Right pane: Form inputs */}
        <section className="flex flex-col justify-center p-8 sm:p-12">
          <div className="mx-auto w-full max-w-sm">
            <Link to="/" className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-slate-600 lg:hidden">
              <ArrowLeft className="h-4 w-4" />
              Kembali ke beranda
            </Link>

            <div className="mt-6 lg:mt-0 flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-cyan-50 px-2.5 py-1 text-xs font-bold text-cyan-800 border border-cyan-100">
                <Sparkles className="h-3 w-3 text-cyan-600" /> Portal Masuk
              </span>
            </div>

            <h2 className="mt-4 font-heading text-3xl font-extrabold text-slate-950">Selamat Datang</h2>
            <p className="mt-1.5 text-xs text-slate-500">
              Gunakan akun demo di bawah ini untuk menjelajahi dashboard Posyandu & Orang Tua.
            </p>

            {error ? <div className="mt-5"><ErrorBlock message={error} /></div> : null}

            <form className="mt-6 space-y-4" onSubmit={submit}>
              <div>
                <label htmlFor="email" className="block text-xs font-bold text-slate-600 uppercase tracking-wide">
                  Alamat Email
                </label>
                <input
                  id="email"
                  required
                  type="email"
                  autoComplete="email"
                  maxLength={160}
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-bold text-slate-800 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-50"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-xs font-bold text-slate-600 uppercase tracking-wide">
                  Kata Sandi
                </label>
                <input
                  id="password"
                  required
                  type="password"
                  autoComplete="current-password"
                  maxLength={160}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-bold text-slate-800 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-50"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-cyan-900/10 hover:shadow-cyan-900/20 disabled:opacity-60 transition"
              >
                <LogIn className="h-4 w-4" />
                {loading ? "Memverifikasi..." : "Masuk ke Dashboard"}
              </button>
            </form>

            {/* Quick Access sandbox details */}
            <div className="mt-8 rounded-2xl border border-slate-150 bg-slate-50/50 p-4 text-xs text-slate-600 leading-normal">
              <div className="flex items-center gap-1.5 font-bold text-slate-900 mb-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>Quick Access Sandbox Accounts</span>
              </div>
              <div className="space-y-1 bg-white p-2.5 rounded-xl border border-slate-150">
                <div className="flex justify-between">
                  <span className="font-medium text-slate-400">Orang Tua:</span>
                  <span className="font-bold text-slate-700">parent@demo.com</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-slate-400">Petugas / Admin:</span>
                  <span className="font-bold text-slate-700">admin@demo.com</span>
                </div>
                <div className="flex justify-between border-t border-slate-100 pt-1 mt-1">
                  <span className="font-medium text-slate-400">Kata Sandi:</span>
                  <span className="font-bold text-emerald-600">password</span>
                </div>
              </div>
            </div>

          </div>
        </section>

      </div>
    </main>
  );
}
