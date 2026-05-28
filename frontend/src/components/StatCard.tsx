import type { ReactNode } from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  caption?: string;
  icon: ReactNode;
  tone?: "green" | "amber" | "red" | "blue" | "neutral";
}

const toneClass = {
  green: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  amber: "bg-amber-50 text-amber-700 ring-amber-100",
  red: "bg-red-50 text-red-700 ring-red-100",
  blue: "bg-sky-50 text-sky-700 ring-sky-100",
  neutral: "bg-slate-50 text-slate-700 ring-slate-100",
};

export default function StatCard({ title, value, caption, icon, tone = "neutral" }: StatCardProps) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-2 text-2xl font-bold text-slate-950">{value}</p>
          {caption ? <p className="mt-1 text-xs text-slate-500">{caption}</p> : null}
        </div>
        <div className={`rounded-lg p-3 ring-1 ${toneClass[tone]}`}>{icon}</div>
      </div>
    </section>
  );
}
