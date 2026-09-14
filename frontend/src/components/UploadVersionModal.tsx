"use client";

import React, { useState, useEffect } from "react";
import { X, UploadCloud, FileText, Lock } from "lucide-react";
import api from "@/lib/api";

interface UploadVersionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  documentId: number;
}

export default function UploadVersionModal({
  isOpen,
  onClose,
  onSuccess,
  documentId,
}: UploadVersionModalProps) {
  const [versionNumber, setVersionNumber] = useState("v1.1");
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // State untuk popup sukses
  const [successPopup, setSuccessPopup] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setVersionNumber("v1.1");
      setNotes("");
      setFile(null);
      setError(null);
      setSuccessPopup(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError("Silakan pilih berkas PDF terlebih dahulu.");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const formData = new FormData();
      formData.append("version_number", versionNumber);
      formData.append("notes", notes);
      formData.append("file", file);

      await api.post(`/documents/${documentId}/versions`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      // Tampilkan popup sukses
      setSuccessPopup(true);
      setTimeout(() => {
        setSuccessPopup(false);
        onSuccess();
        onClose();
      }, 1500);
    } catch (err: any) {
      const errorData = err.response?.data;
      setError(errorData?.message || "Gagal mengunggah versi baru.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl transition-all my-8">
        {/* Popup Sukses Overlay (Absolute di dalam card utama) */}
        {successPopup && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/95 backdrop-blur-sm rounded-2xl">
            <div className="text-center p-6 animate-in fade-in zoom-in duration-200">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 shadow-inner">
                <svg
                  className="h-8 w-8"
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
              <h3 className="text-lg font-bold text-slate-900">
                Versi Baru Diunggah!
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Riwayat versi berhasil diamankan.
              </p>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              Unggah Versi Baru / Adendum
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 border border-emerald-200">
                <Lock className="h-3 w-3" /> AES-256
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Tambahkan riwayat versi atau adendum berkas kontrak.
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

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Nomor Versi / Adendum
            </label>
            <input
              type="text"
              required
              value={versionNumber}
              onChange={(e) => setVersionNumber(e.target.value)}
              placeholder="Contoh: v1.1 atau Adendum I"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-900 focus:bg-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Catatan Revisi / Perubahan
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Jelaskan poin perubahan atau klausul baru..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Berkas PDF Baru (Max 20MB)
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
                    PDF hingga 20MB (Terenkripsi Aman)
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
              {loading ? "Mengunggah..." : "Unggah Versi"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
