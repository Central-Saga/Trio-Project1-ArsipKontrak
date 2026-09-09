"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { DocumentItem } from "@/types/document";

export default function DashboardPage() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        setLoading(true);
        const response = await api.get("/documents");
        // Mendukung response pagination Laravel atau array langsung
        const data = response.data?.data || response.data || [];
        setDocuments(data);
      } catch (err: any) {
        setError(
          err.response?.data?.message || err.message || "Gagal memuat dokumen",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, []);

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      active: "bg-emerald-100 text-emerald-700 border-emerald-300",
      draft: "bg-amber-100 text-amber-700 border-amber-300",
      expired: "bg-rose-100 text-rose-700 border-rose-300",
      terminated: "bg-slate-100 text-slate-700 border-slate-300",
    };
    return (
      <span
        className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${colors[status] || colors.draft}`}
      >
        {status.toUpperCase()}
      </span>
    );
  };

  return (
    <main className="min-h-screen bg-slate-50 p-6 md:p-10 text-slate-800">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Dashboard */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Sistem Manajemen Arsip Kontrak & MoU
            </h1>
            <p className="text-sm text-slate-500">
              Kelola dan telusuri seluruh dokumen legal dan riwayat versinya.
            </p>
          </div>
          <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg shadow-sm transition">
            + Unggah Dokumen Baru
          </button>
        </div>

        {/* Tabel Dokumen */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
            <h2 className="font-semibold text-slate-800">
              Daftar Arsip Dokumen
            </h2>
            <span className="text-xs text-slate-400">
              Total: {documents.length} Dokumen
            </span>
          </div>

          {loading ? (
            <div className="p-8 text-center text-slate-500 text-sm">
              Memuat data dokumen dari server...
            </div>
          ) : error ? (
            <div className="p-8 text-center text-rose-500 text-sm">
              Terjadi kesalahan: {error}
            </div>
          ) : documents.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">
              Belum ada arsip dokumen yang tersimpan di database.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3.5">Nomor & Nama Dokumen</th>
                    <th className="px-6 py-3.5">Tipe</th>
                    <th className="px-6 py-3.5">Pihak Rekanan</th>
                    <th className="px-6 py-3.5">Masa Berlaku</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {documents.map((doc) => (
                    <tr
                      key={doc.id}
                      className="hover:bg-slate-50/75 transition"
                    >
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-900">
                          {doc.document_name}
                        </div>
                        <div className="text-xs text-slate-400 font-mono mt-0.5">
                          {doc.document_number}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="capitalize text-slate-600">
                          {doc.document_type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-700">
                        {doc.partner}
                      </td>
                      <td className="px-6 py-4 text-slate-600 text-xs">
                        <div>Efektif: {doc.effective_date}</div>
                        <div className="text-rose-600 mt-0.5">
                          Exp: {doc.expiry_date}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(doc.status)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="text-indigo-600 hover:text-indigo-800 font-medium text-xs">
                          Lihat Detail
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
