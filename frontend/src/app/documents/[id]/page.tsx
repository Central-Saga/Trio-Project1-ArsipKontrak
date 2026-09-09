"use client";

import { useEffect, useState, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

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
  description: string | null;
  project?: {
    id: number;
    project_name: string;
    project_code: string;
  };
  creator?: {
    name: string;
  };
}

interface DocumentVersion {
  id: number;
  version_number: string;
  file_name: string;
  file_size?: number;
  file_hash: string;
  notes?: string;
  created_at: string;
  uploader?: {
    name: string;
  };
}

export default function DocumentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const documentId = resolvedParams.id;
  const router = useRouter();

  const [document, setDocument] = useState<DocumentDetail | null>(null);
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal Upload Versi Baru / Adendum
  const [showNewVersionModal, setShowNewVersionModal] = useState(false);
  const [versionNumberInput, setVersionNumberInput] = useState("v1.1");
  const [notesInput, setNotesInput] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadingVersion, setUploadingVersion] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const fetchDocumentData = useCallback(async () => {
    try {
      setLoading(true);
      const [docRes, verRes] = await Promise.all([
        api.get(`/documents/${documentId}`),
        api.get(`/documents/${documentId}/versions`),
      ]);
      setDocument(docRes.data?.data || docRes.data);
      setVersions(verRes.data?.data || verRes.data);
    } catch (err: any) {
      setError(err.response?.data?.message || "Gagal memuat detail dokumen.");
    } finally {
      setLoading(false);
    }
  }, [documentId]);

  useEffect(() => {
    fetchDocumentData();
  }, [fetchDocumentData]);

  const handleUploadVersion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setUploadError("Pilih file PDF adendum/versi baru.");
      return;
    }

    setUploadingVersion(true);
    setUploadError("");

    const payload = new FormData();
    payload.append("version_number", versionNumberInput);
    payload.append("file", selectedFile);
    if (notesInput) payload.append("notes", notesInput);

    try {
      await api.post(`/documents/${documentId}/versions`, payload, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setShowNewVersionModal(false);
      setSelectedFile(null);
      setNotesInput("");
      fetchDocumentData();
    } catch (err: any) {
      setUploadError(err.response?.data?.message || "Gagal mengunggah versi baru.");
    } finally {
      setUploadingVersion(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      active: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      draft: "bg-amber-500/10 text-amber-400 border-amber-500/20",
      expired: "bg-rose-500/10 text-rose-400 border-rose-500/20",
      terminated: "bg-slate-800 text-slate-400 border-slate-700",
    };
    return (
      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${colors[status?.toLowerCase()] || colors.draft}`}>
        {status?.toUpperCase()}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-sm">
        Memuat detail arsip dokumen...
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4">
        <div className="text-rose-400 text-sm font-medium">{error || "Dokumen tidak ditemukan."}</div>
        <button
          onClick={() => router.push("/")}
          className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-medium hover:bg-emerald-700"
        >
          Kembali ke Dashboard
        </button>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 p-6 md:p-10 text-slate-100">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Navigasi & Aksi Kembali */}
        <div className="flex justify-between items-center">
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-emerald-400 transition"
          >
            &larr; Kembali ke Dashboard
          </button>
          <button
            onClick={() => setShowNewVersionModal(true)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-lg shadow-sm transition"
          >
            + Unggah Versi Baru / Adendum
          </button>
        </div>

        {/* Kartu Informasi Utama */}
        <div className="bg-slate-900/70 rounded-2xl border border-slate-800 shadow-xl p-6 space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono font-semibold px-2.5 py-1 bg-slate-800 text-slate-300 rounded-lg">
                  {document.document_number}
                </span>
                {getStatusBadge(document.status)}
                <span className="text-xs uppercase font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
                  {document.document_type}
                </span>
              </div>
              <h1 className="text-xl font-bold text-white mt-2">{document.document_name}</h1>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
            <div className="space-y-1">
              <span className="text-slate-400 font-medium">Pihak Rekanan (Partner)</span>
              <div className="font-semibold text-slate-200 text-sm">{document.partner}</div>
            </div>
            <div className="space-y-1">
              <span className="text-slate-400 font-medium">Project Terkait</span>
                <div className="font-semibold text-slate-200 text-sm">
                {document.project ? `[${document.project.project_code}] ${document.project.project_name}` : "-"}
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-slate-400 font-medium">Dibuat Oleh</span>
              <div className="font-semibold text-slate-200 text-sm">{document.creator?.name || "Administrator"}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-slate-800 text-xs">
            <div>
              <span className="text-slate-500">Tanggal Dokumen:</span> <strong className="text-slate-300">{document.document_date}</strong>
            </div>
            <div>
              <span className="text-slate-500">Tanggal Efektif:</span> <strong className="text-slate-300">{document.effective_date}</strong>
            </div>
            <div>
              <span className="text-slate-500">Tanggal Berakhir:</span> <strong className="text-rose-400">{document.expiry_date}</strong>
            </div>
          </div>

          {document.description && (
            <div className="pt-4 border-t border-slate-800 text-xs space-y-1">
              <span className="text-slate-400 font-medium">Deskripsi / Catatan Ruang Lingkup:</span>
              <p className="text-slate-300 bg-slate-800/60 p-3 rounded-xl border border-slate-700 leading-relaxed">
                {document.description}
              </p>
            </div>
          )}
        </div>

        {/* Tabel Riwayat Versi Dokumen */}
        <div className="bg-slate-900/70 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center">
            <div>
              <h2 className="font-semibold text-slate-200 text-sm">Riwayat Versi Dokumen & Berkas</h2>
              <p className="text-xs text-slate-500">Setiap perubahan berkas tercatat aman dengan SHA-256 Checksum.</p>
            </div>
            <span className="text-xs bg-slate-800 text-slate-400 px-2.5 py-1 rounded-lg font-medium">
              {versions.length} Versi Tersedia
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/50 text-slate-500 font-medium border-b border-slate-800">
                <tr>
                  <th className="px-6 py-3">Versi</th>
                  <th className="px-6 py-3">Nama Berkas PDF</th>
                  <th className="px-6 py-3">SHA-256 Checksum Hash</th>
                  <th className="px-6 py-3">Catatan Revisi</th>
                  <th className="px-6 py-3">Pengunggah</th>
                  <th className="px-6 py-3 text-right">Aksi Unduh</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {versions.map((ver) => (
                  <tr key={ver.id} className="hover:bg-slate-800/40 transition">
                    <td className="px-6 py-4 font-bold text-emerald-600">{ver.version_number}</td>
                    <td className="px-6 py-4 font-medium text-slate-200">{ver.file_name}</td>
                    <td className="px-6 py-4 font-mono text-slate-500 text-[11px] truncate max-w-[200px]" title={ver.file_hash}>
                      {ver.file_hash}
                    </td>
                    <td className="px-6 py-4 text-slate-400">{ver.notes || "-"}</td>
                    <td className="px-6 py-4 text-slate-300">{ver.uploader?.name || "Admin"}</td>
                    <td className="px-6 py-4 text-right">
                      <a
                        href={`http://localhost:8000/api/documents/${documentId}/versions/${ver.id}/download`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 font-medium rounded-lg border border-emerald-500/20 transition"
                      >
                        Unduh PDF
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal Unggah Versi Baru */}
      {showNewVersionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-slate-900 rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4 border border-slate-800">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-white">Unggah Versi Baru / Adendum</h3>
              <button onClick={() => setShowNewVersionModal(false)} className="text-slate-400 hover:text-slate-600 text-lg">
                &times;
              </button>
            </div>

            {uploadError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs">
                {uploadError}
              </div>
            )}

            <form onSubmit={handleUploadVersion} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Nomor Versi (misal: v1.1 atau v2.0)</label>
                <input
                  type="text"
                  required
                  value={versionNumberInput}
                  onChange={(e) => setVersionNumberInput(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800/60 border border-slate-700 rounded-xl text-xs text-slate-100 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Berkas PDF Baru (Max 20MB)</label>
                <input
                  type="file"
                  accept=".pdf"
                  required
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-500/10 file:text-emerald-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Catatan Revisi / Adendum (Opsional)</label>
                <textarea
                  rows={2}
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  placeholder="Keterangan perubahan klausul atau penambahan adendum..."
                  className="w-full px-3 py-2 bg-slate-800/60 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
                ></textarea>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  disabled={uploadingVersion}
                  onClick={() => setShowNewVersionModal(false)}
                  className="px-3 py-2 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={uploadingVersion}
                  className="px-4 py-2 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm disabled:opacity-50"
                >
                  {uploadingVersion ? "Mengunggah..." : "Simpan Versi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
