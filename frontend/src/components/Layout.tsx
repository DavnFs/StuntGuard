import {
  Activity,
  BarChart3,
  Bot,
  BrainCircuit,
  ClipboardPlus,
  LayoutDashboard,
  Users,
} from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/children", label: "Data Balita", icon: Users },
  { to: "/predict", label: "Prediksi Cepat", icon: ClipboardPlus },
  { to: "/chatbot", label: "Edukasi Gizi", icon: Bot },
  { to: "/model", label: "Tentang Model", icon: BrainCircuit },
];

export default function Layout() {
  return (
    <div className="min-h-screen bg-slate-50">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-72 border-r border-slate-200 bg-white px-5 py-6 lg:block">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-brand-600 p-2 text-white">
            <Activity className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-950">StuntGuard</h1>
            <p className="text-xs text-slate-500">Skrining awal stunting</p>
          </div>
        </div>
        <nav className="mt-8 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                    isActive
                      ? "bg-brand-50 text-brand-700"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                  }`
                }
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>
        <div className="absolute bottom-6 left-5 right-5 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-800">
          Hasil aplikasi hanya untuk skrining awal dan edukasi. Diagnosis resmi tetap melalui tenaga kesehatan.
        </div>
      </aside>

      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-brand-600" />
            <span className="font-bold text-slate-950">StuntGuard</span>
          </div>
          <BarChart3 className="h-5 w-5 text-slate-500" />
        </div>
        <nav className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                `whitespace-nowrap rounded-lg px-3 py-2 text-xs font-semibold ${
                  isActive ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-600"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="lg:pl-72">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
