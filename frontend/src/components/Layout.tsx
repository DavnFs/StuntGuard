import {
  Bot,
  BrainCircuit,
  ClipboardPlus,
  LogOut,
  LayoutDashboard,
  MessageSquareText,
  ShieldCheck,
  Users,
} from "lucide-react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";

import { clearCurrentUser, getCurrentUser } from "../services/auth";

function getNavItems() {
  return [
    { to: "/app/parent", label: "Dashboard", icon: LayoutDashboard },
    { to: "/app/children", label: "Data Anak", icon: Users },
    { to: "/app/chatbot", label: "Asisten AI", icon: Bot },
  ];
}

export default function Layout() {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const navItems = getNavItems();

  const logout = () => {
    clearCurrentUser();
    navigate("/", { replace: true });
  };

  return (
    <div className="min-h-screen bg-canvas text-slate-900">
      <a href="#app-content" className="skip-link">
        Langsung ke konten
      </a>

      <aside className="fixed inset-y-0 left-0 z-20 hidden w-72 overflow-hidden bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 px-5 py-6 text-white shadow-2xl lg:flex lg:flex-col border-r border-white/5">
        {/* Glowing floating orbs inside sidebar */}
        <div className="pointer-events-none absolute -right-24 -top-24 h-48 w-48 rounded-full bg-cyan-500/10 blur-3xl animate-pulse-glow" />
        <div className="pointer-events-none absolute -left-20 bottom-10 h-40 w-40 rounded-full bg-emerald-500/5 blur-3xl" />
        
        <div className="relative flex items-center gap-3">
          <div className="relative rounded-2xl bg-white/5 p-1.5 ring-1 ring-inset ring-white/10 shadow-inner">
            <img src="/logo.png" alt="StuntGuard" className="h-8 w-8 rounded-lg object-contain" />
            <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-slate-950 animate-pulse" />
          </div>
          <div>
            <h1 className="font-heading text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
              StuntGuard
            </h1>
            <p className="text-[10px] font-medium text-slate-400">Tumbuh terpantau, langkah terarah</p>
          </div>
        </div>

        <nav aria-label="Navigasi utama" className="relative mt-9 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                className={({ isActive }) =>
                  `group flex min-h-10 items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition duration-300 relative ${
                    isActive
                      ? "bg-gradient-to-r from-cyan-600 to-cyan-700 text-white shadow-lg shadow-cyan-900/40 border-l-4 border-cyan-400"
                      : "text-slate-400 hover:bg-white/5 hover:text-slate-100"
                  }`
                }
              >
                <Icon className="h-4 w-4 shrink-0 transition-transform duration-300 group-hover:scale-110" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="relative mt-auto space-y-4">
          <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-4 text-xs leading-5 text-slate-300 backdrop-blur-md">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <p className="font-bold text-white">{user?.name ?? "Demo User"}</p>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">Orang Tua / Wali</p>
            <button
              type="button"
              onClick={logout}
              className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-white transition hover:bg-white/10 hover:text-white"
            >
              <LogOut className="h-3.5 w-3.5" />
              Keluar akun
            </button>
          </div>
          <div className="rounded-2xl border border-amber-500/10 bg-amber-500/[0.04] p-4 text-xs leading-5 text-amber-200/90 shadow-card">
            <div className="flex items-center gap-2 font-semibold text-amber-400 mb-1">
              <ShieldCheck className="h-4 w-4 shrink-0 text-amber-400" />
              <span>Pemberitahuan</span>
            </div>
            Hasil aplikasi adalah skrining awal & edukasi gizi. Diagnosis resmi tetap melalui Puskesmas atau tenaga kesehatan.
          </div>
        </div>
      </aside>

      <header className="sticky top-0 z-10 border-b border-slate-100 bg-white/95 px-4 py-3 shadow-sm backdrop-blur-md lg:hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="relative rounded-xl bg-slate-50 p-1 border border-slate-100 shadow-sm">
              <img src="/logo.png" alt="StuntGuard" className="h-8 w-8 rounded-lg object-contain" />
              <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-white animate-pulse" />
            </span>
            <span>
              <span className="block font-heading text-sm font-bold text-slate-950">StuntGuard</span>
              <span className="block text-[9px] font-bold uppercase tracking-[0.12em] text-cyan-600">
                Orang tua
              </span>
            </span>
          </div>
          <button
            type="button"
            onClick={logout}
            aria-label="Keluar akun"
            className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700"
          >
            <LogOut className="h-4 w-4" />
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
                  `inline-flex min-h-9 items-center gap-2 whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                    isActive
                      ? "bg-cyan-600 text-white shadow-sm"
                      : "border border-slate-200 bg-white text-slate-600 hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-800"
                  }`
                }
              >
                <Icon className="h-3.5 w-3.5" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>
      </header>

      <main id="app-content" tabIndex={-1} className="min-w-0 lg:pl-72 bg-dot-pattern min-h-screen">
        <div className="mx-auto min-w-0 max-w-[1480px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
