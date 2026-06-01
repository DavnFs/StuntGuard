import type { ReactNode } from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  caption?: string;
  icon: ReactNode;
  tone?: "green" | "amber" | "red" | "blue" | "neutral";
}

const toneClass = {
  green: "bg-care-50 text-care-700 ring-care-100 from-care-400 to-brand-600",
  amber: "bg-amber-50 text-amber-700 ring-amber-100 from-amber-300 to-amber-500",
  red: "bg-red-50 text-red-700 ring-red-100 from-red-400 to-red-600",
  blue: "bg-brand-50 text-brand-700 ring-brand-100 from-brand-400 to-brand-700",
  neutral: "bg-slate-50 text-slate-700 ring-slate-100 from-slate-300 to-slate-500",
};

export default function StatCard({ title, value, caption, icon, tone = "neutral" }: StatCardProps) {
  return (
    <section className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-4 shadow-card transition duration-200 hover:-translate-y-0.5 hover:border-brand-100 hover:shadow-lg">
      <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${toneClass[tone]}`} />
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-500">{title}</p>
          <p className="mt-2 font-heading text-2xl font-extrabold text-slate-950">{value}</p>
          {caption ? <p className="mt-1 text-xs text-slate-500">{caption}</p> : null}
        </div>
        <div className={`rounded-xl p-3 ring-1 ring-inset transition duration-200 group-hover:scale-105 ${toneClass[tone]}`}>{icon}</div>
      </div>
    </section>
  );
}
