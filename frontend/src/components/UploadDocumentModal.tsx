"use client";

import React, { useState, useEffect } from "react";
import { X, UploadCloud, FileText, Lock } from "lucide-react";
import api from "@/lib/api";

interface UploadDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  secureMode?: boolean;
}

export default function UploadDocumentModal({
  isOpen,
  onClose,
  onSuccess,
  secureMode = true,
}: UploadDocumentModalProps) {
  const [projectId, setProjectId] = useState<number>(1);
  const [title, setTitle] = useState("");
  const [documentNumber, setDocumentNumber] = useState("");
  const [documentType, setDocumentType] = useState("contract");
  const [counterpartName, setCounterpartName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // State untuk popup sukses
  const [successPopup, setSuccessPopup] = useState(false);

  // Ambil tanggal hari ini berdasarkan waktu lokal perangkat (Format: YYYY-MM-DD)
  const getLocalDateString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const todayStr = getLocalDateString();

  useEffect(() => {
    if (isOpen) {
      const randomCode = Math.floor(1000 + Math.random() * 9000);
      setDocumentNumber(`CTR/2026/IX/${randomCode}`);
    } else {
      setProjectId(1);
      setTitle("");
      setDocumentNumber("");
      setDocumentType("contract");
      setCounterpartName("");
      setStartDate("");
      setEndDate("");
      setDescription("");
      setFile(null);
      setError(null);
      setSuccessPopup(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validasi ketat tanggal masa lalu saat submit
    if (startDate < todayStr) {
      setError(
        "Tanggal mulai tidak boleh menggunakan tanggal yang sudah berlalu.",
      );
      return;
    }

    if (endDate < startDate || endDate < todayStr) {
      setError(
        "Tanggal berakhir tidak valid atau mendahului hari ini/tanggal mulai.",
      );
      return;
    }

    if (!file) {
      setError("Silakan pilih berkas PDF dokumen terlebih dahulu.");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const formData = new FormData();
      formData.append("project_id", projectId.toString());
      formData.append("title", title);
      formData.append("document_name", title);
      formData.append("name", title);

      formData.append("document_number", documentNumber);
      formData.append("document_no", documentNumber);
      formData.append("number", documentNumber);

      formData.append("document_type", documentType);
      formData.append("type", documentType);

      formData.append("partner", counterpartName);
      formData.append("counterpart_name", counterpartName);
      formData.append("counterpart", counterpartName);
      formData.append("partner_name", counterpartName);

      formData.append("document_date", startDate);
      formData.append("date", startDate);
      formData.append("tanggal", startDate);
      formData.append("start_date", startDate);
      formData.append("effective_date", startDate);

      formData.append("expiry_date", endDate);
      formData.append("end_date", endDate);
      formData.append("expired_date", endDate);

      formData.append("description", description);
      formData.append("desc", description);

      formData.append("file", file);
      formData.append("document_file", file);

      await api.post("/documents", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      // Tampilkan popup sukses yang compact
      setSuccessPopup(true);
      setTimeout(() => {
        setSuccessPopup(false);
        onSuccess();
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error("Error details:", err);
      const errorData = err.response?.data;

      if (errorData?.errors) {
        const firstKey = Object.keys(errorData.errors)[0];
        setError(errorData.errors[firstKey][0]);
      } else if (errorData?.message) {
        setError(errorData.message);
      } else {
        setError(err.message || "Gagal terhubung ke server.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl transition-all my-8">
        {/* Popup Sukses Compact Card */}
        {successPopup && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/20 backdrop-blur-xs rounded-2xl">
            <div className="w-72 rounded-2xl bg-white p-5 text-center shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-200">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 shadow-inner">
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2.5"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4.5 12.75l6 6 9-13.5"
                  />
                </svg>
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Berhasil Diunggah!
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                Dokumen telah diamankan dengan AES-256.
              </p>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              Unggah Dokumen Baru
              {secureMode && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 border border-emerald-200">
                  <Lock className="h-3 w-3" /> AES-256
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Lengkapi data arsip kontrak/MoU beserta berkas PDF terenkripsi.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-600">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Pilih Project
              </label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-900 focus:bg-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              >
                <option value={1}>
                  [PRJ-MOU-001] Kerja Sama Digital Transformasi
                </option>
                <option value={2}>
                  [PRJ-MOU-002] Penyediaan Infrastruktur Jaringan
                </option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Tipe Dokumen
              </label>
              <select
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-900 focus:bg-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              >
                <option value="contract">Contract</option>
                <option value="mou">MoU</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Judul Dokumen
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Nama atau perihal dokumen"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Pihak Rekanan (Partner)
              </label>
              <input
                type="text"
                required
                value={counterpartName}
                onChange={(e) => setCounterpartName(e.target.value)}
                placeholder="Nama instansi / perusahaan rekanan"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Tanggal Mulai (Start Date)
              </label>
              <input
                type="date"
                required
                min={todayStr}
                value={startDate}
                onChange={(e) => {
                  const selectedDate = e.target.value;
                  if (selectedDate < todayStr) {
                    setError(
                      "Tanggal mulai tidak boleh menggunakan tanggal yang sudah berlalu.",
                    );
                  } else {
                    setError(null);
                    setStartDate(selectedDate);
                  }
                }}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-900 focus:bg-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Tanggal Berakhir (End Date)
              </label>
              <input
                type="date"
                required
                min={startDate || todayStr}
                value={endDate}
                onChange={(e) => {
                  const selectedDate = e.target.value;
                  if (
                    selectedDate < todayStr ||
                    (startDate && selectedDate < startDate)
                  ) {
                    setError(
                      "Tanggal berakhir tidak valid atau mendahului tanggal mulai.",
                    );
                  } else {
                    setError(null);
                    setEndDate(selectedDate);
                  }
                }}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-900 focus:bg-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
          </div>

          {/* File Upload Area */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Berkas PDF Dokumen (Max 20MB)
            </label>
            <label className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-6 text-center hover:bg-emerald-50/20 hover:border-emerald-500 transition cursor-pointer">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 mb-2">
                <UploadCloud className="h-5 w-5" />
              </div>
              {file ? (
                <div className="flex items-center gap-2 text-sm font-medium text-emerald-700">
                  <FileText className="h-4 w-4" />
                  <span>{file.name}</span>
                </div>
              ) : (
                <>
                  <p className="text-sm font-medium text-slate-700">
                    Klik untuk memilih berkas atau seret ke sini
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    PDF hingga 20MB {secureMode && "(Terenkripsi Aman)"}
                  </p>
                </>
              )}
              <input
                type="file"
                accept="application/pdf"
                required
                onChange={(e) => e.target.files && setFile(e.target.files[0])}
                className="hidden"
              />
            </label>
          </div>

          {/* Nomor Dokumen otomatis & terkunci */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center justify-between">
              <span>Nomor Dokumen (Otomatis &amp; Terkunci)</span>
              <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                System Generated
              </span>
            </label>
            <input
              type="text"
              disabled
              value={documentNumber}
              className="w-full rounded-xl border border-slate-200 bg-slate-100 px-3.5 py-2 text-sm text-slate-500 cursor-not-allowed select-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Deskripsi / Ringkasan (Opsional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Catatan ruang lingkup atau klausul penting..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-500 transition disabled:opacity-50"
            >
              {loading ? "Menyimpan..." : "Unggah & Simpan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
