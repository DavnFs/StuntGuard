import { FormEvent, useState } from "react";
import { Activity, LogIn } from "lucide-react";
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
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-8">
      <section className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-brand-700">
          <Activity className="h-5 w-5" />
          StuntGuard
        </Link>
        <h1 className="mt-5 text-2xl font-bold text-slate-950">Login Demo</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Login diperlukan untuk menyimpan riwayat anak, melihat tren pertumbuhan, dan mengirim konsultasi.
        </p>

        {error ? <div className="mt-4"><ErrorBlock message={error} /></div> : null}

        <form className="mt-5 space-y-4" onSubmit={submit}>
          <label className="block text-sm font-medium text-slate-700">
            Email
            <input
              required
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-brand-600"
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Password
            <input
              required
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-brand-600"
            />
          </label>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
          >
            <LogIn className="h-4 w-4" />
            {loading ? "Memeriksa..." : "Masuk"}
          </button>
        </form>

        <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
          <p className="font-semibold text-slate-950">Akun demo</p>
          <p>Parent: parent@demo.com / password</p>
          <p>Admin: admin@demo.com / password</p>
        </div>
      </section>
    </main>
  );
}
