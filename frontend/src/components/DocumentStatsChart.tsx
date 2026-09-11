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
      return createdAt.getFullYear() === currentYear && createdAt.getMonth() === index;
    }).length,
  }));

  return (
    <section className="space-y-4 rounded-3xl border border-emerald-500/30 bg-[#0b1f14]/60 p-6 shadow-[0_8px_32px_0_rgba(0,20,10,0.37)] backdrop-blur-2xl">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-white">Statistik Arsip Dokumen</h2>
          <p className="mt-1 text-xs text-slate-400">Jumlah dokumen yang diunggah per bulan</p>
        </div>
        <span className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-400">
          Tahun {currentYear}
        </span>
      </div>

      <div className="h-72 w-full pt-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={monthlyCounts} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#064e3b" vertical={false} />
            <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis allowDecimals={false} stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip
              cursor={{ fill: "rgba(16, 185, 129, 0.08)" }}
              contentStyle={{
                backgroundColor: "#061a10",
                borderColor: "#059669",
                borderRadius: "0.75rem",
                color: "#f8fafc",
                fontSize: "12px",
              }}
              formatter={(value) => [`${value} dokumen`, "Jumlah"]}
            />
            <Bar dataKey="documents" name="Dokumen" fill="#10b981" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
