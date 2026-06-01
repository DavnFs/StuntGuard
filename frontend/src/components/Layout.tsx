import {
  Activity,
  Bot,
  BrainCircuit,
  ClipboardPlus,
  ClipboardList,
  LogOut,
  LayoutDashboard,
  MessageSquareText,
  ShieldCheck,
  Users,
} from "lucide-react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";

import { clearCurrentUser, getCurrentUser } from "../services/auth";

function getNavItems(role?: string) {
  if (role === "admin") {
    return [
      { to: "/app/admin", label: "Admin Dashboard", icon: LayoutDashboard },
      { to: "/app/children", label: "Data Balita", icon: Users },
      { to: "/app/measurements", label: "Data Pemeriksaan", icon: ClipboardList },
      { to: "/app/consultations", label: "Konsultasi", icon: MessageSquareText },
      { to: "/app/model", label: "Tentang Model", icon: BrainCircuit },
    ];
  }
  return [
    { to: "/app/parent", label: "Parent Dashboard", icon: LayoutDashboard },
    { to: "/app/children", label: "Riwayat Anak", icon: Users },
    { to: "/app/predict", label: "Prediksi Cepat", icon: ClipboardPlus },
    { to: "/app/consultations", label: "Konsultasi", icon: MessageSquareText },
    { to: "/chatbot", label: "Edukasi Gizi", icon: Bot },
    { to: "/app/model", label: "Tentang Model", icon: BrainCircuit },
  ];
}

export default function Layout() {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const navItems = getNavItems(user?.role);

  const logout = () => {
    clearCurrentUser();
    navigate("/", { replace: true });
  };

  return (
    <div className="min-h-screen bg-canvas text-slate-900">
      <a href="#app-content" className="skip-link">
        Langsung ke konten
      </a>

      <aside className="fixed inset-y-0 left-0 z-20 hidden w-72 overflow-hidden bg-ink-deep px-5 py-6 text-white shadow-2xl lg:flex lg:flex-col">
        <div className="pointer-events-none absolute -right-16 top-28 h-48 w-48 rounded-full border border-white/10" />
        <div className="pointer-events-none absolute -right-8 top-44 h-24 w-24 rounded-full border border-white/10" />
        <div className="pointer-events-none absolute bottom-44 left-7 top-36 w-px bg-gradient-to-b from-transparent via-brand-300/35 to-transparent" />

        <div className="relative flex items-center gap-3">
          <div className="rounded-2xl bg-white/15 p-2.5 text-brand-100 ring-1 ring-inset ring-white/20">
            <Activity className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-heading text-xl font-extrabold tracking-tight text-white">StuntGuard</h1>
            <p className="text-xs font-medium text-brand-100">Tumbuh terpantau, langkah terarah</p>
          </div>
        </div>

        <nav aria-label="Navigasi utama" className="relative mt-9 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                className={({ isActive }) =>
                  `flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition duration-200 ${
                    isActive
                      ? "bg-white text-brand-800 shadow-lg shadow-black/10"
                      : "text-brand-50/80 hover:bg-white/10 hover:text-white"
                  }`
                }
              >
                <Icon className="h-5 w-5 shrink-0" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        <div className="relative mt-auto space-y-3">
          <div className="rounded-2xl border border-white/15 bg-white/10 p-3.5 text-xs leading-5 text-brand-50">
            <p className="font-bold text-white">{user?.name ?? "Demo User"}</p>
            <p>{user?.role === "admin" ? "Admin / Petugas" : "Orang tua"}</p>
            <button
              type="button"
              onClick={logout}
              className="mt-2 inline-flex items-center gap-2 rounded-full px-1 font-bold text-brand-100 transition hover:text-white"
            >
              <LogOut className="h-4 w-4" />
              Keluar akun
            </button>
          </div>
          <div className="rounded-2xl border border-amber-200/50 bg-amber-50 p-3 text-xs leading-5 text-amber-900 shadow-card">
            <ShieldCheck className="mb-2 h-4 w-4 text-amber-700" />
            Hasil aplikasi adalah skrining awal dan edukasi. Diagnosis resmi tetap melalui tenaga kesehatan.
          </div>
        </div>
      </aside>

      <header className="sticky top-0 z-10 border-b border-brand-100 bg-white/95 px-4 py-3 shadow-sm backdrop-blur lg:hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="rounded-xl bg-brand-700 p-2 text-white">
              <Activity className="h-5 w-5" />
            </span>
            <span>
              <span className="block font-heading text-base font-extrabold text-slate-950">StuntGuard</span>
              <span className="block text-[10px] font-bold uppercase tracking-[0.14em] text-brand-700">
                {user?.role === "admin" ? "Petugas" : "Orang tua"}
              </span>
            </span>
          </div>
          <button
            type="button"
            onClick={logout}
            aria-label="Keluar akun"
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
        <nav aria-label="Navigasi utama" className="no-scrollbar mt-3 flex gap-2 overflow-x-auto pb-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                className={({ isActive }) =>
                  `inline-flex min-h-11 items-center gap-2 whitespace-nowrap rounded-full px-3.5 py-2 text-xs font-bold transition ${
                    isActive
                      ? "bg-brand-700 text-white shadow-sm"
                      : "border border-slate-200 bg-white text-slate-600 hover:border-brand-200 hover:bg-brand-50 hover:text-brand-800"
                  }`
                }
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>
      </header>

      <main id="app-content" tabIndex={-1} className="min-w-0 lg:pl-72">
        <div className="mx-auto min-w-0 max-w-[1480px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
