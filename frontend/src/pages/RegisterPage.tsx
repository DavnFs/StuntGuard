import { FormEvent, useState } from "react";
import { ArrowLeft, UserPlus, ShieldCheck, Sparkles } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { ErrorBlock } from "../components/StateBlock";
import { api } from "../services/api";
import { saveCurrentUser } from "../services/auth";

export default function RegisterPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const user = await api.register({ name, email, password });
      saveCurrentUser(user);
      navigate("/app/parent", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Pendaftaran gagal");
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
              Bergabung Sekarang
            </span>
            <h1 className="mt-5 font-heading text-4xl font-extrabold leading-[1.1] text-white">
              Langkah Awal Mencegah Stunting.
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-slate-300">
              Buat akun Anda untuk menyimpan riwayat pertumbuhan anak dan mendapatkan rekomendasi nutrisi terbaik.
            </p>
          </div>

          {/* Small note */}
          <div className="relative flex items-start gap-2.5 rounded-2xl border border-white/5 bg-white/[0.02] p-4 text-xs leading-5 text-slate-400">
            <ShieldCheck className="mt-0.5 h-4.5 w-4.5 shrink-0 text-cyan-400" />
            <span>Data Anda aman bersama kami. Kami tidak akan membagikan data pribadi Anda kepada pihak ketiga.</span>
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
                <Sparkles className="h-3 w-3 text-cyan-600" /> Daftar Akun
              </span>
            </div>

            <h2 className="mt-4 font-heading text-3xl font-extrabold text-slate-950">Buat Akun</h2>
            <p className="mt-1.5 text-xs text-slate-500">
              Isi data di bawah ini untuk mulai menggunakan StuntGuard.
            </p>

            {error ? <div className="mt-5"><ErrorBlock message={error} /></div> : null}

            <form className="mt-6 space-y-4" onSubmit={submit}>
              <div>
                <label htmlFor="name" className="block text-xs font-bold text-slate-600 uppercase tracking-wide">
                  Nama Lengkap
                </label>
                <input
                  id="name"
                  required
                  type="text"
                  autoComplete="name"
                  maxLength={120}
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-bold text-slate-800 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-50"
                />
              </div>

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
                  autoComplete="new-password"
                  minLength={6}
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
                <UserPlus className="h-4 w-4" />
                {loading ? "Memproses..." : "Daftar Sekarang"}
              </button>
            </form>

            <div className="mt-8 text-center text-sm text-slate-500">
              Sudah punya akun?{" "}
              <Link to="/login" className="font-bold text-cyan-600 hover:text-cyan-700">
                Masuk di sini
              </Link>
            </div>
          </div>
        </section>

      </div>
    </main>
  );
}
