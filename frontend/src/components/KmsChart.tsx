import { useMemo } from "react";
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { MeasurementBrief } from "../types";

/* ── WHO/KMS Weight-for-age reference (simplified, gender-neutral avg) ── */
export const WHO_ZONES = [
  { age: 0, bgm: 2.1, kurang: 2.5, normalLow: 2.9, normalHigh: 3.9, lebih: 4.4 },
  { age: 3, bgm: 4.0, kurang: 4.7, normalLow: 5.2, normalHigh: 6.9, lebih: 7.7 },
  { age: 6, bgm: 5.5, kurang: 6.2, normalLow: 6.7, normalHigh: 8.6, lebih: 9.5 },
  { age: 9, bgm: 6.4, kurang: 7.2, normalLow: 7.7, normalHigh: 9.8, lebih: 10.8 },
  { age: 12, bgm: 6.9, kurang: 7.8, normalLow: 8.3, normalHigh: 10.8, lebih: 11.8 },
  { age: 18, bgm: 7.7, kurang: 8.6, normalLow: 9.2, normalHigh: 12.0, lebih: 13.2 },
  { age: 24, bgm: 8.6, kurang: 9.5, normalLow: 10.2, normalHigh: 13.2, lebih: 14.5 },
  { age: 36, bgm: 9.9, kurang: 11.0, normalLow: 11.8, normalHigh: 15.6, lebih: 17.2 },
  { age: 48, bgm: 11.2, kurang: 12.5, normalLow: 13.3, normalHigh: 17.8, lebih: 19.8 },
  { age: 60, bgm: 12.7, kurang: 14.1, normalLow: 15.1, normalHigh: 20.3, lebih: 22.6 },
];

export function interpolateZone(ageMonth: number, field: keyof (typeof WHO_ZONES)[0]): number {
  if (ageMonth <= 0) return WHO_ZONES[0][field] as number;
  if (ageMonth >= 60) return WHO_ZONES[WHO_ZONES.length - 1][field] as number;
  let low = WHO_ZONES[0];
  let high = WHO_ZONES[WHO_ZONES.length - 1];
  for (let i = 0; i < WHO_ZONES.length - 1; i++) {
    if (ageMonth >= WHO_ZONES[i].age && ageMonth <= WHO_ZONES[i + 1].age) {
      low = WHO_ZONES[i];
      high = WHO_ZONES[i + 1];
      break;
    }
  }
  const ratio = (ageMonth - low.age) / (high.age - low.age || 1);
  return Math.round(((low[field] as number) + ratio * ((high[field] as number) - (low[field] as number))) * 10) / 10;
}

export function buildChartData(measurements: Pick<MeasurementBrief, "age_month" | "weight_kg" | "kms_status">[]) {
  const ages = measurements.map((m) => m.age_month);
  const minAge = Math.max(0, Math.min(...ages, 0));
  const maxAge = Math.min(60, Math.max(...ages, 12) + 3);
  const points: Record<string, number | string | null>[] = [];

  for (let a = minAge; a <= maxAge; a++) {
    points.push({
      age_month: a,
      bgm: interpolateZone(a, "bgm"),
      kurang: interpolateZone(a, "kurang"),
      normalLow: interpolateZone(a, "normalLow"),
      normalHigh: interpolateZone(a, "normalHigh"),
      lebih: interpolateZone(a, "lebih"),
      weight_kg: null,
      kms_status: null,
    });
  }

  for (const m of measurements) {
    const existing = points.find((p) => p.age_month === m.age_month);
    if (existing) {
      existing.weight_kg = m.weight_kg;
      existing.kms_status = m.kms_status;
    } else {
      points.push({
        age_month: m.age_month,
        bgm: interpolateZone(m.age_month, "bgm"),
        kurang: interpolateZone(m.age_month, "kurang"),
        normalLow: interpolateZone(m.age_month, "normalLow"),
        normalHigh: interpolateZone(m.age_month, "normalHigh"),
        lebih: interpolateZone(m.age_month, "lebih"),
        weight_kg: m.weight_kg,
        kms_status: m.kms_status,
      });
    }
  }

  return points.sort((a, b) => (a.age_month as number) - (b.age_month as number));
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export function KmsTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d || d.weight_kg == null) return null;
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-lg">
      <p className="font-bold text-slate-900">Bulan ke-{d.age_month}</p>
      <p className="text-slate-600">Berat: <span className="font-semibold text-slate-900">{d.weight_kg} kg</span></p>
      {d.kms_status && <p className="text-slate-600">Status Pertumbuhan: <span className="font-semibold">{d.kms_status}</span></p>}
    </div>
  );
}

export function KmsChart({ measurements }: { measurements: Pick<MeasurementBrief, "age_month" | "weight_kg" | "kms_status">[] }) {
  const chartData = useMemo(() => buildChartData(measurements), [measurements]);
  const ages = chartData.map((d) => d.age_month as number);
  const minAge = Math.min(...ages, 0);
  const maxAge = Math.max(...ages, 12);

  return (
    <div className="h-[420px] w-full">
      <ResponsiveContainer>
        <ComposedChart data={chartData} margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
          <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="age_month"
            type="number"
            domain={[minAge, maxAge]}
            label={{ value: "Usia (bulan)", position: "insideBottom", offset: -10, style: { fontWeight: 600, fontSize: 12 } }}
            tick={{ fontSize: 11 }}
          />
          <YAxis
            label={{ value: "Berat (kg)", angle: -90, position: "insideLeft", offset: 5, style: { fontWeight: 600, fontSize: 12 } }}
            tick={{ fontSize: 11 }}
            domain={[0, "auto"]}
          />
          <Tooltip content={<KmsTooltip />} />

          {/* Zone bands */}
          <Area type="monotone" dataKey="lebih" fill="#fff7ed" stroke="none" isAnimationActive={false} />
          <Area type="monotone" dataKey="normalHigh" fill="#dcfce7" stroke="none" isAnimationActive={false} />
          <Area type="monotone" dataKey="kurang" fill="#fef9c3" stroke="none" isAnimationActive={false} />
          <Area type="monotone" dataKey="bgm" fill="#fee2e2" stroke="none" isAnimationActive={false} />

          {/* Zone boundary lines */}
          <Line dataKey="bgm" stroke="#ef4444" strokeWidth={1} strokeDasharray="4 3" dot={false} name="Garis Merah (BGM)" />
          <Line dataKey="kurang" stroke="#eab308" strokeWidth={1} strokeDasharray="4 3" dot={false} name="Batas Kurang" />
          <Line dataKey="normalHigh" stroke="#22c55e" strokeWidth={1} strokeDasharray="4 3" dot={false} name="Batas Normal Atas" />
          <Line dataKey="lebih" stroke="#f97316" strokeWidth={1} strokeDasharray="4 3" dot={false} name="Batas Lebih" />

          {/* Child's actual weight */}
          <Line
            dataKey="weight_kg"
            stroke="#0f172a"
            strokeWidth={3}
            dot={{ r: 5, fill: "#0f172a", stroke: "#fff", strokeWidth: 2 }}
            activeDot={{ r: 7, fill: "#0ea5e9" }}
            name="Berat Anak"
            connectNulls
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
