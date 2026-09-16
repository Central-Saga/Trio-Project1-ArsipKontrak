"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Download, FileText, Lock, Plus } from "lucide-react";
import api from "@/lib/api";
import UploadVersionModal from "@/components/UploadVersionModal";

interface VersionItem {
  id: number;
  version_number: string;
  file_name: string;
  file_size: number;
  file_hash: string;
  notes: string;
  uploader?: { name: string };
  created_at: string;
}

interface DocumentDetail {
  id: number;
  document_number: string;
  document_name: string;
  document_type: string;
  partner: string;
  document_date: string;
  effective_date: string;
  expiry_date: string;
  status: string;
  description: string;
  project?: { name: string };
  creator?: { name: string };
  versions: VersionItem[];
}

interface CurrentUser {
  id: number;
  name: string;
  email: string;
  role: string;
}

export default function DocumentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id;

  const [docDetail, setDocDetail] = useState<DocumentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVersionId, setSelectedVersionId] = useState<number | null>(
    null,
  );
  const [isVersionModalOpen, setIsVersionModalOpen] = useState(false);
  const [user, setUser] = useState<CurrentUser | null>(null);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  useEffect(() => {
    const storedUser =
      localStorage.getItem("user_data") || localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        setUser(null);
      }
    }
  }, []);

  const fetchDetail = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const res = await api.get(`/documents/${id}`);
      const docData = res.data.data;
      setDocDetail(docData);
      if (docData.versions && docData.versions.length > 0) {
        setSelectedVersionId(docData.versions[0].id);
      }
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || "Gagal memuat detail dokumen.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  useEffect(() => {
    let objectUrl: string | null = null;
    const loadPreview = async () => {
      if (!selectedVersionId || !id) return;
      try {
        setPreviewLoading(true);
        const response = await api.get(
          `/documents/${id}/preview?version_id=${selectedVersionId}`,
          {
            responseType: "blob",
          },
        );
        const blob = new Blob([response.data], { type: "application/pdf" });
        objectUrl = window.URL.createObjectURL(blob);

        const finalUrl =
          user?.role === "admin" ? objectUrl : `${objectUrl}#toolbar=0`;
        setPreviewUrl(finalUrl);
      } catch (err) {
        console.error("Gagal memuat pratinjau PDF", err);
        setPreviewUrl(null);
      } finally {
        setPreviewLoading(false);
      }
    };

    loadPreview();

    return () => {
      if (objectUrl) {
        window.URL.revokeObjectURL(objectUrl);
      }
    };
  }, [selectedVersionId, id, user?.role]);

  const handleDownload = async (versionId: number) => {
    try {
      const response = await api.get(
        `/documents/${id}/download?version_id=${versionId}`,
        {
          responseType: "blob",
        },
      );
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = window.document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `${docDetail?.document_number || "document"}-v${versionId}.pdf`,
      );
      window.document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err: any) {
      if (err.response?.data instanceof Blob) {
        err.response.data.text().then((text: string) => {
          try {
            const errorJson = JSON.parse(text);
            alert(
              `Gagal Unduh: ${errorJson.message || errorJson.error || "Kesalahan server"}`,
            );
          } catch {
            alert("Gagal mengunduh berkas terenkripsi.");
          }
        });
      } else {
        alert(
          err.response?.data?.message || "Gagal mengunduh berkas terenkripsi.",
        );
      }
    }
  };

  // Helper untuk menentukan warna badge status secara dinamis dan aman
  const getStatusBadgeStyle = (status: string) => {
    switch (status?.toLowerCase()) {
      case "active":
        return "bg-emerald-100 text-emerald-800 border border-emerald-200";
      case "draft":
        return "bg-amber-100 text-amber-800 border border-amber-200";
      case "expired":
        return "bg-rose-100 text-rose-800 border border-rose-200";
      case "terminated":
        return "bg-slate-200 text-slate-800 border border-slate-300";
      default:
        return "bg-slate-100 text-slate-800 border border-slate-200";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500 text-sm">
        Memuat detail dokumen...
      </div>
    );
  }

  if (error || !docDetail) {
    return (
      <div className="min-h-screen bg-slate-50 p-8 flex flex-col items-center justify-center">
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-600 mb-4">
          {error || "Dokumen tidak ditemukan."}
        </div>
        <button
          onClick={() => router.push("/")}
          className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-500 transition"
        >
          Kembali ke Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10 text-slate-900">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.push("/")}
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-emerald-600 transition"
          >
            <ArrowLeft className="h-4 w-4" /> Kembali ke Dashboard
          </button>

          {user?.role === "admin" && (
            <button
              onClick={() => setIsVersionModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-500 transition"
            >
              <Plus className="h-4 w-4" /> Unggah Versi Baru / Adendum
            </button>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 border border-emerald-200">
                <Lock className="h-3 w-3" /> {docDetail.document_number}
              </span>
              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold uppercase ${getStatusBadgeStyle(
                  docDetail.status,
                )}`}
              >
                {docDetail.status}
              </span>
              <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700 uppercase">
                {docDetail.document_type}
              </span>
            </div>
          </div>

          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {docDetail.document_name}
            </h1>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4 border-t border-slate-100 text-sm">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Pihak Rekanan (Partner)
              </p>
              <p className="mt-1 font-medium text-slate-800">
                {docDetail.partner}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Project Terkait
              </p>
              <p className="mt-1 font-medium text-slate-800">
                {docDetail.project?.name || "-"}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Dibuat Oleh
              </p>
              <p className="mt-1 font-medium text-slate-800">
                {docDetail.creator?.name || "Administrator"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4 border-t border-slate-100 text-sm">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Tanggal Dokumen
              </p>
              <p className="mt-1 font-medium text-slate-800">
                {docDetail.document_date || "-"}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Tanggal Efektif
              </p>
              <p className="mt-1 font-medium text-slate-800">
                {docDetail.effective_date || "-"}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Tanggal Berakhir
              </p>
              <p className="mt-1 font-medium text-slate-800">
                {docDetail.expiry_date || "-"}
              </p>
            </div>
          </div>

          {docDetail.description && (
            <div className="pt-4 border-t border-slate-100">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Deskripsi / Catatan Ruang Lingkup
              </p>
              <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
                {docDetail.description}
              </p>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Riwayat Versi Dokumen &amp; Berkas
              </h2>
              <p className="text-xs text-slate-500">
                Setiap perubahan berkas tercatat aman dengan SHA-256 Checksum.
              </p>
            </div>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200">
              {docDetail.versions.length} Versi Tersedia
            </span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-6 py-3.5">Versi</th>
                  <th className="px-6 py-3.5">Nama Berkas PDF</th>
                  <th className="px-6 py-3.5">SHA-256 Checksum Hash</th>
                  <th className="px-6 py-3.5">Catatan Revisi</th>
                  <th className="px-6 py-3.5">Pengunggah</th>
                  {user?.role === "admin" && (
                    <th className="px-6 py-3.5 text-right">Aksi Unduh</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
                {docDetail.versions.map((ver) => (
                  <tr key={ver.id} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-4 font-semibold text-emerald-600">
                      {ver.version_number}
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-900 flex items-center gap-2">
                      <FileText className="h-4 w-4 text-slate-400" />{" "}
                      {ver.file_name}
                    </td>
                    <td
                      className="px-6 py-4 font-mono text-xs text-slate-500 truncate max-w-xs"
                      title={ver.file_hash}
                    >
                      {ver.file_hash}
                    </td>
                    <td className="px-6 py-4 text-slate-600">{ver.notes}</td>
                    <td className="px-6 py-4 text-slate-600">
                      {ver.uploader?.name || "Admin"}
                    </td>
                    {user?.role === "admin" && (
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleDownload(ver.id)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition"
                        >
                          <Download className="h-3.5 w-3.5" /> Unduh PDF
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Pratinjau Dokumen PDF
              </h2>
              <p className="text-xs text-slate-500">
                Menampilkan isi berkas kontrak secara langsung.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
              <span>Pilih Versi:</span>
              <select
                value={selectedVersionId || ""}
                onChange={(e) => setSelectedVersionId(Number(e.target.value))}
                className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-800 focus:bg-white focus:border-emerald-500 focus:outline-none"
              >
                {docDetail.versions.map((ver) => (
                  <option key={ver.id} value={ver.id}>
                    Versi {ver.version_number} ({ver.file_name})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="h-[500px] w-full rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden">
            {previewLoading ? (
              <p className="text-sm text-slate-500 animate-pulse">
                Memuat pratinjau terenkripsi...
              </p>
            ) : previewUrl ? (
              <iframe
                src={previewUrl}
                className="h-full w-full border-0"
                title="Pratinjau PDF"
              />
            ) : (
              <p className="text-sm text-slate-400">
                Gagal memuat pratinjau berkas.
              </p>
            )}
          </div>
        </div>
      </div>

      {user?.role === "admin" && (
        <UploadVersionModal
          isOpen={isVersionModalOpen}
          onClose={() => setIsVersionModalOpen(false)}
          onSuccess={fetchDetail}
          documentId={Number(id)}
        />
      )}
    </div>
  );
}
