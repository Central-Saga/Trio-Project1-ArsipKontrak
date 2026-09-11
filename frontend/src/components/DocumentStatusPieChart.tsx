"use client";

import { useEffect, useState } from "react";
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import api from "@/lib/api";

interface StatusDistributionItem {
  name: string;
  value: number;
  color: string;
}

export default function DocumentStatusPieChart() {
  const [pieData, setPieData] = useState<StatusDistributionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDistribution = async () => {
      try {
        setLoading(true);
        const response = await api.get("/dashboard/statistics");
        const distribution = response.data?.data?.distribution;
        setPieData(Array.isArray(distribution) ? distribution : []);
        setError(null);
      } catch {
        setError("Gagal memuat distribusi status dokumen.");
      } finally {
        setLoading(false);
      }
    };

    fetchDistribution();
  }, []);

  const total = pieData.reduce((sum, item) => sum + item.value, 0);
  const hasData = total > 0;

  return (
    <section className="space-y-4 rounded-3xl border border-emerald-500/30 bg-[#0b1f14]/60 p-6 shadow-[0_8px_32px_0_rgba(0,20,10,0.37)] backdrop-blur-2xl">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-white">Distribusi Status Dokumen</h2>
          <p className="mt-1 text-xs text-slate-400">Persentase status keseluruhan arsip</p>
        </div>
        <span className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-400">
          Real-time
        </span>
      </div>

      {loading ? (
        <p className="py-8 text-center text-xs text-slate-500">Memuat grafik statistik...</p>
      ) : error ? (
        <p className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-300">{error}</p>
      ) : hasData ? (
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData.filter((item) => item.value > 0)}
                cx="50%"
                cy="45%"
                innerRadius={58}
                outerRadius={88}
                paddingAngle={4}
                dataKey="value"
                nameKey="name"
              >
                {pieData.filter((item) => item.value > 0).map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value, name) => [`${value} dokumen`, name]}
                contentStyle={{
                  backgroundColor: "#061a10",
                  borderColor: "#059669",
                  borderRadius: "0.75rem",
                  color: "#f8fafc",
                  fontSize: "12px",
                }}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                wrapperStyle={{ color: "#cbd5e1", fontSize: "12px" }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="flex h-72 items-center justify-center rounded-2xl border border-dashed border-emerald-500/20 bg-emerald-950/20 text-center">
          <p className="text-xs text-slate-500">Belum ada data status dokumen untuk ditampilkan.</p>
        </div>
      )}
    </section>
  );
}
