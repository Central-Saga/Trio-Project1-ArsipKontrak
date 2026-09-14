"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { DocumentItem } from "@/types/document";

interface Props {
  documents: DocumentItem[];
}

const monthLabels = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agu",
  "Sep",
  "Okt",
  "Nov",
  "Des",
];

export default function DocumentStatsChart({ documents }: Props) {
  const currentYear = new Date().getFullYear();
  const monthlyCounts = monthLabels.map((month, index) => ({
    month,
    documents: documents.filter((document) => {
      const createdAt = new Date(document.created_at);
      return (
        createdAt.getFullYear() === currentYear &&
        createdAt.getMonth() === index
      );
    }).length,
  }));

  return (
    <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900">
            Statistik Arsip Dokumen
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Jumlah dokumen yang diunggah per bulan
          </p>
        </div>
        <span className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
          Tahun {currentYear}
        </span>
      </div>

      <div className="h-72 w-full pt-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={monthlyCounts}
            margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#e2e8f0"
              vertical={false}
            />
            <XAxis
              dataKey="month"
              stroke="#64748b"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              allowDecimals={false}
              stroke="#64748b"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              cursor={{ fill: "rgba(16, 185, 129, 0.05)" }}
              contentStyle={{
                backgroundColor: "#ffffff",
                borderColor: "#cbd5e1",
                borderRadius: "0.75rem",
                color: "#0f172a",
                fontSize: "12px",
                boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
              }}
              formatter={(value) => [`${value} dokumen`, "Jumlah"]}
            />
            <Bar
              dataKey="documents"
              name="Dokumen"
              fill="#10b981"
              radius={[6, 6, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
