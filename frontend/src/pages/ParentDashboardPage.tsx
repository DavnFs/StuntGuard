import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Baby, ClipboardPlus, MessageSquareText } from "lucide-react";

import StatCard from "../components/StatCard";
import { ErrorBlock, LoadingBlock } from "../components/StateBlock";
import { api } from "../services/api";
import type { Child } from "../types";

export default function ParentDashboardPage() {
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .getChildren()
      .then(setChildren)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingBlock />;
  if (error) return <ErrorBlock message={error} />;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold text-brand-700">Parent Dashboard</p>
        <h2 className="mt-1 text-2xl font-bold text-slate-950">Riwayat Pertumbuhan Anak</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard title="Data Anak Tersimpan" value={children.length} icon={<Baby className="h-5 w-5" />} tone="green" />
        <StatCard title="Skrining Cepat" value="Aktif" icon={<ClipboardPlus className="h-5 w-5" />} tone="blue" />
        <StatCard title="Konsultasi" value="Ticket" icon={<MessageSquareText className="h-5 w-5" />} tone="amber" />
      </div>

      <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-card">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h3 className="text-base font-semibold text-slate-950">Anak Terdaftar</h3>
            <p className="mt-1 text-sm text-slate-500">Simpan data anak untuk melihat grafik tinggi dan berat dari waktu ke waktu.</p>
          </div>
          <Link to="/app/children" className="rounded-lg bg-care-600 px-4 py-2 text-sm font-semibold text-white hover:bg-care-700">
            Kelola Riwayat Anak
          </Link>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {children.length === 0 ? (
            <p className="text-sm text-slate-500">Belum ada data anak.</p>
          ) : (
            children.slice(0, 6).map((child) => (
              <Link
                key={child.id}
                to={`/app/children/${child.id}`}
                className="rounded-xl border border-slate-200 p-4 hover:bg-slate-50"
              >
                <p className="font-semibold text-slate-950">{child.name}</p>
                <p className="mt-1 text-sm text-slate-500">
                  {child.gender === "male" ? "Laki-laki" : "Perempuan"} | {child.posyandu_area || "Wilayah belum diisi"}
                </p>
              </Link>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
