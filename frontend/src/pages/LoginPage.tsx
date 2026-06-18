import { FormEvent, useState } from "react";
import { Activity, ArrowLeft, Baby, CheckCircle2, HeartPulse, LogIn, ShieldCheck } from "lucide-react";
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
    <main className="relative min-h-screen overflow-hidden bg-canvas px-4 py-6 sm:px-6 lg:flex lg:items-center lg:justify-center lg:py-8">
      <div className="pointer-events-none absolute -left-20 top-10 h-64 w-64 rounded-full bg-brand-100/60 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 right-10 h-72 w-72 rounded-full bg-amber-100/50 blur-3xl" />

      <div className="relative mx-auto grid min-h-[680px] w-full max-w-6xl overflow-hidden rounded-[2rem] border border-brand-100 bg-white shadow-2xl shadow-brand-900/10 lg:grid-cols-[1.08fr_0.92fr]">
        <section className="relative hidden overflow-hidden bg-ink-deep p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="pointer-events-none absolute -right-24 top-14 h-72 w-72 rounded-full border border-white/10" />
          <div className="pointer-events-none absolute -right-4 top-40 h-36 w-36 rounded-full border border-brand-200/25" />
          <div className="pointer-events-none absolute bottom-24 left-20 h-52 w-52 rounded-full bg-brand-500/15 blur-2xl" />

          <Link to="/" className="relative inline-flex w-fit items-center gap-3 text-white">
            <span className="rounded-2xl bg-white/15 p-1 ring-1 ring-inset ring-white/20">
              <img src="/logo.png" alt="StuntGuard" className="h-9 w-9 rounded-xl object-contain" />
            </span>
            <span>
              <span className="block font-heading text-xl font-extrabold">StuntGuard</span>
              <span className="block text-xs font-semibold text-brand-100">Tumbuh terpantau, langkah terarah</span>
            </span>
          </Link>

          <div className="relative max-w-lg">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-200">Ruang keluarga</p>
            <h1 className="mt-4 font-heading text-5xl font-extrabold leading-[1.04]">
              Pantau pertumbuhan dengan lebih tenang.
            </h1>
            <p className="mt-5 max-w-md text-sm leading-7 text-brand-50/80">
              Simpan riwayat anak, baca tren pertumbuhan, dan teruskan pertanyaan kepada petugas saat dibutuhkan.
            </p>

            <div className="mt-8 flex items-end gap-3" aria-hidden="true">
              {[44, 68, 96, 124].map((height, index) => (
                <div key={height} className="flex flex-col items-center gap-3">
                  <span className="rounded-full bg-brand-200/80" style={{ height: 12 + index * 3, width: 12 + index * 3 }} />
                  <span className="w-px bg-gradient-to-b from-brand-200/80 to-brand-500/20" style={{ height }} />
                </div>
              ))}
              <HeartPulse className="mb-2 ml-2 h-8 w-8 text-amber-200" />
            </div>
          </div>

          <div className="relative flex items-start gap-3 rounded-2xl border border-white/15 bg-white/10 p-4 text-xs leading-5 text-brand-50">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-brand-200" />
            Data demo membantu menjelaskan alur aplikasi. Hasil skrining tetap perlu dikonsultasikan kepada tenaga kesehatan.
          </div>
        </section>

        <section className="flex items-center p-6 sm:p-10 lg:p-12">
          <div className="mx-auto w-full max-w-md">
            <Link to="/" className="inline-flex items-center gap-2 text-sm font-bold text-brand-700 transition hover:text-brand-900 lg:hidden">
              <ArrowLeft className="h-4 w-4" />
              Kembali ke beranda
            </Link>
            <div className="mt-7 inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-brand-800 lg:mt-0">
              <Baby className="h-4 w-4" />
              Akses demo
            </div>
            <h1 className="mt-5 font-heading text-4xl font-extrabold text-slate-950">Masuk ke StuntGuard</h1>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Gunakan akun demo untuk membuka riwayat anak, tren pertumbuhan, dan konsultasi petugas.
            </p>

            {error ? <div className="mt-5"><ErrorBlock message={error} /></div> : null}

            <form className="mt-6 space-y-4" onSubmit={submit}>
              <label htmlFor="email" className="block text-sm font-bold text-slate-700">
                Email
                <input
                  id="email"
                  required
                  type="email"
                  autoComplete="email"
                  maxLength={160}
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100"
                />
              </label>
              <label htmlFor="password" className="block text-sm font-bold text-slate-700">
                Password
                <input
                  id="password"
                  required
                  type="password"
                  autoComplete="current-password"
                  maxLength={160}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-100"
                />
              </label>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-care-700 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-care-700/20 transition hover:bg-care-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <LogIn className="h-4 w-4" />
                {loading ? "Memeriksa..." : "Masuk ke Dashboard"}
              </button>
            </form>

            <div className="mt-6 rounded-2xl border border-brand-100 bg-brand-50/70 p-4 text-sm leading-6 text-slate-600">
              <div className="flex items-center gap-2 font-bold text-slate-950">
                <CheckCircle2 className="h-4 w-4 text-brand-700" />
                Akun demo siap digunakan
              </div>
              <p className="mt-2">Orang tua: parent@demo.com / password</p>
              <p>Petugas: admin@demo.com / password</p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
