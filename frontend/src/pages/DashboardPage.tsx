import { useEffect, useState } from "react";
import { Activity, AlertTriangle, ClipboardList, TrendingUp, UserRound, Users } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import StatCard from "../components/StatCard";
import { ErrorBlock, LoadingBlock } from "../components/StateBlock";
import StatusBadge, { statusLabel } from "../components/StatusBadge";
import { api } from "../services/api";
import type { DashboardSummary, NutritionStatus } from "../types";

const STATUS_COLORS: Record<NutritionStatus, string> = {
  "severely stunted": "#dc2626",
  stunted: "#f59e0b",
  normal: "#10b981",
  tall: "#0284c7",
};

const genderLabel: Record<string, string> = {
  male: "Laki-laki",
  female: "Perempuan",
};

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .getDashboard()
      .then(setSummary)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingBlock />;
  if (error) return <ErrorBlock message={error} />;
  if (!summary) return null;

  const statusData = Object.entries(summary.count_by_nutrition_status).map(([key, value]) => ({
    name: statusLabel[key as NutritionStatus],
    raw: key as NutritionStatus,
    value,
  }));

  const areaData = Object.entries(summary.count_by_posyandu_area).map(([area, count]) => ({
    area,
    count,
  }));

  const genderStatusData = summary.status_by_gender.map((row) => ({
    ...row,
    gender: genderLabel[String(row.gender)] ?? row.gender,
  }));

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold text-brand-700">Dashboard Posyandu</p>
        <h2 className="mt-1 text-2xl font-bold text-slate-950">Monitoring Risiko Stunting Balita</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <StatCard title="Total Balita" value={summary.total_children} icon={<Users className="h-5 w-5" />} tone="green" />
        <StatCard title="Total Pemeriksaan" value={summary.total_measurements} icon={<ClipboardList className="h-5 w-5" />} tone="blue" />
        <StatCard title="Normal" value={summary.count_by_nutrition_status.normal ?? 0} icon={<UserRound className="h-5 w-5" />} tone="green" />
        <StatCard title="Stunted" value={summary.count_by_nutrition_status.stunted ?? 0} icon={<AlertTriangle className="h-5 w-5" />} tone="amber" />
        <StatCard title="Severely Stunted" value={summary.count_by_nutrition_status["severely stunted"] ?? 0} icon={<AlertTriangle className="h-5 w-5" />} tone="red" />
        <StatCard title="Risiko Stunting" value={`${summary.stunting_percentage}%`} icon={<TrendingUp className="h-5 w-5" />} tone="amber" />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-base font-semibold text-slate-950">Distribusi Status Gizi</h3>
          <div className="mt-4 h-80">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={70} outerRadius={110} paddingAngle={3}>
                  {statusData.map((item) => (
                    <Cell key={item.raw} fill={STATUS_COLORS[item.raw]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-base font-semibold text-slate-950">Status Berdasarkan Gender</h3>
          <div className="mt-4 h-80">
            <ResponsiveContainer>
              <BarChart data={genderStatusData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="gender" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="normal" name="Normal" stackId="a" fill={STATUS_COLORS.normal} />
                <Bar dataKey="stunted" name="Stunted" stackId="a" fill={STATUS_COLORS.stunted} />
                <Bar dataKey="severely stunted" name="Severely Stunted" stackId="a" fill={STATUS_COLORS["severely stunted"]} />
                <Bar dataKey="tall" name="Tall" stackId="a" fill={STATUS_COLORS.tall} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-base font-semibold text-slate-950">Tren Pemeriksaan Bulanan</h3>
          <div className="mt-4 h-72">
            <ResponsiveContainer>
              <LineChart data={summary.monthly_measurement_trend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Line type="monotone" dataKey="count" name="Pemeriksaan" stroke="#059669" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-base font-semibold text-slate-950">Balita per Wilayah Posyandu</h3>
          <div className="mt-4 h-72">
            <ResponsiveContainer>
              <BarChart data={areaData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="area" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" name="Balita" fill="#0f766e" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-red-600" />
          <h3 className="text-base font-semibold text-slate-950">Kasus Risiko Tinggi Terbaru</h3>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead>
              <tr className="text-left text-slate-500">
                <th className="py-3 pr-4 font-semibold">Nama</th>
                <th className="py-3 pr-4 font-semibold">Wilayah</th>
                <th className="py-3 pr-4 font-semibold">Tanggal</th>
                <th className="py-3 pr-4 font-semibold">Usia</th>
                <th className="py-3 pr-4 font-semibold">Tinggi</th>
                <th className="py-3 pr-4 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {summary.recent_high_risk_cases.length === 0 ? (
                <tr>
                  <td className="py-4 text-slate-500" colSpan={6}>
                    Belum ada kasus risiko tinggi.
                  </td>
                </tr>
              ) : (
                summary.recent_high_risk_cases.map((item) => (
                  <tr key={`${item.child_id}-${item.measurement_date}`}>
                    <td className="py-3 pr-4 font-medium text-slate-950">{item.child_name}</td>
                    <td className="py-3 pr-4 text-slate-600">{item.posyandu_area ?? "-"}</td>
                    <td className="py-3 pr-4 text-slate-600">{new Date(item.measurement_date).toLocaleDateString("id-ID")}</td>
                    <td className="py-3 pr-4 text-slate-600">{item.age_month} bulan</td>
                    <td className="py-3 pr-4 text-slate-600">{item.height_cm} cm</td>
                    <td className="py-3 pr-4">
                      <StatusBadge value={item.predicted_status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
